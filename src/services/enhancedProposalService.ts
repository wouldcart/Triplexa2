
import { Query, Proposal } from '@/types/query';
import { ProposalData } from '@/services/proposalService';
import { ProposalIdGenerator } from '@/utils/proposalIdGenerator';

interface ProposalChange {
  id: string;
  proposalId: string;
  timestamp: string;
  userId: string;
  changeType: 'create' | 'update' | 'duplicate' | 'status_change';
  field?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

interface ProposalVersion {
  versionId: string;
  proposalId: string;
  timestamp: string;
  data: ProposalData;
  changeDescription: string;
}

interface BulkOperationRequest {
  type: 'assign' | 'status-update' | 'export' | 'template-apply';
  queryIds: string[];
  data: any;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

export class EnhancedProposalService {
  private static instance: EnhancedProposalService;
  private proposalStorageKey = 'travel_proposals_v3';
  private changesStorageKey = 'proposal_changes_v1';
  private versionsStorageKey = 'proposal_versions_v1';

  public static getInstance(): EnhancedProposalService {
    if (!EnhancedProposalService.instance) {
      EnhancedProposalService.instance = new EnhancedProposalService();
    }
    return EnhancedProposalService.instance;
  }

  // Create new proposal with ENQ-based ID
  public createProposal(queryId: string, proposalData: Partial<ProposalData>): string {
    try {
      const proposalId = ProposalIdGenerator.generateProposalId(queryId);
      
      const newProposal: ProposalData = {
        id: proposalId,
        queryId,
        query: proposalData.query!,
        modules: proposalData.modules || [],
        totals: proposalData.totals || {
          subtotal: 0,
          discountAmount: 0,
          total: 0,
          moduleCount: 0
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
          version: 1
        }
      };

      this.saveProposal(newProposal);
      this.logChange(proposalId, 'create', 'Proposal created');
      this.saveVersion(newProposal, 'Initial proposal creation');

      return proposalId;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw new Error('Failed to create proposal');
    }
  }

  // Duplicate existing proposal
  public duplicateProposal(originalId: string, newQueryId?: string): string | null {
    try {
      const original = this.getProposal(originalId);
      if (!original) return null;

      const targetQueryId = newQueryId || original.queryId;
      const newProposalId = ProposalIdGenerator.generateProposalId(targetQueryId);

      const duplicated: ProposalData = {
        ...original,
        id: newProposalId,
        queryId: targetQueryId,
        metadata: {
          ...original.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
          version: 1
        }
      };

      this.saveProposal(duplicated);
      this.logChange(newProposalId, 'duplicate', `Duplicated from ${originalId}`);
      this.saveVersion(duplicated, `Duplicated from proposal ${originalId}`);

      return newProposalId;
    } catch (error) {
      console.error('Error duplicating proposal:', error);
      return null;
    }
  }

  // Get all proposals for a query
  public getProposalsByQuery(queryId: string): ProposalData[] {
    try {
      const allProposals = this.getAllProposals();
      return allProposals.filter(p => p.queryId === queryId)
        .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());
    } catch (error) {
      console.error('Error getting proposals by query:', error);
      return [];
    }
  }

  // Update proposal with change tracking
  public updateProposal(proposalId: string, updates: Partial<ProposalData>, changeDescription?: string): boolean {
    try {
      const existing = this.getProposal(proposalId);
      if (!existing) return false;

      const updated: ProposalData = {
        ...existing,
        ...updates,
        metadata: {
          ...existing.metadata,
          ...updates.metadata,
          updatedAt: new Date().toISOString(),
          version: existing.metadata.version + 1
        }
      };

      this.saveProposal(updated);
      this.logChange(proposalId, 'update', changeDescription || 'Proposal updated');
      this.saveVersion(updated, changeDescription || 'Proposal updated');

      return true;
    } catch (error) {
      console.error('Error updating proposal:', error);
      return false;
    }
  }

