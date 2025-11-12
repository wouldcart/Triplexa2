import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import { ProposalData } from '@/services/proposalService';
import EnhancedProposalService from '@/services/enhancedProposalService';
import ProposalService from '@/services/proposalService';
import SupabaseProposalService from '@/services/supabaseProposalService';
import { SmartProposalStatus } from './status/SmartProposalStatus';
import { ProposalStatusManager } from './status/ProposalStatusManager';
import { 
  FileText, ArrowRight, Clock, DollarSign, Users, 
  Plus, Edit, Eye, Copy, Trash2, AlertCircle, 
  Loader2, RefreshCw, Save, Calendar, Send, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createWorkflowEvent } from '@/services/workflowEventsService';

interface ProposalActionsProps {
  query: Query;
  onProposalStateChange?: (state: any) => void;
}

interface DraftProposal {
  id: string;
  queryId: string;
  days: any[];
  totalCost: number;
  savedAt: string;
  version?: number;
  type: 'draft';
}

const ProposalActions: React.FC<ProposalActionsProps> = ({ query, onProposalStateChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [drafts, setDrafts] = useState<DraftProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalStatuses, setProposalStatuses] = useState<Map<string, any>>(new Map());

  // Helper functions for better data management
  const getDraftFromLocalStorage = (key: string): any => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error parsing localStorage data for ${key}:`, error);
      return null;
    }
  };

  const createDraftFromData = (id: string, data: any, type: 'daywise' | 'enhanced'): DraftProposal | null => {
    if (!data) return null;
    
    if (type === 'daywise' && data.days && Array.isArray(data.days) && data.days.length > 0) {
      return {
        id,
        queryId: query.id,
        days: data.days,
        totalCost: data.totalCost || 0,
        savedAt: data.savedAt || new Date().toISOString(),
        version: data.version || 1,
        type: 'draft'
      };
    }
    
    if (type === 'enhanced' && Array.isArray(data) && data.length > 0) {
      return {
        id,
        queryId: query.id,
        days: data,
        totalCost: data.reduce((sum: number, module: any) => sum + (module.pricing?.finalPrice || 0), 0),
        savedAt: new Date().toISOString(),
        version: 1,
        type: 'draft'
      };
    }
    
    return null;
  };

  const removeDuplicateProposals = (proposals: ProposalData[]): ProposalData[] => {
    const seen = new Set<string>();
    return proposals.filter(proposal => {
      if (seen.has(proposal.id)) return false;
      seen.add(proposal.id);
      return true;
    });
  };

  const loadProposalsAndDrafts = async (showToastOnError = true) => {
    try {
      setRefreshing(true);
      setError(null);

      // 1) Load Supabase proposals/drafts
      const { data: sbRows, error: sbError } = await SupabaseProposalService.listProposalsByEnquiry(query.id);
      if (sbError && showToastOnError) {
        console.warn('Supabase list error:', sbError);
        toast({
          title: 'Supabase fetch failed',
          description: 'Falling back to local proposals and drafts',
          variant: 'destructive'
        });
      }

      const mapRowToProposalData = (row: any): ProposalData => {
        const itinerary = Array.isArray(row?.itinerary_data)
          ? { days: row.itinerary_data, sightseeing_options: [], city_selection: null }
          : (row?.itinerary_data || { days: [], sightseeing_options: [], city_selection: null });
        const moduleCount = Array.isArray(itinerary.days) ? itinerary.days.length : 0;
        const total = typeof row?.total_cost === 'number' ? row.total_cost : (row?.final_price || 0);
        return {
          id: row.proposal_id,
          queryId: query.id,
          query,
          modules: [],
          totals: {
            subtotal: total,
            discountAmount: 0,
            total,
            moduleCount,
          },
          metadata: {
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || row.last_saved || row.created_at || new Date().toISOString(),
            status: row.status || 'draft',
            version: row.version || 1,
            sentDate: row.sent_at || undefined,
            viewedDate: row.viewed_at || undefined,
            agentFeedback: row.agent_feedback || undefined,
            modifications: row.modifications || [],
          }
        };
      };

      const mapRowToDraft = (row: any): DraftProposal | null => {
        const itinerary = Array.isArray(row?.itinerary_data)
          ? { days: row.itinerary_data, sightseeing_options: [], city_selection: null }
          : (row?.itinerary_data || { days: [], sightseeing_options: [], city_selection: null });
        const days = Array.isArray(itinerary.days) ? itinerary.days : [];
        const total = typeof row?.total_cost === 'number' ? row.total_cost : (row?.final_price || 0);
        if (!row?.proposal_id || !row?.status || row.status !== 'draft') return null;
        if (String(row.proposal_id).startsWith('DRAFT-')) {
          return {
            id: row.proposal_id,
            queryId: query.id,
            days,
            totalCost: total || 0,
            savedAt: row.last_saved || row.updated_at || row.created_at || new Date().toISOString(),
            version: row.version || 1,
            type: 'draft'
          };
        }
        return null;
      };

      const sbProposals: ProposalData[] = (sbRows || [])
        .filter((r: any) => !String(r.proposal_id).startsWith('DRAFT-'))
        .map(mapRowToProposalData);
      const sbDrafts: DraftProposal[] = (sbRows || [])
        .map(mapRowToDraft)
        .filter((d: any) => d !== null) as DraftProposal[];

      // 2) Load saved proposals from local for legacy compatibility, then merge
      const savedProposals = EnhancedProposalService.getProposalsByQuery(query.id);
      const legacyProposals = ProposalService.getProposalsByQueryId(query.id);
      const allProposals = [...sbProposals, ...savedProposals, ...legacyProposals];
      const uniqueProposals = removeDuplicateProposals(allProposals);
      setProposals(uniqueProposals);

      // Load drafts with improved error handling and validation
      const draftData: DraftProposal[] = [];

      // Add Supabase drafts first
      sbDrafts.forEach((d) => draftData.push(d));
      
      // Check for auto-save draft (day-wise itinerary)
      const autoSaveDraft = getDraftFromLocalStorage(`proposal_draft_${query.id}`);
      console.log('Auto-save draft found:', autoSaveDraft ? 'Yes' : 'No');
      if (autoSaveDraft) {
        const dayWiseDraft = createDraftFromData(`draft_${query.id}`, autoSaveDraft, 'daywise');
        if (dayWiseDraft) {
          console.log('Day-wise draft created:', dayWiseDraft);
          draftData.push(dayWiseDraft);
        }
      }

      // Check for enhanced proposal modules
      const enhancedModules = getDraftFromLocalStorage(`enhanced_proposal_modules_${query.id}`);
      console.log('Enhanced modules found:', enhancedModules ? 'Yes' : 'No');
      if (enhancedModules) {
        const enhancedDraft = createDraftFromData(`enhanced_draft_${query.id}`, enhancedModules, 'enhanced');
        if (enhancedDraft) {
          console.log('Enhanced draft created:', enhancedDraft);
          draftData.push(enhancedDraft);
        }
      }

      // Additional localStorage keys to check for drafts
      const additionalKeys = [
        `daywise_itinerary_${query.id}`,
        `proposal_modules_${query.id}`,
        `enhanced_daywise_${query.id}`
      ];

      additionalKeys.forEach(key => {
        const data = getDraftFromLocalStorage(key);
        if (data && !draftData.find(d => d.id.includes(key))) {
          const draft = createDraftFromData(`additional_${key}`, data, key.includes('enhanced') ? 'enhanced' : 'daywise');
          if (draft) {
            console.log(`Additional draft found for key ${key}:`, draft);
            draftData.push(draft);
          }
        }
      });

      console.log('Total drafts loaded:', draftData.length);
      setDrafts(draftData);

      // Load proposal statuses
      const statusMap = new Map();
      uniqueProposals.forEach(proposal => {
        const status = {
          id: proposal.id,
          queryId: proposal.queryId,
          status: proposal.metadata.status as any || 'draft',
          lastModified: proposal.metadata.updatedAt,
          version: proposal.metadata.version,
          totalAmount: proposal.totals.total,
          sentDate: proposal.metadata.sentDate || undefined,
          viewedDate: proposal.metadata.viewedDate || undefined,
          agentFeedback: proposal.metadata.agentFeedback || undefined,
          modifications: proposal.metadata.modifications || []
        };
        statusMap.set(proposal.id, status);
      });
      setProposalStatuses(statusMap);

      // Notify parent of state change
      const mapProposalStatus = (status: string) => {
        const statusMap: { [key: string]: any } = {
          'draft': 'draft',
          'ready': 'ready', 
          'sent': 'sent',
          'viewed': 'viewed',
          'feedback-received': 'feedback-received',
          'modification-requested': 'modification-requested',
          'modified': 'modified',
          'approved': 'ready',
          'rejected': 'modification-requested'
        };
        return statusMap[status] || 'draft';
      };

      const proposalState = {
        hasProposals: uniqueProposals.length > 0,
        hasDrafts: draftData.length > 0,
        proposalCount: uniqueProposals.length,
        draftCount: draftData.length,
        lastProposalStatus: uniqueProposals[0] ? mapProposalStatus(uniqueProposals[0].metadata.status) : undefined,
        lastActivity: uniqueProposals[0]?.metadata.updatedAt || draftData[0]?.savedAt,
        needsAttention: uniqueProposals.some(p => 
          ['feedback-received', 'modification-requested'].includes(p.metadata.status)
        )
      };
      onProposalStateChange?.(proposalState);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error loading proposals and drafts:', error);
      
      if (showToastOnError) {
        toast({
          title: "Error loading proposals",
          description: "Failed to load proposals and drafts for this query",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProposalsAndDrafts();
    
    // Set up optimized polling - only when tab is visible and reduce frequency
    let interval: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh when user returns to tab
        loadProposalsAndDrafts(false);
        // Set up polling every 30 seconds when visible
        interval = setInterval(() => loadProposalsAndDrafts(false), 30000);
      } else {
        // Clear polling when tab is hidden
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial setup
    if (document.visibilityState === 'visible') {
      interval = setInterval(() => loadProposalsAndDrafts(false), 30000);
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (interval) clearInterval(interval);
    };
  }, [query.id]);

  const handleCreateNewProposal = () => {
    try {
      // Log UI engagement: Create New Proposal clicked
      void createWorkflowEvent({
        enquiryBusinessId: query.id,
        eventType: 'ui_engagement',
        userId: user?.id || null,
        userName: user?.name || null,
        userRole: user?.role || null,
        details: 'Create New Proposal clicked',
        metadata: {
          action: 'create_new_proposal',
          source: 'ProposalActions',
          routeTo: `/queries/advanced-proposal/${encodeURIComponent(query.id)}`,
        }
      });
    } catch (e) {
      // Non-blocking: do not interrupt navigation if logging fails
      console.warn('Failed to log Create New Proposal click:', e);
    }
    navigate(`/queries/advanced-proposal/${encodeURIComponent(query.id)}`);
  };

  const validateAndFixDraftData = (draftId: string): boolean => {
    try {
      if (draftId.includes('enhanced')) {
        const data = getDraftFromLocalStorage(`enhanced_proposal_modules_${query.id}`);
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(`enhanced_proposal_modules_${query.id}`, JSON.stringify(data));
          return true;
        }
      } else {
        const data = getDraftFromLocalStorage(`proposal_draft_${query.id}`);
        if (data?.days && Array.isArray(data.days) && data.days.length > 0) {
          localStorage.setItem(`proposal_draft_${query.id}`, JSON.stringify(data));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error validating draft data:', error);
      return false;
    }
  };

  const handleEditDraft = async (draftId: string) => {
    try {
      const draft = drafts.find(d => d.id === draftId);
      if (!draft) {
        toast({
          title: "Draft not found",
          description: "The selected draft could not be found. Please try refreshing the page.",
          variant: "destructive"
        });
        return;
      }

      // If draft is Supabase-backed, hydrate local storage for the builder to load
      if (draftId.startsWith('DRAFT-')) {
        try {
          const { data: sbDraft } = await SupabaseProposalService.getDraftByProposalId(draftId);
          if (sbDraft) {
            const draftType = sbDraft.draft_type === 'enhanced' ? 'enhanced' : 'daywise';
            const itinerary = Array.isArray(sbDraft?.itinerary_data)
              ? { days: sbDraft.itinerary_data, sightseeing_options: [], city_selection: null }
              : (sbDraft?.itinerary_data || { days: [], sightseeing_options: [], city_selection: null });
            const storageKey = draftType === 'enhanced'
              ? `enhanced_proposal_modules_${query.id}`
              : `proposal_draft_${query.id}`;
            const payload = draftType === 'enhanced' ? (Array.isArray(itinerary.days) ? itinerary.days : []) : {
              days: Array.isArray(itinerary.days) ? itinerary.days : [],
              totalCost: typeof sbDraft?.total_cost === 'number' ? sbDraft.total_cost : (sbDraft?.final_price || 0),
              savedAt: sbDraft.last_saved || sbDraft.updated_at || sbDraft.created_at || new Date().toISOString(),
              version: sbDraft.version || 1
            };
            localStorage.setItem(storageKey, JSON.stringify(payload));
          }
        } catch (e) {
          console.warn('Hydration failed for draft', draftId, e);
        }
      } else {
        // Validate and fix local draft data before navigation
        if (!validateAndFixDraftData(draftId)) {
          toast({
            title: "Invalid draft data",
            description: "The draft data appears to be corrupted. Please create a new proposal.",
            variant: "destructive"
          });
          return;
        }
      }

      // Always navigate to advanced proposal with appropriate parameters
      const targetRoute = `/queries/advanced-proposal/${encodeURIComponent(query.id)}`;
      const isDayWiseDraft = !draftId.includes('enhanced');
      
      // Add URL parameters to indicate draft type and activate appropriate tab
      const params = new URLSearchParams();
      params.set('draftId', draftId);
      params.set('loadDraft', 'true');
      if (isDayWiseDraft) {
        params.set('tab', 'itinerary');
        params.set('draftType', 'daywise');
      } else {
        params.set('tab', 'templates');
        params.set('draftType', 'enhanced');
      }
      
      const finalRoute = `${targetRoute}?${params.toString()}`;
      
      console.log(`Navigating to: ${finalRoute} for draft: ${draftId}`);
      // Track selection
      try {
        void createWorkflowEvent({
          enquiryBusinessId: query.id,
          eventType: 'ui_engagement',
          userId: user?.id || null,
          userName: user?.name || null,
          userRole: user?.role || null,
          details: 'Continue draft clicked',
          metadata: { action: 'continue_draft', draftId, source: 'ProposalActions' }
        });
      } catch (e) {
        console.warn('Failed to log Continue draft click:', e);
      }
      navigate(finalRoute);
      
      toast({
        title: "Loading draft",
        description: `Opening ${isDayWiseDraft ? 'day-wise itinerary' : 'enhanced proposal'} in advanced proposal builder`
      });
    } catch (error) {
      console.error('Error navigating to draft:', error);
      toast({
        title: "Navigation failed",
        description: "Failed to open the draft. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewProposal = (proposalId: string) => {
    // Navigate to the proposal creation page in view mode
    navigate(`/queries/advanced-proposal/${encodeURIComponent(query.id)}?proposalId=${proposalId}&mode=view`);
  };

  const handleEditProposal = (proposalId: string) => {
    // Navigate to the proposal creation page in edit mode
    navigate(`/queries/advanced-proposal/${encodeURIComponent(query.id)}?proposalId=${proposalId}&mode=edit`);
  };

  const handleDuplicateProposal = async (proposalId: string) => {
    try {
      // Prefer local duplication for legacy proposals; Supabase duplication would be server-side.
      const newProposalId = EnhancedProposalService.duplicateProposal(proposalId);
      if (newProposalId) {
        await loadProposalsAndDrafts();
        toast({
          title: "Proposal duplicated",
          description: `New proposal ${newProposalId} created successfully`
        });
      } else {
        throw new Error('Duplication returned no ID');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Duplication error:', error);
      toast({
        title: "Duplication failed",
        description: `Failed to duplicate the proposal: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const storageKey = draftId.includes('enhanced') 
        ? `enhanced_proposal_modules_${query.id}`
        : `proposal_draft_${query.id}`;
      
      localStorage.removeItem(storageKey);

      // Also delete remote draft if it's Supabase-backed
      if (draftId.startsWith('DRAFT-')) {
        try {
          await SupabaseProposalService.deleteByProposalId(draftId);
        } catch (e) {
          console.warn('Supabase draft delete failed:', e);
        }
      }
      
      // Update state immediately for better UX
      setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draftId));
      
      // Refresh data to ensure consistency
      await loadProposalsAndDrafts(false);
      
      toast({
        title: "Draft deleted",
        description: "Draft has been removed successfully"
      });
      // Track deletion
      try {
        void createWorkflowEvent({
          enquiryBusinessId: query.id,
          eventType: 'ui_engagement',
          userId: user?.id || null,
          userName: user?.name || null,
          userRole: user?.role || null,
          details: 'Delete draft clicked',
          metadata: { action: 'delete_draft', draftId, source: 'ProposalActions' }
        });
      } catch (e) {
        console.warn('Failed to log Delete draft click:', e);
      }
    } catch (error) {
      console.error('Delete draft error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the draft",
        variant: "destructive"
      });
      // Refresh to restore state if deletion failed
      loadProposalsAndDrafts(false);
    }
    setDeleteDialog(null);
  };

  const handleConvertDraftToProposal = async (draft: DraftProposal) => {
    try {
      // Create a new proposal in Supabase from the draft
      const { proposal_id, error } = await SupabaseProposalService.createProposal({
        query,
        days: draft.days,
        totalCost: draft.totalCost,
        draftType: draft.id.includes('enhanced') ? 'enhanced' : 'daywise',
      });
      if (error) throw error;

      // Remove the draft
      handleDeleteDraft(draft.id);
      
      await loadProposalsAndDrafts();
      toast({
        title: "Draft converted",
        description: `Draft converted to proposal ${proposal_id}`
      });
      // Track conversion
      try {
        void createWorkflowEvent({
          enquiryBusinessId: query.id,
          eventType: 'ui_engagement',
          userId: user?.id || null,
          userName: user?.name || null,
          userRole: user?.role || null,
          details: 'Save as Proposal clicked',
          metadata: { action: 'convert_draft', draftId: draft.id, proposalId: proposal_id, source: 'ProposalActions' }
        });
      } catch (e) {
        console.warn('Failed to log Save as Proposal click:', e);
      }
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "Failed to convert draft to proposal",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProposalStatusUpdate = async (proposalId: string, status: any, data?: any) => {
    // Prefer Supabase for remote proposals (no underscore in ID), fallback to local
    try {
      if (proposalId.startsWith('PROP') && !proposalId.includes('_')) {
        await SupabaseProposalService.updateProposalStatus(proposalId, status);
      } else {
        const proposal = proposals.find(p => p.id === proposalId);
        if (proposal) {
          const updatedMetadata = { ...proposal.metadata, status, ...data };
          EnhancedProposalService.updateProposal(proposalId, { metadata: updatedMetadata });
        }
      }

      // Update local state
      setProposalStatuses(prev => {
        const newMap = new Map(prev);
        const currentStatus = newMap.get(proposalId) || {};
        newMap.set(proposalId, { ...currentStatus, status, ...data });
        return newMap;
      });

      // Refresh data
      await loadProposalsAndDrafts(false);
    } catch (e) {
      console.error('Status update error:', e);
      toast({ title: 'Status update failed', description: 'Could not update proposal status', variant: 'destructive' });
    }
  };

  const handleModificationRequest = (proposalId: string, modification: any) => {
    const currentStatus = proposalStatuses.get(proposalId);
    if (currentStatus) {
      const updatedModifications = [...(currentStatus.modifications || []), modification];
      handleProposalStatusUpdate(proposalId, 'modified', { 
        modifications: updatedModifications,
        version: modification.version
      });
    }
  };

  const handleResendProposal = (proposalId: string) => {
    handleProposalStatusUpdate(proposalId, 'sent', {
      sentDate: new Date().toISOString(),
      viewedDate: null // Reset viewed date on resend
    });
  };

  const handleContinueFirstDraft = () => {
    if (drafts.length > 0) {
      handleEditDraft(drafts[0].id);
    }
  };

  const mapProposalStatus = (status: string) => {
    const statusMap: { [key: string]: any } = {
      'draft': 'draft',
      'ready': 'ready', 
      'sent': 'sent',
      'viewed': 'viewed',
      'feedback-received': 'feedback-received',
      'modification-requested': 'modification-requested',
      'modified': 'modified',
      'approved': 'ready',
      'rejected': 'modification-requested'
    };
    return statusMap[status] || 'draft';
  };

  const proposalState = {
    hasProposals: proposals.length > 0,
    hasDrafts: drafts.length > 0,
    proposalCount: proposals.length,
    draftCount: drafts.length,
    lastProposalStatus: proposals[0] ? mapProposalStatus(proposals[0].metadata.status) : undefined,
    lastActivity: proposals[0]?.metadata.updatedAt || drafts[0]?.savedAt,
    needsAttention: Array.from(proposalStatuses.values()).some(status => 
      ['feedback-received', 'modification-requested'].includes(status.status)
    )
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading proposals and drafts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = proposals.length + drafts.length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Smart Status Display */}
      <div className="w-full">
        <SmartProposalStatus
          query={query}
          proposalState={proposalState}
          onCreateNew={handleCreateNewProposal}
          onContinueDraft={handleContinueFirstDraft}
          onViewProposal={() => handleViewProposal(proposals[0]?.id)}
        />
      </div>

      {/* Individual Proposal Status Managers */}
      {proposals.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm md:text-md font-medium">Proposal Status</h4>
            <Badge variant="secondary" className="text-xs">{proposals.length}</Badge>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            {proposals.map((proposal) => {
              const statusData = proposalStatuses.get(proposal.id);
              return statusData ? (
                <ProposalStatusManager
                  key={proposal.id}
                  proposal={statusData}
                  query={query}
                  onStatusUpdate={handleProposalStatusUpdate}
                  onModificationRequest={handleModificationRequest}
                  onResend={handleResendProposal}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Simplified Header with Clear Hierarchy */}
      <div className="space-y-3">
        {/* Title and Quick Stats */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base md:text-lg font-semibold">Proposals & Drafts</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {query.paxDetails.adults + query.paxDetails.children} PAX
              </div>
              {totalItems > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {totalItems} items
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto max-w-full">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadProposalsAndDrafts()}
              disabled={refreshing}
              className="w-full sm:w-auto sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
            <Button 
              onClick={handleCreateNewProposal} 
              size="sm"
              className="w-full sm:w-auto sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-2">Create New</span>
            </Button>
          </div>
        </div>
      </div>


      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-md font-medium">Draft Proposals</h4>
            <Badge variant="secondary">{drafts.length}</Badge>
          </div>
          
          {drafts.map((draft) => (
            <Card key={draft.id} className="border-l-4 border-l-orange-500 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 self-start">
                        Draft
                      </Badge>
                      <h3 className="font-semibold">
                        {draft.id.includes('enhanced') ? 'Enhanced Proposal Draft' : 'Day-wise Itinerary Draft'}
                      </h3>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Saved: {formatDate(draft.savedAt)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <FileText className="h-4 w-4" />
                        {draft.days.length} days planned
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        Total: {formatCurrency(draft.totalCost)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditDraft(draft.id)}
                      className="gap-1 w-full sm:w-auto"
                    >
                      <Edit className="h-3 w-3" />
                      Continue
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleConvertDraftToProposal(draft)}
                      className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 w-full sm:w-auto"
                    >
                      <Save className="h-3 w-3" />
                      Save as Proposal
                    </Button>
                    <Dialog open={deleteDialog === draft.id} onOpenChange={(open) => setDeleteDialog(open ? draft.id : null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Draft</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Are you sure you want to delete this draft?</p>
                          <p className="text-sm text-gray-600">This action cannot be undone.</p>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDeleteDraft(draft.id)}
                            >
                              Delete Draft
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Saved Proposals Section */}
      {proposals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-md font-medium">Saved Proposals</h4>
            <Badge variant="secondary">{proposals.length}</Badge>
          </div>
          
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">{proposal.id}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={proposal.metadata.status === 'draft' ? 'secondary' : 'default'}>
                          {proposal.metadata.status}
                        </Badge>
                        <Badge variant="outline">
                          v{proposal.metadata.version}
                        </Badge>
                        {proposal.modules.length > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {proposal.modules.length} modules
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Created: {formatDate(proposal.metadata.createdAt)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        Updated: {formatDate(proposal.metadata.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        Total: {formatCurrency(proposal.totals.total)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewProposal(proposal.id)}
                      className="gap-1 w-full sm:w-auto"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => handleEditProposal(proposal.id)}
                       className="gap-1 w-full sm:w-auto"
                     >
                       <Edit className="h-3 w-3" />
                       Modify
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => handleProposalStatusUpdate(proposal.id, 'sent', { sentDate: new Date().toISOString() })}
                       className="gap-1 w-full sm:w-auto text-green-600 hover:text-green-700"
                       disabled={proposal.metadata.status === 'sent'}
                     >
                       <Send className="h-3 w-3" />
                       {proposal.metadata.status === 'sent' ? 'Sent' : 'Send to Agent'}
                     </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicateProposal(proposal.id)}
                      className="gap-1 w-full sm:w-auto"
                    >
                      <Copy className="h-3 w-3" />
                      Duplicate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No proposals or drafts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first proposal for this enquiry to get started
            </p>
            <Button onClick={handleCreateNewProposal} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Proposal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalActions;
