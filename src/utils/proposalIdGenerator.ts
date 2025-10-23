
export class ProposalIdGenerator {
  private static getNextProposalSequence(enqId: string): number {
    const existingProposals = this.getProposalsByEnqId(enqId);
    return existingProposals.length + 1;
  }

  private static getProposalsByEnqId(enqId: string): any[] {
    try {
      const saved = localStorage.getItem('travel_proposals_v2') || '[]';
      const proposals = JSON.parse(saved);
      return proposals.filter((p: any) => p.queryId === enqId);
    } catch (error) {
      console.error('Error getting proposals by ENQ ID:', error);
      return [];
    }
  }

  public static generateProposalId(enqId: string): string {
    const sequence = this.getNextProposalSequence(enqId);
    const paddedSequence = sequence.toString().padStart(3, '0');
    return `${enqId}-P${paddedSequence}`;
  }

  public static parseProposalId(proposalId: string): { enqId: string; sequence: number } | null {
    const match = proposalId.match(/^(.+)-P(\d{3})$/);
    if (!match) return null;
    
    return {
      enqId: match[1],
      sequence: parseInt(match[2], 10)
    };
  }

  public static getLatestProposalId(enqId: string): string | null {
    const proposals = this.getProposalsByEnqId(enqId);
    if (proposals.length === 0) return null;
    
    const latestSequence = Math.max(...proposals.map(p => {
      const parsed = this.parseProposalId(p.id);
      return parsed ? parsed.sequence : 0;
    }));
    
    return `${enqId}-P${latestSequence.toString().padStart(3, '0')}`;
  }
}