  // Process bulk operations
  public async processBulkOperation(request: BulkOperationRequest): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      for (const queryId of request.queryIds) {
        try {
          switch (request.type) {
            case 'assign':
              // Handle bulk assignment logic
              console.log(`Assigning query ${queryId} to staff ${request.data.staffId}`);
              result.success++;
              break;
            
            case 'status-update':
              // Handle bulk status update
              console.log(`Updating query ${queryId} status to ${request.data.status}`);
              result.success++;
              break;
            
            case 'export':
              // Handle bulk export
              console.log(`Exporting query ${queryId}`);
              result.success++;
              break;
            
            case 'template-apply':
              // Handle bulk template application
              console.log(`Applying template ${request.data.templateId} to query ${queryId}`);
              result.success++;
              break;
            
            default:
              throw new Error(`Unknown operation type: ${request.type}`);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to process ${queryId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      throw new Error('Bulk operation failed');
    }

    return result;
  }

  // Get proposal change history
  public getProposalChanges(proposalId: string): ProposalChange[] {
    try {
      const changes = this.getAllChanges();
      return changes.filter(c => c.proposalId === proposalId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting proposal changes:', error);
      return [];
    }
  }

  // Get proposal versions
  public getProposalVersions(proposalId: string): ProposalVersion[] {
    try {
      const versions = this.getAllVersions();
      return versions.filter(v => v.proposalId === proposalId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting proposal versions:', error);
      return [];
    }
  }

  private saveProposal(proposal: ProposalData): void {
    const proposals = this.getAllProposals();
    const existingIndex = proposals.findIndex(p => p.id === proposal.id);
    
    if (existingIndex >= 0) {
      proposals[existingIndex] = proposal;
    } else {
      proposals.push(proposal);
    }

    localStorage.setItem(this.proposalStorageKey, JSON.stringify(proposals));
  }

  private getProposal(id: string): ProposalData | null {
    const proposals = this.getAllProposals();
    return proposals.find(p => p.id === id) || null;
  }

  private getAllProposals(): ProposalData[] {
    try {
      const saved = localStorage.getItem(this.proposalStorageKey) || '[]';
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading proposals:', error);
      return [];
    }
  }

  private logChange(proposalId: string, changeType: ProposalChange['changeType'], description: string): void {
    const change: ProposalChange = {
      id: `change_${Date.now()}`,
      proposalId,
      timestamp: new Date().toISOString(),
      userId: 'current_user', // Replace with actual user ID
      changeType,
      description
    };

    const changes = this.getAllChanges();
    changes.push(change);
    localStorage.setItem(this.changesStorageKey, JSON.stringify(changes));
  }

  private getAllChanges(): ProposalChange[] {
    try {
      const saved = localStorage.getItem(this.changesStorageKey) || '[]';
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading changes:', error);
      return [];
    }
  }

  private saveVersion(proposal: ProposalData, changeDescription: string): void {
    const version: ProposalVersion = {
      versionId: `v${proposal.metadata.version}_${Date.now()}`,
      proposalId: proposal.id,
      timestamp: new Date().toISOString(),
      data: { ...proposal },
      changeDescription
    };

    const versions = this.getAllVersions();
    versions.push(version);
    localStorage.setItem(this.versionsStorageKey, JSON.stringify(versions));
  }

  private getAllVersions(): ProposalVersion[] {
    try {
      const saved = localStorage.getItem(this.versionsStorageKey) || '[]';
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading versions:', error);
      return [];
    }
  }

  // Clean up old versions (keep last 10 per proposal)
  public cleanupOldVersions(proposalId: string): void {
    try {
      const allVersions = this.getAllVersions();
      const proposalVersions = allVersions.filter(v => v.proposalId === proposalId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const versionsToKeep = proposalVersions.slice(0, 10);
      const otherVersions = allVersions.filter(v => v.proposalId !== proposalId);
      
      localStorage.setItem(this.versionsStorageKey, JSON.stringify([...otherVersions, ...versionsToKeep]));
    } catch (error) {
      console.error('Error cleaning up versions:', error);
    }
  }
}

export default EnhancedProposalService.getInstance();
