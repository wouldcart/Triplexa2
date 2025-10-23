import { Agent, AgentActivity, Customer, StaffAssignment } from "@/types/agent";
import { Query, Proposal } from "@/types/query";
import { mockQueries } from './queryData';

// Mock agent data
export const agents: Agent[] = [
  {
    id: 1,
    name: "Global Travel Solutions",
    email: "contact@globaltravelsolutions.com",
    country: "United States",
    city: "New York",
    type: "company",
    status: "active",
    commissionType: "percentage",
    commissionValue: "15%",
    profileImage: "/placeholder.svg",
    contact: {
      email: "contact@globaltravelsolutions.com",
      phone: "+1 (212) 555-7890",
      website: "www.globaltravelsolutions.com",
      address: "123 Broadway, New York, NY 10001"
    },
    joinDate: "2023-01-15",
    createdAt: "2023-01-15T10:30:00Z",
    createdBy: {
      staffId: 1,
      staffName: "John Doe"
    },
    source: {
      type: "event",
      details: "Travel Expo 2023, New York"
    },
    stats: {
      totalQueries: 142,
      totalBookings: 87,
      conversionRate: 61.3,
      revenueGenerated: 235000,
      averageBookingValue: 2700,
      activeCustomers: 65
    },
    staffAssignments: [
      {
        staffId: 1,
        staffName: "John Doe",
        role: "Senior Agent",
        isPrimary: true,
        assignedAt: "2023-01-15T10:30:00Z",
        assignedBy: "System",
        notes: "Initial creator assignment"
      },
      {
        staffId: 4,
        staffName: "Sarah Williams",
        role: "Senior Agent",
        isPrimary: false,
        assignedAt: "2023-03-22T14:15:00Z",
        assignedBy: "John Doe",
        notes: "Added as backup agent"
      }
    ],
    recentActivity: [
      {
        date: "2025-05-20T14:23:15Z",
        action: "Created Query",
        details: "New query for Thailand package",
        entityId: "ENQ20250001",
        entityType: "query"
      },
      {
        date: "2025-05-19T09:45:22Z",
        action: "Confirmed Booking",
        details: "Dubai family package for Johnson family",
        entityId: "BK20250023",
        entityType: "booking"
      },
      {
        date: "2025-05-18T16:12:08Z",
        action: "Updated Query",
        details: "Modified travel dates for Singapore trip",
        entityId: "ENQ20250002",
        entityType: "query"
      }
    ],
    topCustomers: [
      {
        id: "CUS001",
        name: "Robert Johnson",
        email: "robert.j@example.com",
        phone: "+1 (212) 555-1234",
        bookingsCount: 5,
        totalSpent: 15600,
        lastBookingDate: "2025-04-15"
      },
      {
        id: "CUS002",
        name: "Emily Davis",
        email: "emily.d@example.com",
        phone: "+1 (212) 555-5678",
        bookingsCount: 3,
        totalSpent: 9800,
        lastBookingDate: "2025-05-02"
      }
    ]
  },
  {
    id: 2,
    name: "Dream Tours",
    email: "info@dreamtours.com",
    country: "United Kingdom",
    city: "London",
    type: "company",
    status: "active",
    commissionType: "percentage",
    commissionValue: "10%",
    profileImage: "/placeholder.svg",
    contact: {
      email: "info@dreamtours.com",
      phone: "+44 20 7123 4567",
      website: "www.dreamtours.com",
      address: "45 Oxford Street, London, UK"
    },
    joinDate: "2023-03-22",
    createdAt: "2023-03-22T09:15:00Z",
    createdBy: {
      staffId: 4,
      staffName: "Sarah Williams"
    },
    source: {
      type: "lead",
      details: "BNA Lead - Marketing Campaign Spring 2023"
    },
    stats: {
      totalQueries: 98,
      totalBookings: 54,
      conversionRate: 55.1,
      revenueGenerated: 156000,
      averageBookingValue: 2889,
      activeCustomers: 42
    },
    staffAssignments: [
      {
        staffId: 4,
        staffName: "Sarah Williams",
        role: "Senior Agent",
        isPrimary: true,
        assignedAt: "2023-03-22T09:15:00Z",
        assignedBy: "System",
        notes: "Initial creator assignment"
      }
    ],
    recentActivity: [
      {
        date: "2025-05-21T11:30:45Z",
        action: "Created Query",
        details: "Luxury Paris getaway for Smith couple",
        entityId: "ENQ20250008",
        entityType: "query"
      },
      {
        date: "2025-05-20T15:22:11Z",
        action: "Sent Proposal",
        details: "Italy tour package proposal",
        entityId: "PROP-015",
        entityType: "proposal"
      }
    ]
  },
  {
    id: 3,
    name: "Ahmed Hassan",
    email: "ahmed.hassan@gmail.com",
    country: "United Arab Emirates",
    city: "Dubai",
    type: "individual",
    status: "active",
    commissionType: "flat",
    commissionValue: "$50 per booking",
    profileImage: "/placeholder.svg",
    contact: {
      email: "ahmed.hassan@gmail.com",
      phone: "+971 50 123 4567"
    },
    joinDate: "2023-05-10",
    createdAt: "2023-05-10T13:40:00Z",
    createdBy: {
      staffId: 2,
      staffName: "Jane Smith"
    },
    source: {
      type: "referral",
      details: "Referred by Dream Tours"
    },
    stats: {
      totalQueries: 56,
      totalBookings: 31,
      conversionRate: 55.4,
      revenueGenerated: 89500,
      averageBookingValue: 2887,
      activeCustomers: 28
    },
    staffAssignments: [
      {
        staffId: 2,
        staffName: "Jane Smith",
        role: "Agent",
        isPrimary: true,
        assignedAt: "2023-05-10T13:40:00Z",
        assignedBy: "System",
        notes: "Initial creator assignment"
      }
    ],
    recentActivity: [
      {
        date: "2025-05-22T09:15:30Z",
        action: "Added Customer",
        details: "New customer: Mohamed Al Fayed",
        entityId: "CUS015",
        entityType: "customer"
      }
    ]
  },
  // NEW TEST AGENTS
  {
    id: 14,
    name: "Premium Travel Solutions",
    email: "premium_agent@tripoex.com",
    country: "United States",
    city: "Los Angeles",
    type: "company",
    status: "active",
    commissionType: "flat",
    commissionValue: "$100 per booking",
    profileImage: "/placeholder.svg",
    contact: {
      email: "premium_agent@tripoex.com",
      phone: "+1 (323) 555-9999",
      website: "www.premiumtravelsolutions.com",
      address: "456 Luxury Ave, Beverly Hills, CA 90210"
    },
    joinDate: "2023-07-01",
    createdAt: "2023-07-01T14:00:00Z",
    createdBy: {
      staffId: 11,
      staffName: "Field Sales Executive"
    },
    source: {
      type: "lead",
      details: "High-value lead from luxury travel expo"
    },
    stats: {
      totalQueries: 75,
      totalBookings: 62,
      conversionRate: 82.7,
      revenueGenerated: 425000,
      averageBookingValue: 6855,
      activeCustomers: 48
    },
    staffAssignments: [
      {
        staffId: 11,
        staffName: "Field Sales Executive",
        role: "Premium Agent Manager",
        isPrimary: true,
        assignedAt: "2023-07-01T14:00:00Z",
        assignedBy: "System",
        notes: "Premium tier agent - high-value bookings"
      }
    ],
    recentActivity: [
      {
        date: "2025-05-23T10:15:30Z",
        action: "Created Query",
        details: "Luxury European tour for VIP client",
        entityId: "ENQ20250015",
        entityType: "query"
      }
    ],
    topCustomers: [
      {
        id: "CUS020",
        name: "Victoria Sterling",
        email: "v.sterling@example.com",
        phone: "+1 (323) 555-7777",
        bookingsCount: 8,
        totalSpent: 45000,
        lastBookingDate: "2025-05-15"
      }
    ]
  },
  {
    id: 15,
    name: "Budget Travels Inc",
    email: "budget@travels.com",
    country: "India",
    city: "Mumbai",
    type: "company",
    status: "active",
    commissionType: "percentage",
    commissionValue: "8%",
    profileImage: "/placeholder.svg",
    contact: {
      email: "budget@travels.com",
      phone: "+91 22 1234 5678",
      website: "www.budgettravels.in",
      address: "789 Budget Street, Mumbai, India"
    },
    joinDate: "2023-08-15",
    createdAt: "2023-08-15T11:30:00Z",
    createdBy: {
      staffId: 10,
      staffName: "Customer Support Agent"
    },
    source: {
      type: "website",
      details: "Online registration through website"
    },
    stats: {
      totalQueries: 186,
      totalBookings: 98,
      conversionRate: 52.7,
      revenueGenerated: 125000,
      averageBookingValue: 1275,
      activeCustomers: 89
    },
    staffAssignments: [
      {
        staffId: 10,
        staffName: "Customer Support Agent",
        role: "Agent Coordinator",
        isPrimary: true,
        assignedAt: "2023-08-15T11:30:00Z",
        assignedBy: "System",
        notes: "Budget segment agent - volume focused"
      }
    ],
    recentActivity: [
      {
        date: "2025-05-23T08:45:20Z",
        action: "Created Query",
        details: "Group booking for college trip",
        entityId: "ENQ20250016",
        entityType: "query"
      }
    ]
  },
  {
    id: 16,
    name: "Maria Rodriguez",
    email: "maria.rodriguez@email.com",
    country: "Spain",
    city: "Madrid",
    type: "individual",
    status: "inactive",
    commissionType: "percentage",
    commissionValue: "12%",
    profileImage: "/placeholder.svg",
    contact: {
      email: "maria.rodriguez@email.com",
      phone: "+34 91 123 4567"
    },
    joinDate: "2023-04-20",
    createdAt: "2023-04-20T16:20:00Z",
    createdBy: {
      staffId: 12,
      staffName: "Junior Sales Staff"
    },
    source: {
      type: "referral",
      details: "Referred by existing customer"
    },
    stats: {
      totalQueries: 23,
      totalBookings: 8,
      conversionRate: 34.8,
      revenueGenerated: 18500,
      averageBookingValue: 2312,
      activeCustomers: 6
    },
    staffAssignments: [
      {
        staffId: 12,
        staffName: "Junior Sales Staff",
        role: "Agent Handler",
        isPrimary: true,
        assignedAt: "2023-04-20T16:20:00Z",
        assignedBy: "System",
        notes: "Inactive agent - follow-up required"
      }
    ],
    recentActivity: [
      {
        date: "2025-03-15T14:30:00Z",
        action: "Last Activity",
        details: "Account marked inactive due to no activity",
        entityId: "SYS001",
        entityType: "query"
      }
    ]
  }
];

