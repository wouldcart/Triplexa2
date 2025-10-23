import { EnhancedStaffMember } from '@/types/staff';
import { AgentStaffRelationship, AssignmentRule } from '@/types/assignment';

export const staffMembers: EnhancedStaffMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@tripoex.com',
    phone: '+1-555-0001',
    department: 'Operations',
    role: 'Manager',
    status: 'active',
    avatar: '/avatars/john.jpg',
    joinDate: '2023-01-15',
    skills: ['Team Management', 'Operations', 'Strategic Planning'],
    certifications: ['PMP', 'Lean Six Sigma'],
    employeeId: '1001',
    operationalCountries: ['1', '2', '3'], // USA, Canada, UK
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 8,
        responseTime: 2.5,
        customerSatisfaction: 4.8,
        enquiriesHandled: 12,
        conversions: 8
      },
      monthly: {
        month: '2024-12',
        totalTasks: 185,
        averageResponseTime: 2.8,
        averageCustomerSatisfaction: 4.7,
        totalEnquiries: 286,
        conversionRate: 68.5,
        targetAchievement: 112
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.6,
        goalsAchieved: 8,
        totalGoals: 10,
        growthPercentage: 15.2
      },
      overall: {
        totalExperience: '3 years',
        performanceScore: 92,
        ranking: 2,
        badges: ['Top Performer', 'Team Leader', 'Customer Champion']
      }
    },
    targets: [
      {
        id: 'T001',
        name: 'Monthly Conversion Rate',
        type: 'conversions',
        value: 70,
        achieved: 68.5,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'active'
      }
    ],
    permissions: ['manage_staff', 'view_reports', 'manage_queries'],
    workingHours: {
      monday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      thursday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      friday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'Super Administrator'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@tripoex.com',
    phone: '+1-555-0002',
    department: 'Sales',
    role: 'Senior Agent',
    status: 'active',
    avatar: '/avatars/jane.jpg',
    joinDate: '2023-02-01',
    skills: ['Sales', 'Customer Relations', 'Negotiation'],
    certifications: ['Sales Professional', 'Customer Service Excellence'],
    employeeId: '1002',
    operationalCountries: ['1', '4', '5'], // USA, Australia, Germany
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 12,
        responseTime: 1.8,
        customerSatisfaction: 4.9,
        revenue: 8500,
        enquiriesHandled: 15,
        conversions: 11
      },
      monthly: {
        month: '2024-12',
        totalTasks: 298,
        averageResponseTime: 2.1,
        averageCustomerSatisfaction: 4.8,
        totalRevenue: 185000,
        totalEnquiries: 385,
        conversionRate: 72.8,
        targetAchievement: 125
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.8,
        goalsAchieved: 9,
        totalGoals: 10,
        growthPercentage: 22.5
      },
      overall: {
        totalExperience: '2.5 years',
        totalRevenue: 650000,
        clientRetentionRate: 89.5,
        performanceScore: 95,
        ranking: 1,
        badges: ['Top Performer', 'Revenue Champion', 'Customer Favorite']
      }
    },
    targets: [
      {
        id: 'T002',
        name: 'Monthly Revenue',
        type: 'revenue',
        value: 150000,
        achieved: 185000,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'completed'
      }
    ],
    permissions: ['manage_queries', 'create_proposals', 'view_analytics'],
    workingHours: {
      monday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      tuesday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      wednesday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      thursday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      friday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'John Doe'
  },
  {
    id: '3',
    name: 'Sarah Williams',
    email: 'sarah.williams@tripoex.com',
    phone: '+1-555-0003',
    department: 'Sales',
    role: 'Senior Agent',
    status: 'active',
    avatar: '/avatars/sarah.jpg',
    joinDate: '2023-03-01',
    skills: ['Sales', 'Product Knowledge', 'Territory Management'],
    certifications: ['Advanced Sales', 'Product Specialist'],
    employeeId: '1003',
    operationalCountries: ['2', '3', '6'], // Canada, UK, France
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 10,
        responseTime: 2.2,
        customerSatisfaction: 4.7,
        revenue: 6200,
        enquiriesHandled: 13,
        conversions: 9
      },
      monthly: {
        month: '2024-12',
        totalTasks: 265,
        averageResponseTime: 2.4,
        averageCustomerSatisfaction: 4.6,
        totalRevenue: 142000,
        totalEnquiries: 295,
        conversionRate: 65.2,
        targetAchievement: 98
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.4,
        goalsAchieved: 7,
        totalGoals: 10,
        growthPercentage: 8.5
      },
      overall: {
        totalExperience: '2 years',
        totalRevenue: 485000,
        clientRetentionRate: 82.3,
        performanceScore: 88,
        ranking: 3,
        badges: ['Consistent Performer', 'Product Expert']
      }
    },
    targets: [
      {
        id: 'T003',
        name: 'Monthly Revenue',
        type: 'revenue',
        value: 145000,
        achieved: 142000,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'active'
      }
    ],
    permissions: ['manage_queries', 'create_proposals', 'view_inventory'],
    workingHours: {
      monday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      thursday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      friday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'John Doe'
  },
  // NEW TEST STAFF MEMBERS
  {
    id: '8',
    name: 'Finance Manager',
    email: 'finance.manager@tripoex.com',
    phone: '+1-555-0070',
    department: 'Finance',
    role: 'Finance Manager',
    status: 'active',
    avatar: '/avatars/finance.jpg',
    joinDate: '2023-02-01',
    skills: ['Financial Analysis', 'Budget Management', 'Commission Tracking', 'Reporting'],
    certifications: ['CPA', 'Financial Management'],
    employeeId: '1008',
    operationalCountries: ['1', '2', '3', '4'], // Global finance operations
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 6,
        responseTime: 3.2,
        customerSatisfaction: 4.5
      },
      monthly: {
        month: '2024-12',
        totalTasks: 125,
        averageResponseTime: 3.0,
        averageCustomerSatisfaction: 4.4,
        targetAchievement: 105
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.3,
        goalsAchieved: 8,
        totalGoals: 10,
        growthPercentage: 12.0
      },
      overall: {
        totalExperience: '5 years',
        performanceScore: 87,
        ranking: 4,
        badges: ['Financial Expert', 'Budget Guru']
      }
    },
    targets: [
      {
        id: 'T008',
        name: 'Budget Accuracy',
        type: 'revenue',
        value: 95,
        achieved: 98,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'completed'
      }
    ],
    permissions: ['finance_management', 'view_reports', 'commission_tracking'],
    workingHours: {
      monday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      thursday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      friday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'Super Administrator'
  },
  {
    id: '9',
    name: 'Operations Staff',
    email: 'ops.staff@tripoex.com',
    phone: '+1-555-0080',
    department: 'Operations',
    role: 'Operations Executive',
    status: 'active',
    avatar: '/avatars/operations.jpg',
    joinDate: '2023-04-01',
    skills: ['Booking Management', 'Vendor Coordination', 'Service Delivery', 'Quality Control'],
    certifications: ['Operations Management'],
    employeeId: '1009',
    operationalCountries: ['1', '5'], // USA, Germany
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 14,
        responseTime: 2.8,
        customerSatisfaction: 4.6,
        enquiriesHandled: 10
      },
      monthly: {
        month: '2024-12',
        totalTasks: 315,
        averageResponseTime: 2.6,
        averageCustomerSatisfaction: 4.5,
        totalEnquiries: 235,
        targetAchievement: 108
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.2,
        goalsAchieved: 7,
        totalGoals: 9,
        growthPercentage: 18.3
      },
      overall: {
        totalExperience: '1.5 years',
        performanceScore: 84,
        ranking: 6,
        badges: ['Rising Star', 'Operations Pro']
      }
    },
    targets: [
      {
        id: 'T009',
        name: 'Task Completion Rate',
        type: 'enquiries',
        value: 90,
        achieved: 95,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'completed'
      }
    ],
    permissions: ['booking_management', 'vendor_coordination', 'view_inventory'],
    workingHours: {
      monday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      thursday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      friday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'John Doe'
  },
  {
    id: '10',
    name: 'Customer Support Agent',
    email: 'support.agent@tripoex.com',
    phone: '+1-555-0090',
    department: 'Customer Support',
    role: 'Support Agent',
    status: 'active',
    avatar: '/avatars/support.jpg',
    joinDate: '2023-05-15',
    skills: ['Customer Service', 'Problem Resolution', 'Communication', 'CRM Management'],
    certifications: ['Customer Service Excellence'],
    employeeId: '1010',
    operationalCountries: ['1', '2'], // USA, Canada
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 16,
        responseTime: 1.5,
        customerSatisfaction: 4.8,
        enquiriesHandled: 22
      },
      monthly: {
        month: '2024-12',
        totalTasks: 425,
        averageResponseTime: 1.8,
        averageCustomerSatisfaction: 4.7,
        totalEnquiries: 520,
        targetAchievement: 115
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.5,
        goalsAchieved: 9,
        totalGoals: 10,
        growthPercentage: 25.8
      },
      overall: {
        totalExperience: '1.2 years',
        performanceScore: 91,
        ranking: 3,
        badges: ['Customer Champion', 'Fast Responder', 'Problem Solver']
      }
    },
    targets: [
      {
        id: 'T010',
        name: 'Response Time',
        type: 'response-time',
        value: 2.0,
        achieved: 1.8,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'completed'
      }
    ],
    permissions: ['agent_management', 'ticket_handling', 'communication_logs'],
    workingHours: {
      monday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      thursday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      friday: { isWorking: true, startTime: '08:00', endTime: '17:00', breakTime: '12:00-13:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'John Doe'
  },
  {
    id: '11',
    name: 'Field Sales Executive',
    email: 'field.sales@tripoex.com',
    phone: '+1-555-0100',
    department: 'Field Sales',
    role: 'Field Sales Executive',
    status: 'active',
    avatar: '/avatars/field-sales.jpg',
    joinDate: '2023-06-15',
    skills: ['Lead Generation', 'Agent Acquisition', 'Territory Management', 'Relationship Building'],
    certifications: ['Field Sales Professional'],
    employeeId: '1011',
    operationalCountries: ['3', '6'], // UK, France
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 8,
        responseTime: 4.2,
        customerSatisfaction: 4.4,
        enquiriesHandled: 6
      },
      monthly: {
        month: '2024-12',
        totalTasks: 185,
        averageResponseTime: 4.0,
        averageCustomerSatisfaction: 4.3,
        totalEnquiries: 125,
        targetAchievement: 102
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 4.1,
        goalsAchieved: 6,
        totalGoals: 8,
        growthPercentage: 8.7
      },
      overall: {
        totalExperience: '3 years',
        performanceScore: 82,
        ranking: 7,
        badges: ['Territory Expert', 'Relationship Builder']
      }
    },
    targets: [
      {
        id: 'T011',
        name: 'New Agent Acquisition',
        type: 'enquiries',
        value: 5,
        achieved: 3,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'active'
      }
    ],
    permissions: ['lead_management', 'agent_acquisition', 'territory_management'],
    workingHours: {
      monday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      tuesday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      wednesday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      thursday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      friday: { isWorking: true, startTime: '08:30', endTime: '17:30', breakTime: '12:30-13:30' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'John Doe'
  },
  {
    id: '12',
    name: 'Junior Sales Staff',
    email: 'junior.sales@tripoex.com',
    phone: '+1-555-0110',
    department: 'Sales',
    role: 'Junior Sales Executive',
    status: 'active',
    avatar: '/avatars/junior-sales.jpg',
    joinDate: '2023-08-01',
    skills: ['Basic Sales', 'Lead Qualification', 'Customer Support'],
    certifications: ['Sales Fundamentals'],
    employeeId: '1012',
    operationalCountries: ['1'], // USA only
    performance: {
      daily: {
        date: '2024-12-13',
        tasksCompleted: 7,
        responseTime: 3.5,
        customerSatisfaction: 4.3,
        enquiriesHandled: 8,
        conversions: 3
      },
      monthly: {
        month: '2024-12',
        totalTasks: 175,
        averageResponseTime: 3.2,
        averageCustomerSatisfaction: 4.2,
        totalEnquiries: 185,
        conversionRate: 42.5,
        targetAchievement: 85
      },
      quarterly: {
        quarter: 'Q4-2024',
        performanceRating: 3.8,
        goalsAchieved: 5,
        totalGoals: 8,
        growthPercentage: 15.2
      },
      overall: {
        totalExperience: '8 months',
        performanceScore: 76,
        ranking: 8,
        badges: ['Learner', 'Growing Fast']
      }
    },
    targets: [
      {
        id: 'T012',
        name: 'Monthly Conversions',
        type: 'conversions',
        value: 50,
        achieved: 42.5,
        period: 'monthly',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'active'
      }
    ],
    permissions: ['view_queries', 'create_queries', 'view_bookings'],
    workingHours: {
      monday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      thursday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      friday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakTime: '13:00-14:00' },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'Sarah Williams'
  },
  {
    id: '13',
    name: 'Inactive User',
    email: 'inactive.user@tripoex.com',
    phone: '+1-555-0120',
    department: 'Sales',
    role: 'Sales Executive',
    status: 'inactive',
    avatar: '/avatars/inactive.jpg',
    joinDate: '2023-03-15',
    skills: ['Sales', 'Customer Relations'],
    certifications: [],
    employeeId: '1013',
    operationalCountries: [], // No operational countries assigned
    performance: {
      daily: {
        date: '2024-11-15',
        tasksCompleted: 0,
        responseTime: 0,
        customerSatisfaction: 0
      },
      monthly: {
        month: '2024-11',
        totalTasks: 45,
        averageResponseTime: 5.8,
        averageCustomerSatisfaction: 3.2,
        targetAchievement: 25
      },
      quarterly: {
        quarter: 'Q3-2024',
        performanceRating: 2.8,
        goalsAchieved: 2,
        totalGoals: 8,
        growthPercentage: -12.5
      },
      overall: {
        totalExperience: '9 months',
        performanceScore: 45,
        ranking: 12,
        badges: []
      }
    },
    targets: [],
    permissions: [],
    workingHours: {
      monday: { isWorking: false },
      tuesday: { isWorking: false },
      wednesday: { isWorking: false },
      thursday: { isWorking: false },
      friday: { isWorking: false },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: 'Sarah Williams'
  }
];

// Agent-Staff relationships for assignment logic
export const agentStaffRelationships: AgentStaffRelationship[] = [
  {
    agentId: 1,
    staffId: 1,
    isPrimary: true,
    createdAt: '2023-01-15T10:30:00Z'
  },
  {
    agentId: 1,
    staffId: 4,
    isPrimary: false,
    createdAt: '2023-03-22T14:15:00Z'
  },
  {
    agentId: 2,
    staffId: 4,
    isPrimary: true,
    createdAt: '2023-03-22T09:15:00Z'
  },
  {
    agentId: 3,
    staffId: 2,
    isPrimary: true,
    createdAt: '2023-05-10T13:40:00Z'
  },
  {
    agentId: 14,
    staffId: 11,
    isPrimary: true,
    createdAt: '2023-07-01T14:00:00Z'
  },
  {
    agentId: 15,
    staffId: 10,
    isPrimary: true,
    createdAt: '2023-08-15T11:30:00Z'
  },
  {
    agentId: 16,
    staffId: 12,
    isPrimary: true,
    createdAt: '2023-04-20T16:20:00Z'
  }
];

// Assignment rules configuration
export const assignmentRules: AssignmentRule[] = [
  {
    id: 1,
    name: 'Agent-Staff Relationship',
    type: 'agent-staff-relationship',
    priority: 1,
    enabled: true,
    conditions: { checkPrimaryFirst: true }
  },
  {
    id: 2,
    name: 'Destination Expertise Match',
    type: 'expertise-match',
    priority: 2,
    enabled: true,
    conditions: { minimumExpertiseLevel: 'intermediate' }
  },
  {
    id: 3,
    name: 'Workload Balance',
    type: 'workload-balance',
    priority: 3,
    enabled: true,
    conditions: { maxCapacityThreshold: 0.8 }
  },
  {
    id: 4,
    name: 'Round Robin Assignment',
    type: 'round-robin',
    priority: 4,
    enabled: false,
    conditions: { respectSequenceOrder: true }
  }
];

// Toggle assignment rule function
export const toggleAssignmentRule = (ruleId: number, enabled: boolean): boolean => {
  const ruleIndex = assignmentRules.findIndex(rule => rule.id === ruleId);
  if (ruleIndex === -1) return false;
  
  assignmentRules[ruleIndex].enabled = enabled;
  return true;
};

export const getStaffMemberById = (id: string): EnhancedStaffMember | undefined => {
  return staffMembers.find(member => member.id === id);
};

export const getStaffMembersByDepartment = (department: string): EnhancedStaffMember[] => {
  return staffMembers.filter(member => member.department === department);
};

export const getActiveStaffMembers = (): EnhancedStaffMember[] => {
  return staffMembers.filter(member => member.status === 'active');
};

export const getStaffMembersByRole = (role: string): EnhancedStaffMember[] => {
  return staffMembers.filter(member => member.role === role);
};
