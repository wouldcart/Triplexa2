import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import ProposalService from './proposalService';

export interface EnhancedProposalData {
  id: string;
  queryId: string;
  query: Query;
  days: ItineraryDay[];
  totalCost: number;
  pricing: {
    basePrice: number;
    markup: number;
    finalPrice: number;
    currency: string;
    adultPricing?: {
      basePrice: number;
      markup: number;
      finalPrice: number;
      perPerson: number;
    };
    childPricing?: {
      basePrice: number;
      markup: number;
      finalPrice: number;
      perPerson: number;
      discountPercent: number;
    };
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'active' | 'shared';
    shareUrl?: string;
    version: number;
  };
}

export class EnhancedProposalManager {
  private static STORAGE_KEY = 'enhanced_proposals';

  static saveEnhancedProposal(data: Partial<EnhancedProposalData>): string {
    const proposalId = data.id || `prop_${Date.now()}`;
    
    const proposal: EnhancedProposalData = {
      id: proposalId,
      queryId: data.queryId || '',
      query: data.query!,
      days: data.days || [],
      totalCost: data.totalCost || 0,
      pricing: data.pricing || {
        basePrice: 0,
        markup: 0,
        finalPrice: 0,
        currency: 'USD'
      },
      metadata: {
        createdAt: data.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: data.metadata?.status || 'draft',
        version: (data.metadata?.version || 0) + 1
      }
    };

    // Save to enhanced storage
    const saved = this.getStoredProposals();
    saved[proposalId] = proposal;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));

    // Also save to regular proposal service for compatibility
    ProposalService.saveProposal({
      queryId: proposal.queryId,
      query: proposal.query,
      modules: proposal.days.map(day => ({
        id: day.id,
        type: 'transport' as const,
        name: day.title,
        category: 'itinerary',
        data: day,
        pricing: {
          basePrice: day.totalCost,
          finalPrice: day.totalCost,
          currency: proposal.pricing.currency
        },
        status: 'active' as const
      })),
      totals: {
        subtotal: proposal.pricing.basePrice,
        discountAmount: 0,
        total: proposal.pricing.finalPrice,
        moduleCount: proposal.days.length
      }
    });

    return proposalId;
  }

  static getStoredProposals(): Record<string, EnhancedProposalData> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  static getProposal(proposalId: string): EnhancedProposalData | null {
    const proposals = this.getStoredProposals();
    return proposals[proposalId] || null;
  }

  static updateProposalStatus(proposalId: string, status: 'draft' | 'active' | 'shared', shareUrl?: string): void {
    const proposals = this.getStoredProposals();
    if (proposals[proposalId]) {
      proposals[proposalId].metadata.status = status;
      proposals[proposalId].metadata.updatedAt = new Date().toISOString();
      if (shareUrl) {
        proposals[proposalId].metadata.shareUrl = shareUrl;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(proposals));
    }
  }
}