// Helper functions to get agent data
export const getAgentById = (agentId: number): Agent | undefined => {
  return agents.find(agent => agent.id === agentId);
};

// Mock function to get queries by agent ID
export const getQueriesByAgentId = (agentId: number): Query[] => {
  // Filter mock queries where agentId matches
  const agentQueries = mockQueries.filter(query => query.agentId === agentId);
  return agentQueries;
};

// Mock function to get bookings by agent ID
export const getBookingsByAgentId = (agentId: number): any[] => {
  // Return mock bookings where agentId matches
  return mockBookings.filter(booking => booking.agentId === agentId);
};

// Mock function to get customers by agent ID
export const getCustomersByAgentId = (agentId: number): Customer[] => {
  const agent = getAgentById(agentId);
  return agent?.topCustomers || [];
};

// Mock function to get recent activity for agent
export const getRecentActivity = (agentId: number): AgentActivity[] => {
  const agent = getAgentById(agentId);
  return agent?.recentActivity || [];
};

// Function to get staff assignments for an agent
export const getStaffAssignmentsForAgent = (agentId: number): StaffAssignment[] => {
  const agent = getAgentById(agentId);
  return agent?.staffAssignments || [];
};

// Function to add staff assignment to an agent
export const addStaffAssignment = (
  agentId: number, 
  staffId: number, 
  staffName: string, 
  role: string, 
  isPrimary: boolean, 
  assignedBy: string, 
  notes?: string
): boolean => {
  const agentIndex = agents.findIndex(agent => agent.id === agentId);
  
  if (agentIndex === -1) return false;
  
  if (!agents[agentIndex].staffAssignments) {
    agents[agentIndex].staffAssignments = [];
  }
  
  // If this is a primary assignment, set all others to non-primary
  if (isPrimary && agents[agentIndex].staffAssignments) {
    agents[agentIndex].staffAssignments = agents[agentIndex].staffAssignments.map(
      assignment => ({ ...assignment, isPrimary: false })
    );
  }
  
  const newAssignment: StaffAssignment = {
    staffId,
    staffName,
    role,
    isPrimary,
    assignedAt: new Date().toISOString(),
    assignedBy,
    notes
  };
  
  agents[agentIndex].staffAssignments?.push(newAssignment);
  return true;
};

