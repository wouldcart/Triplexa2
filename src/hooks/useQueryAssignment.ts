
import { useEffect, useState } from 'react';
import { AssignmentRule, AssignmentRuleType, StaffMember } from '@/types/assignment';
import { Query } from '@/types/query';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedStaffData } from '@/hooks/useEnhancedStaffData';
import { useAgentData } from '@/hooks/useAgentData';
import { getBestCountryMatch, getAssignmentReason } from '@/services/countryAssignmentService';
import { agentStaffRelationships } from '@/data/staffData';
import { assignEnquiry } from '@/services/enquiriesService';
import { assignQuery as assignQueryEngine } from '@/services/autoAssignmentEngine';
import { findBestStaffMatch as findBestStaffMatchService } from '@/services/staffAssignmentService';
import { AppSettingsService, AppSettingsHelpers } from '@/services/appSettingsService_database';

const AUTO_ASSIGN_SETTING_ID = 'b57de51f-9bb0-4a1f-b89a-415c9c57ad3f';

export const useQueryAssignment = () => {
  const [assigningQuery, setAssigningQuery] = useState<Query | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabledState] = useState<boolean | null>(null);
  const [autoAssignHydrated, setAutoAssignHydrated] = useState(false);
  const { toast } = useToast();
  
  const { getBestStaffForQuery, enhancedStaffMembers: enhancedStaff, activeStaff } = useEnhancedStaffData();
  const { getAgentById } = useAgentData();

  // Hydrate auto-assign enabled from App Settings by UUID (with safe fallback)
  useEffect(() => {
    (async () => {
      try {
        const byId = await AppSettingsService.getSettingById(AUTO_ASSIGN_SETTING_ID);
        if (byId.success && byId.data) {
          const raw = byId.data.setting_value ?? byId.data.setting_json;
          const enabled = typeof raw === 'boolean' ? raw : String(raw ?? '').toLowerCase() === 'true';
          setAutoAssignEnabledState(enabled);
          setAutoAssignHydrated(true);
          return;
        }
        // Fallback to category/key value if ID lookup didn't find data
        const val = await AppSettingsService.getSettingValue('assignment', 'auto_assign_enabled');
        const enabled = typeof val === 'boolean' ? val : String(val ?? '').toLowerCase() === 'true';
        setAutoAssignEnabledState(enabled);
        setAutoAssignHydrated(true);
      } catch (e) {
        console.warn('useQueryAssignment: failed to hydrate auto_assign_enabled', e);
        // Default safely to disabled when hydration fails
        setAutoAssignEnabledState(false);
        setAutoAssignHydrated(true);
      }
    })();
  }, []);

  // Setter that also persists to App Settings
  const setAutoAssignEnabled = async (checked: boolean) => {
    setAutoAssignEnabledState(checked);
    try {
      // Prefer updating the specific record by UUID
      const res = await AppSettingsService.updateSettingById(AUTO_ASSIGN_SETTING_ID, {
        setting_value: checked ? 'true' : 'false',
        is_active: true
      });
      if (!res.success) {
        // Fallback to upsert by category/key
        await AppSettingsHelpers.upsertSetting({
          category: 'assignment',
          setting_key: 'auto_assign_enabled',
          setting_value: checked ? 'true' : 'false',
          is_active: true
        });
      }
    } catch (e) {
      console.warn('useQueryAssignment: failed to persist auto_assign_enabled', e);
    }
  };

  // Enhanced function to find the best staff match with country priority
  const findBestStaffMatch = (query: Query): StaffMember | null => {
    // Use service-level matching with country priority and enhanced scoring
    return findBestStaffMatchService(query, enhancedStaff);
  };

  // Enhanced assignment rule application
  const applyAssignmentRule = (
    rule: AssignmentRule, 
    query: Query, 
    staff: StaffMember[]
  ): StaffMember | null => {
    switch (rule.type) {
      case 'agent-staff-relationship':
        // Check if the agent has a dedicated staff member
        const relationship = agentStaffRelationships.find(rel => 
          rel.agentId === Number(query.agentId) && 
          staff.some(s => s.id === rel.staffId)
        );
        if (relationship) {
          const dedicatedStaff = staff.find(s => s.id === relationship.staffId);
          if (dedicatedStaff && dedicatedStaff.assigned < dedicatedStaff.workloadCapacity) {
            return dedicatedStaff;
          }
        }
        return null;

      case 'expertise-match':
        // Enhanced expertise matching for destinations
        const destinations = [query.destination.country, ...query.destination.cities];
        const expertsForDestination = staff.filter(s => 
          destinations.some(dest =>
            s.expertise.some(exp => 
              exp.toLowerCase().includes(dest.toLowerCase())
            )
          )
        );
        
        if (expertsForDestination.length > 0) {
          // Sort by experience and workload
          return expertsForDestination.sort((a, b) => {
            const aLoad = a.assigned / a.workloadCapacity;
            const bLoad = b.assigned / b.workloadCapacity;
            const expertiseMatch = b.expertise.length - a.expertise.length;
            return aLoad - bLoad + (expertiseMatch * 0.1);
          })[0];
        }
        return null;

      case 'workload-balance':
        return staff
          .filter(s => s.assigned < s.workloadCapacity)
          .sort((a, b) => (a.assigned / a.workloadCapacity) - (b.assigned / b.workloadCapacity))[0];

      case 'round-robin':
        const sequencedStaff = [...staff]
          .filter(s => s.assigned < s.workloadCapacity)
          .sort((a, b) => (a.sequenceOrder || 999) - (b.sequenceOrder || 999));
        return sequencedStaff[0];

      default:
        return null;
    }
  };

  // Assign a query to staff (manual)
  const assignQueryToStaff = async (query: Query, staffId: number) => {
    setIsAssigning(true);
    try {
      const staff = activeStaff.find(s => s.id === staffId) || enhancedStaff.find(s => s.id === staffId);
      if (!staff) throw new Error('Staff not found');
      const staffIdentifier = (staff as any).uuid || staff.name;
      const reason = getAssignmentReason(staff, query);

      const { error } = await assignEnquiry(query.id, String(staffIdentifier), undefined, reason, false);
      if (error) throw error;

      const agent = getAgentById(Number(query.agentId) || 0);
      toast({
        title: 'Query Assigned Successfully',
        description: `Query ${query.id} assigned to ${staff.name} (${reason})${agent ? ` for agent ${agent.name}` : ''}`,
      });
    } catch (e: any) {
      toast({
        title: 'Assignment Failed',
        description: e?.message || 'Unable to assign enquiry',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
      setAssigningQuery(null);
      setSelectedStaffId(null);
    }
  };

  // Enhanced auto-assign with country-based matching
  const autoAssignQueries = async (queries: Query[]) => {
    if (!autoAssignHydrated || autoAssignEnabled !== true) {
      toast({
        title: !autoAssignHydrated ? 'Settings loading' : 'Auto-assignment disabled',
        description: !autoAssignHydrated ? 'Please wait while settings load' : 'Please enable auto-assignment to use this feature',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigning(true);
    try {
      let successCount = 0;
      for (const query of queries) {
        // Use the new engine which applies: Country Expertise → Agent–Staff Relationship → Workload Balance → Round Robin
        await assignQueryEngine(query.id);
        // We assume success if engine runs without throwing; the engine internally persists via assignEnquiry
        successCount += 1;
      }

      toast({
        title: 'Auto-Assignment Completed',
        description: `Processed ${successCount} queries using advanced rule hierarchy`,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Get assignment rule that would apply to this query with country priority
  const getApplicableRule = (query: Query): AssignmentRuleType | null => {
    const active = enhancedStaff.filter(staff => staff.active);
    const countryMatch = getBestCountryMatch(active, query);
    if (countryMatch) return 'expertise-match';
    return 'workload-balance';
  };

  return {
    assigningQuery,
    isAssigning,
    selectedStaffId,
    autoAssignEnabled,
    autoAssignHydrated,
    setAssigningQuery,
    setSelectedStaffId,
    setAutoAssignEnabled,
    assignQueryToStaff,
    autoAssignQueries,
    findBestStaffMatch,
    getApplicableRule
  };
};
