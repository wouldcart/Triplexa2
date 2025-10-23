import { useState, useEffect } from 'react';

interface ProposalData {
  id: string;
  tripName: string;
  destination: string;
  cities: string[];
  pax: {
    adults: number;
    children: number;
    infants: number;
  };
  status: 'draft' | 'shared' | 'confirmed';
  createdDate: string;
  sharedDate?: string;
  confirmedDate?: string;
  value: string;
  clientName: string;
  createdBy: string;
  agentId?: string;
  source: 'admin' | 'staff' | 'agent';
}

// Simulated data from different sources
const mockProposals: ProposalData[] = [
  {
    id: "P001",
    tripName: "Romantic Phuket 4N/5D",
    destination: "Phuket, Thailand",
    cities: ["Phuket", "Phi Phi Islands"],
    pax: { adults: 2, children: 0, infants: 0 },
    status: "shared",
    createdDate: "2024-01-15",
    sharedDate: "2024-01-16",
    value: "$1,200",
    clientName: "John & Sarah Smith",
    createdBy: "Sarah Johnson",
    source: "agent"
  },
  {
    id: "P002", 
    tripName: "Family Dubai Adventure 6N/7D",
    destination: "Dubai, UAE",
    cities: ["Dubai", "Abu Dhabi"],
    pax: { adults: 2, children: 2, infants: 0 },
    status: "confirmed",
    createdDate: "2024-01-10",
    confirmedDate: "2024-01-18",
    value: "$2,800",
    clientName: "Williams Family",
    createdBy: "Admin Team",
    source: "admin"
  },
  {
    id: "P003",
    tripName: "Bali Honeymoon 5N/6D",
    destination: "Bali, Indonesia", 
    cities: ["Ubud", "Seminyak", "Sanur"],
    pax: { adults: 2, children: 0, infants: 0 },
    status: "draft",
    createdDate: "2024-01-20",
    value: "$1,500",
    clientName: "Mike & Emma Johnson",
    createdBy: "Staff Member",
    source: "staff"
  },
  {
    id: "P004",
    tripName: "Singapore Malaysia 7N/8D",
    destination: "Singapore & Malaysia",
    cities: ["Singapore", "Kuala Lumpur", "Genting"],
    pax: { adults: 4, children: 1, infants: 0 },
    status: "shared",
    createdDate: "2024-01-12",
    sharedDate: "2024-01-14",
    value: "$3,200",
    clientName: "Brown Group",
    createdBy: "Admin Team",
    source: "admin"
  },
  {
    id: "P005",
    tripName: "Kashmir Paradise 8N/9D",
    destination: "Kashmir, India",
    cities: ["Srinagar", "Gulmarg", "Pahalgam"],
    pax: { adults: 2, children: 1, infants: 0 },
    status: "draft",
    createdDate: "2024-01-22",
    value: "$1,800",
    clientName: "Sharma Family",
    createdBy: "Travel Coordinator",
    source: "staff"
  }
];

export const useProposalData = () => {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchProposals = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch from different endpoints:
      // - Admin proposals: /api/admin/proposals
      // - Staff proposals: /api/staff/proposals  
      // - Agent proposals: /api/agent/proposals
      setProposals(mockProposals);
      setLoading(false);
    };

    fetchProposals();
  }, []);

  const getProposalsBySource = (source: 'admin' | 'staff' | 'agent') => {
    return proposals.filter(proposal => proposal.source === source);
  };

  const getProposalsByStatus = (status: string) => {
    if (status === 'all') return proposals;
    return proposals.filter(proposal => proposal.status === status);
  };

  const updateProposalStatus = (proposalId: string, newStatus: 'draft' | 'shared' | 'confirmed') => {
    setProposals(prev => prev.map(proposal => 
      proposal.id === proposalId 
        ? { 
            ...proposal, 
            status: newStatus,
            ...(newStatus === 'shared' && !proposal.sharedDate && { sharedDate: new Date().toISOString().split('T')[0] }),
            ...(newStatus === 'confirmed' && !proposal.confirmedDate && { confirmedDate: new Date().toISOString().split('T')[0] })
          }
        : proposal
    ));
  };

  return {
    proposals,
    loading,
    getProposalsBySource,
    getProposalsByStatus,
    updateProposalStatus
  };
};