// Function to remove staff assignment from an agent
export const removeStaffAssignment = (agentId: number, staffId: number): boolean => {
  const agentIndex = agents.findIndex(agent => agent.id === agentId);
  
  if (agentIndex === -1 || !agents[agentIndex].staffAssignments) return false;
  
  agents[agentIndex].staffAssignments = agents[agentIndex].staffAssignments?.filter(
    assignment => assignment.staffId !== staffId
  );
  
  return true;
};

// Function to update staff assignment
export const updateStaffAssignment = (
  agentId: number, 
  staffId: number, 
  updates: Partial<StaffAssignment>
): boolean => {
  const agentIndex = agents.findIndex(agent => agent.id === agentId);
  
  if (agentIndex === -1 || !agents[agentIndex].staffAssignments) return false;
  
  // If updating to primary, set all others to non-primary
  if (updates.isPrimary && agents[agentIndex].staffAssignments) {
    agents[agentIndex].staffAssignments = agents[agentIndex].staffAssignments.map(
      assignment => ({ ...assignment, isPrimary: assignment.staffId === staffId ? true : false })
    );
  }
  
  const assignmentIndex = agents[agentIndex].staffAssignments.findIndex(
    assignment => assignment.staffId === staffId
  );
  
  if (assignmentIndex === -1) return false;
  
  agents[agentIndex].staffAssignments[assignmentIndex] = {
    ...agents[agentIndex].staffAssignments[assignmentIndex],
    ...updates
  };
  
  return true;
};

