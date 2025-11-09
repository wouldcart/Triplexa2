import { Query, Proposal } from '@/types/query';
import { AdvancedProposalModule } from '@/types/advancedProposal';
import { mockQueries } from '@/data/queryData';
import { EnqIdGenerator } from '@/utils/enqIdGenerator';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { getCountryByName } from '@/services/countryMappingService';
import { getEnquiryById } from '@/services/enquiriesService';

export interface ProposalData {
  id: string;
  queryId: string;
  query: Query;
  modules: AdvancedProposalModule[];
  totals: {
    subtotal: number;
    discountAmount: number;
    total: number;
    moduleCount: number;
    bundleDiscounts?: any[];
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'ready' | 'sent' | 'viewed' | 'feedback-received' | 'modification-requested' | 'modified' | 'approved' | 'rejected';
    version: number;
    sentDate?: string;
    viewedDate?: string;
    agentFeedback?: {
      message: string;
      requestedChanges: string[];
      priority: 'low' | 'normal' | 'high' | 'urgent';
      receivedAt: string;
    };
    modifications?: {
      version: number;
      changes: string;
      modifiedAt: string;
      modifiedBy: string;
    }[];
  };
}

class ProposalService {
  private static instance: ProposalService;
  private storageKey = 'travel_proposals_v2';
  private queryStorageKey = 'travel_queries';

  public static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  public async createQuery(queryData: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>): Promise<Query> {
    try {
      const queries = this.getAllQueries();
      
      // Generate ID with fallback to simple format if enquiry system fails
      let enquiryId: string;
      try {
        // Map country name to country code for ID generation
        let selectedCountryCode: string | undefined;
        if (queryData.destination?.country) {
          // Use robust mapping that supports common aliases (UAE, USA, UK)
          const mapped = getCountryByName(queryData.destination.country);
          if (mapped) {
            selectedCountryCode = mapped.code;
          } else {
            const foundCountry = initialCountries.find(c => c.name === queryData.destination.country);
            selectedCountryCode = foundCountry?.code;
          }
          console.log('Creating query for country:', queryData.destination.country, 'mapped to code:', selectedCountryCode);
        }

        // Ensure Supabase-backed enquiry configuration and active countries are prepared
        await EnqIdGenerator.prepareConfig(selectedCountryCode);

        enquiryId = EnqIdGenerator.generateEnqId(selectedCountryCode);
        console.log('Generated enquiry ID:', enquiryId);
      } catch (enquiryError) {
        console.warn('EnqIdGenerator failed, using fallback ID generation:', enquiryError);
        // Fallback to simple ID generation
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        enquiryId = `ENQ${year}${randomNum}`;
        console.log('Using fallback enquiry ID:', enquiryId);
      }
      
      const newQuery: Query = {
        ...queryData,
        id: enquiryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      queries.push(newQuery);
      localStorage.setItem(this.queryStorageKey, JSON.stringify(queries));
      
      return newQuery;
    } catch (error) {
      console.error('Error creating query:', error);
      throw new Error('Failed to create query');
    }
  }

  public getAllQueries(): Query[] {
    try {
      const saved = localStorage.getItem(this.queryStorageKey) || '[]';
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading queries:', error);
      return [];
    }
  }

  public getQueryById(id: string): Query | null {
    try {
      // First try to get from localStorage
      const savedQueries = localStorage.getItem(this.queryStorageKey) || '[]';
      const queries = JSON.parse(savedQueries);
      const foundQuery = queries.find((q: Query) => q.id === id);
      
      if (foundQuery) {
        return foundQuery;
      }

      // Fallback to mock data
      const mockQuery = mockQueries.find(q => q.id === id);
      if (mockQuery) {
        return mockQuery;
      }

      return null;
    } catch (error) {
      console.error('Error loading query:', error);
      return null;
    }
  }

  // Async version with Supabase fallback while preserving existing logic
  public async getQueryByIdAsync(id: string): Promise<Query | null> {
    try {
      // First, reuse existing local/mock logic
      const localOrMock = this.getQueryById(id);
      if (localOrMock) return localOrMock;

      // Supabase fallback via enquiriesService
      const { data, error } = await getEnquiryById(id);
      if (error) {
        console.warn('Supabase getEnquiryById error:', error);
        return null;
      }
      return data || null;
    } catch (err) {
      console.warn('getQueryByIdAsync fallback failed:', err);
      return null;
    }
  }

  public saveProposal(proposalData: Partial<ProposalData>): string {
    try {
      const proposals = this.getAllProposals();
      
      // Use enhanced service for new proposals
      if (!proposalData.id && proposalData.queryId) {
        const EnhancedService = require('./enhancedProposalService').default;
        return EnhancedService.createProposal(proposalData.queryId, proposalData);
      }
      
      const proposalId = proposalData.id || `PROP_${Date.now()}`;
      
      const newProposal: ProposalData = {
        id: proposalId,
        queryId: proposalData.queryId || '',
        query: proposalData.query!,
        modules: proposalData.modules || [],
        totals: proposalData.totals || {
          subtotal: 0,
          discountAmount: 0,
          total: 0,
          moduleCount: 0
        },
        metadata: {
          createdAt: proposalData.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: proposalData.metadata?.status || 'draft',
          version: (proposalData.metadata?.version || 0) + 1
        }
      };

      const existingIndex = proposals.findIndex(p => p.id === proposalId);
      if (existingIndex >= 0) {
        proposals[existingIndex] = newProposal;
      } else {
        proposals.push(newProposal);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(proposals));
      return proposalId;
    } catch (error) {
      console.error('Error saving proposal:', error);
      throw new Error('Failed to save proposal');
    }
  }

  public getProposalById(id: string): ProposalData | null {
    try {
      const proposals = this.getAllProposals();
      return proposals.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error loading proposal:', error);
      return null;
    }
  }

  public getProposalsByQueryId(queryId: string): ProposalData[] {
    try {
      const proposals = this.getAllProposals();
      return proposals.filter(p => p.queryId === queryId);
    } catch (error) {
      console.error('Error loading proposals for query:', error);
      return [];
    }
  }

  public getAllProposals(): ProposalData[] {
    try {
      const saved = localStorage.getItem(this.storageKey) || '[]';
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading proposals:', error);
      return [];
    }
  }

  public deleteProposal(id: string): boolean {
    try {
      const proposals = this.getAllProposals();
      const filtered = proposals.filter(p => p.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return false;
    }
  }

  public exportProposal(proposal: ProposalData): void {
    try {
      const dataStr = JSON.stringify(proposal, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `proposal_${proposal.query.destination.country}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting proposal:', error);
      throw new Error('Failed to export proposal');
    }
  }

  public duplicateProposal(id: string): string | null {
    try {
      const original = this.getProposalById(id);
      if (!original) return null;

      const duplicate: ProposalData = {
        ...original,
        id: `PROP_${Date.now()}`,
        metadata: {
          ...original.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          status: 'draft'
        }
      };

      return this.saveProposal(duplicate);
    } catch (error) {
      console.error('Error duplicating proposal:', error);
      return null;
    }
  }

  public migrateToEnhancedService(): void {
    try {
      const EnhancedService = require('./enhancedProposalService').default;
      const existingProposals = this.getAllProposals();
      
      console.log(`Migrating ${existingProposals.length} proposals to enhanced service`);
      
      // This would migrate existing proposals to the new enhanced format
      // For now, both services can coexist
    } catch (error) {
      console.error('Error migrating to enhanced service:', error);
    }
  }
}

export default ProposalService.getInstance();
