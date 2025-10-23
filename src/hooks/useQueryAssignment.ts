
import { useState } from 'react';
import { AssignmentRule, AssignmentRuleType, StaffMember } from '@/types/assignment';
import { Query } from '@/types/query';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedStaffData } from '@/hooks/useEnhancedStaffData';
import { useAgentData } from '@/hooks/useAgentData';
import { staffMembers, agentStaffRelationships, assignmentRules } from '@/data/staffData';
import { mockQueries } from '@/data/queryData';
import { getBestCountryMatch, getAssignmentReason } from '@/services/countryAssignmentService';

export const useQueryAssignment = () => {
  const [assigningQuery, setAssigningQuery] = useState<Query | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const { toast } = useToast();
  
  const { getBestStaffForQuery, activeStaff: enhancedStaff } = useEnhancedStaffData();
  const { getAgentById } = useAgentData();

  // Enhanced function to find the best staff match with country priority
  const findBestStaffMatch = (query: Query): StaffMember | null => {
    const activeStaff = enhancedStaff.filter(staff => 
      staff.active && 
      staff.autoAssignEnabled && 
      staff.assigned < staff.workloadCapacity
    );
    
    if (activeStaff.length === 0) return null;

    // Priority 1: Country-based matching
    const countryMatch = getBestCountryMatch(activeStaff, query);
    if (countryMatch) {
      return countryMatch;
    }

    // Priority 2: Agent-staff relationship
    const relationship = agentStaffRelationships.find(rel => 
      rel.agentId === query.agentId && 
      activeStaff.some(s => s.id === rel.staffId)
    );
    if (relationship) {
      const dedicatedStaff = activeStaff.find(s => s.id === relationship.staffId);
      if (dedicatedStaff) return dedicatedStaff;
    }

    // Priority 3: Enhanced matching from existing logic
    const destinations = [query.destination.country, ...query.destination.cities];
    const bestMatches = getBestStaffForQuery(destinations, query.packageType);
    const availableMatches = bestMatches.filter(staff => 
      staff.assigned < staff.workloadCapacity
    );
    
    if (availableMatches.length > 0) {
      return availableMatches[0];
    }

    // Final fallback: lowest workload
    return activeStaff.sort((a, b) => 
      (a.assigned / a.workloadCapacity) - (b.assigned / b.workloadCapacity)
    )[0];
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
          rel.agentId === query.agentId && 
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
  const assignQueryToStaff = (queryId: string, staffId: number) => {
    setIsAssigning(true);
    
    setTimeout(() => {
      const staff = enhancedStaff.find(s => s.id === staffId);
      const query = mockQueries.find(q => q.id === queryId);
      const agent = getAgentById(parseInt(queryId.split('ENQ')[1]) || 1);
      
      if (query && staff) {
        const reason = getAssignmentReason(staff, query);
        
        toast({
          title: "Query Assigned Successfully",
          description: `Query ${queryId} assigned to ${staff.name} (${reason})${agent ? ` for agent ${agent.name}` : ''}`,
        });
        
        // Update staff workload
        const staffIndex = enhancedStaff.findIndex(s => s.id === staffId);
        if (staffIndex !== -1) {
          enhancedStaff[staffIndex].assigned += 1;
        }
        
        // Update query status
        const queryIndex = mockQueries.findIndex(q => q.id === queryId);
        if (queryIndex !== -1) {
          mockQueries[queryIndex].status = 'assigned';
        }
      }
      
      setIsAssigning(false);
      setAssigningQuery(null);
      setSelectedStaffId(null);
    }, 500);
  };

  // Enhanced auto-assign with country-based matching
  const autoAssignQueries = (queries: Query[]) => {
    if (!autoAssignEnabled) {
      toast({
        title: "Auto-assignment disabled",
        description: "Please enable auto-assignment to use this feature",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    
    setTimeout(() => {
      let successCount = 0;
      const assignments: { queryId: string; staffName: string; reason: string }[] = [];
      
      queries.forEach(query => {
        const bestMatch = findBestStaffMatch(query);
        if (bestMatch) {
          // Update staff assigned count
          const staffIndex = enhancedStaff.findIndex(s => s.id === bestMatch.id);
          if (staffIndex !== -1) {
            enhancedStaff[staffIndex].assigned += 1;
            
            const reason = getAssignmentReason(bestMatch, query);
            
            assignments.push({
              queryId: query.id,
              staffName: bestMatch.name,
              reason
            });
            
            successCount++;
            
            // Update query status
            const queryIndex = mockQueries.findIndex(q => q.id === query.id);
            if (queryIndex !== -1) {
              mockQueries[queryIndex].status = 'assigned';
            }
          }
        }
      });
      
      if (successCount > 0) {
        toast({
          title: "Auto-Assignment Completed",
          description: `Successfully assigned ${successCount} queries with country-based matching`,
        });
      } else {
        toast({
          title: "Auto-assignment failed",
          description: "No suitable staff members available or all at capacity",
          variant: "destructive",
        });
      }
      
      setIsAssigning(false);
    }, 800);
  };

  // Get assignment rule that would apply to this query with country priority
  const getApplicableRule = (query: Query): AssignmentRuleType | null => {
    // Check country match first
    const activeStaff = enhancedStaff.filter(staff => staff.active);
    const countryMatch = getBestCountryMatch(activeStaff, query);
    if (countryMatch) return "expertise-match"; // Using expertise-match to represent country match
    
    // Check agent-staff relationship
    const relationship = agentStaffRelationships.find(rel => rel.agentId === query.agentId);
    if (relationship) return "agent-staff-relationship";
    
    return "workload-balance";
  };

  return {
    assigningQuery,
    isAssigning,
    selectedStaffId,
    autoAssignEnabled,
    setAssigningQuery,
    setSelectedStaffId,
    setAutoAssignEnabled,
    assignQueryToStaff,
    autoAssignQueries,
    findBestStaffMatch,
    getApplicableRule
  };
};