// Mock queries data for agents
export const mockQueries1: Query[] = [
  {
    id: "ENQ20250001",
    agentId: 1,
    agentName: "Global Travel Solutions",
    status: "new",
    createdAt: "2025-01-15T10:30:00Z",
    destination: {
      country: "Thailand",
      cities: ["Bangkok", "Phuket"]
    },
    travelDates: {
      from: "2025-03-15",
      to: "2025-03-22"
    },
    paxDetails: {
      adults: 2,
      children: 1,
      infants: 0
    },
    hotelDetails: {
      rooms: 2,
      category: "4-star"
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: "leisure",
    inclusions: {
      sightseeing: true,
      transfers: "private",
      mealPlan: "breakfast"
    },
    specialRequests: ["Need vegetarian meals for all guests"],
    budget: {
      min: 1000,
      max: 2000,
      currency: "USD"
    },
    assignedTo: null,
    updatedAt: "2025-01-15T10:30:00Z",
    priority: "normal",
    notes: "Customer requires vegetarian meals",
    communicationPreference: "email"
  },
  {
    id: "ENQ20250002",
    agentId: 1,
    agentName: "Global Travel Solutions",
    status: "assigned",
    createdAt: "2025-01-16T14:20:00Z",
    destination: {
      country: "Singapore",
      cities: ["Singapore"]
    },
    travelDates: {
      from: "2025-04-10",
      to: "2025-04-15"
    },
    paxDetails: {
      adults: 4,
      children: 0,
      infants: 0
    },
    hotelDetails: {
      rooms: 2,
      category: "5-star"
    },
    tripDuration: {
      nights: 5,
      days: 6
    },
    packageType: "business",
    inclusions: {
      sightseeing: false,
      transfers: "private",
      mealPlan: "none"
    },
    specialRequests: [],
    budget: {
      min: 3000,
      max: 4000,
      currency: "USD"
    },
    assignedTo: "John Doe",
    updatedAt: "2025-01-16T14:20:00Z",
    priority: "high",
    notes: "Business trip",
    communicationPreference: "phone"
  },
  {
    id: "ENQ20250008",
    agentId: 2,
    agentName: "Dream Tours",
    status: "new",
    createdAt: "2025-05-21T11:30:45Z",
    destination: {
      country: "France",
      cities: ["Paris"]
    },
    travelDates: {
      from: "2025-06-15",
      to: "2025-06-22"
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    hotelDetails: {
      rooms: 1,
      category: "luxury"
    },
    tripDuration: {
      nights: 7,
      days: 8
    },
    packageType: "leisure",
    inclusions: {
      sightseeing: true,
      transfers: "private",
      mealPlan: "breakfast"
    },
    specialRequests: [],
    budget: {
      min: 5000,
      max: 6000,
      currency: "USD"
    },
    assignedTo: null,
    updatedAt: "2025-05-21T11:30:45Z",
    priority: "normal",
    notes: "Luxury trip",
    communicationPreference: "email"
  }
];

// Mock bookings data
export const mockBookings = [
  {
    id: "BK-2024-001",
    agentId: 1,
    customerName: "Johnson Family",
    destination: {
      country: "Thailand",
      cities: ["Bangkok", "Phuket"]
    },
    bookingDate: "2025-05-19",
    travelDates: {
      from: "2025-07-15",
      to: "2025-07-22"
    },
    totalAmount: 4850,
    status: "confirmed",
    pax: {
      adults: 2,
      children: 2,
      infants: 0
    }
  },
  {
    id: "BK-2024-002", 
    agentId: 2,
    customerName: "Smith Couple",
    destination: {
      country: "UAE",
      cities: ["Dubai", "Abu Dhabi"]
    },
    bookingDate: "2025-05-18",
    travelDates: {
      from: "2025-09-05",
      to: "2025-09-12"
    },
    totalAmount: 2950,
    status: "pending",
    pax: {
      adults: 2,
      children: 0,
      infants: 0
    }
  }
];
