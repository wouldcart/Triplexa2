import { Department, EnhancedStaffMember, Task, RealTimeUpdate } from "@/types/staff";

export const departments: Department[] = [
  {
    id: "sales",
    name: "Sales",
    code: "SALES",
    description: "Handle all enquiry data with real-time updates and performance tracking",
    staffCount: 15,
    features: [
      {
        id: "enquiry-tracking",
        name: "Enquiry Tracking",
        description: "Real-time enquiry management and assignment",
        enabled: true,
        config: { autoAssignment: true, realTimeUpdates: true }
      },
      {
        id: "performance-analytics",
        name: "Performance Analytics",
        description: "Daily and monthly performance tracking",
        enabled: true,
        config: { dailyReports: true, monthlyReports: true }
      },
      {
        id: "commission-tracking",
        name: "Commission Tracking",
        description: "Automatic commission calculation and tracking",
        enabled: true,
        config: { autoCalculation: true }
      }
    ],
    workflow: {
      stages: [
        { id: "1", name: "Lead Received", description: "New enquiry received", order: 1, requiredActions: ["assign"] },
        { id: "2", name: "Initial Contact", description: "First contact with customer", order: 2, requiredActions: ["call", "email"] },
        { id: "3", name: "Proposal Created", description: "Travel proposal prepared", order: 3, requiredActions: ["create_proposal"] },
        { id: "4", name: "Follow-up", description: "Customer follow-up", order: 4, requiredActions: ["follow_up"] },
        { id: "5", name: "Conversion", description: "Lead converted to booking", order: 5, requiredActions: ["convert"] }
      ],
      autoAssignment: true,
      escalationRules: [
        { id: "1", condition: "no_response_24h", action: "escalate_to_manager", target: "sales_manager", timeThreshold: 24 }
      ]
    },
    permissions: [
      { id: "view_enquiries", name: "View Enquiries", description: "Can view all enquiries", module: "enquiries", actions: ["read"] },
      { id: "create_proposals", name: "Create Proposals", description: "Can create travel proposals", module: "proposals", actions: ["create", "edit"] }
    ]
  },
  {
    id: "operations",
    name: "Operations",
    code: "OPS",
    description: "Manage post-booking processes and customer service operations",
    staffCount: 12,
    features: [
      {
        id: "booking-management",
        name: "Booking Management",
        description: "Post-booking workflow management",
        enabled: true,
        config: { autoNotifications: true }
      },
      {
        id: "vendor-coordination",
        name: "Vendor Coordination",
        description: "Coordinate with hotels, transport, and other vendors",
        enabled: true,
        config: { autoConfirmations: true }
      },
      {
        id: "service-delivery",
        name: "Service Delivery",
        description: "Monitor and ensure quality service delivery",
        enabled: true,
        config: { qualityChecks: true }
      }
    ],
    workflow: {
      stages: [
        { id: "1", name: "Booking Confirmed", description: "Customer booking confirmed", order: 1, requiredActions: ["process"] },
        { id: "2", name: "Vendor Coordination", description: "Coordinate with vendors", order: 2, requiredActions: ["coordinate"] },
        { id: "3", name: "Documentation", description: "Prepare travel documents", order: 3, requiredActions: ["document"] },
        { id: "4", name: "Service Delivery", description: "Monitor service delivery", order: 4, requiredActions: ["monitor"] }
      ],
      autoAssignment: true,
      escalationRules: []
    },
    permissions: [
      { id: "manage_bookings", name: "Manage Bookings", description: "Can manage all bookings", module: "bookings", actions: ["read", "edit"] },
      { id: "vendor_access", name: "Vendor Access", description: "Can coordinate with vendors", module: "vendors", actions: ["read", "edit"] }
    ]
  },
  {
    id: "customer-support",
    name: "Customer Support",
    code: "CS",
    description: "Handle agent management and B2B customer relationships",
    staffCount: 8,
    features: [
      {
        id: "agent-management",
        name: "Agent Management",
        description: "Manage B2B agents and their requirements",
        enabled: true,
        config: { agentPortal: true, performanceTracking: true }
      },
      {
        id: "ticket-system",
        name: "Ticket System",
        description: "Handle customer support tickets and issues",
        enabled: true,
        config: { autoAssignment: true, priorityManagement: true }
      },
      {
        id: "communication-logs",
        name: "Communication Logs",
        description: "Track all customer communications",
        enabled: true,
        config: { autoLogging: true }
      }
    ],
    workflow: {
      stages: [
        { id: "1", name: "Issue Received", description: "Customer issue reported", order: 1, requiredActions: ["acknowledge"] },
        { id: "2", name: "Investigation", description: "Investigate the issue", order: 2, requiredActions: ["investigate"] },
        { id: "3", name: "Resolution", description: "Resolve the issue", order: 3, requiredActions: ["resolve"] },
        { id: "4", name: "Follow-up", description: "Follow up with customer", order: 4, requiredActions: ["follow_up"] }
      ],
      autoAssignment: true,
      escalationRules: [
        { id: "1", condition: "high_priority_no_response_2h", action: "escalate_to_manager", target: "cs_manager", timeThreshold: 2 }
      ]
    },
    permissions: [
      { id: "manage_agents", name: "Manage Agents", description: "Can manage agent profiles", module: "agents", actions: ["read", "edit"] },
      { id: "handle_tickets", name: "Handle Tickets", description: "Can handle support tickets", module: "support", actions: ["read", "edit", "close"] }
    ]
  },
  {
    id: "finance",
    name: "Finance",
    code: "FIN",
    description: "Advanced billing, payment processing, and financial management",
    staffCount: 6,
    features: [
      {
        id: "advanced-billing",
        name: "Advanced Billing",
        description: "Automated invoicing and billing system",
        enabled: true,
        config: { autoInvoicing: true, reminderSystem: true }
      },
      {
        id: "payment-tracking",
        name: "Payment Tracking",
        description: "Track payments and reconciliation",
        enabled: true,
        config: { autoReconciliation: true }
      },
      {
        id: "financial-reporting",
        name: "Financial Reporting",
        description: "Comprehensive financial reports and analytics",
        enabled: true,
        config: { realTimeReports: true, budgetTracking: true }
      },
      {
        id: "commission-management",
        name: "Commission Management",
        description: "Calculate and manage agent commissions",
        enabled: true,
        config: { autoCalculation: true, tieredCommissions: true }
      }
    ],
    workflow: {
      stages: [
        { id: "1", name: "Invoice Generation", description: "Generate customer invoices", order: 1, requiredActions: ["generate"] },
        { id: "2", name: "Payment Processing", description: "Process customer payments", order: 2, requiredActions: ["process"] },
        { id: "3", name: "Reconciliation", description: "Reconcile accounts", order: 3, requiredActions: ["reconcile"] },
        { id: "4", name: "Reporting", description: "Generate financial reports", order: 4, requiredActions: ["report"] }
      ],
      autoAssignment: true,
      escalationRules: [
        { id: "1", condition: "overdue_payment_7days", action: "send_reminder", target: "finance_manager", timeThreshold: 168 }
      ]
    },
    permissions: [
      { id: "manage_billing", name: "Manage Billing", description: "Can manage billing and invoices", module: "billing", actions: ["read", "create", "edit"] },
      { id: "financial_reports", name: "Financial Reports", description: "Can generate financial reports", module: "reports", actions: ["read", "create"] }
    ]
  },
  {
    id: "field-sales",
    name: "Field Sales",
    code: "FS",
    description: "Field sales executives for agent acquisition and lead management",
    staffCount: 3,
    features: [
      {
        id: "lead-management",
        name: "Lead Management",
        description: "Manage leads and potential agents",
        enabled: true,
        config: { territoryManagement: true, leadScoring: true }
      },
      {
        id: "agent-acquisition",
        name: "Agent Acquisition",
        description: "Onboard new agents and companies",
        enabled: true,
        config: { onboardingWorkflow: true, verificationProcess: true }
      },
      {
        id: "territory-management",
        name: "Territory Management",
        description: "Manage sales territories and targets",
        enabled: true,
        config: { geoMapping: true, targetSetting: true }
      }
    ],
    workflow: {
      stages: [
        { id: "1", name: "Lead Identification", description: "Identify potential agents", order: 1, requiredActions: ["identify"] },
        { id: "2", name: "Initial Contact", description: "Make first contact", order: 2, requiredActions: ["contact"] },
        { id: "3", name: "Presentation", description: "Present business opportunity", order: 3, requiredActions: ["present"] },
        { id: "4", name: "Onboarding", description: "Onboard new agent", order: 4, requiredActions: ["onboard"] }
      ],
      autoAssignment: false,
      escalationRules: []
    },
    permissions: [
      { id: "manage_leads", name: "Manage Leads", description: "Can manage leads and prospects", module: "leads", actions: ["read", "create", "edit"] },
      { id: "agent_onboarding", name: "Agent Onboarding", description: "Can onboard new agents", module: "agents", actions: ["create", "verify"] }
    ]
  },
  {
    id: "hr",
    name: "Human Resources",
    code: "HR",
    description: "Comprehensive HR management including payroll, leave, and attendance",
    staffCount: 1,
    features: [
      {
        id: "payroll-management",
        name: "Payroll Management",
        description: "Advanced payroll processing with multi-level approvals",
        enabled: true,
        config: { 
          multiLevelApproval: true, 
          automaticCalculations: true, 
          taxCompliance: true,
          salaryComponents: true
        }
      },
      {
        id: "leave-management",
        name: "Leave Management",
        description: "Comprehensive leave and attendance tracking",
        enabled: true,
        config: { 
          leaveTypes: ["annual", "sick", "casual", "maternity", "paternity", "emergency", "comp-off"],
          autoCalculation: true,
          managerApproval: true
        }
      },
      {
        id: "attendance-tracking",
        name: "Attendance Tracking",
        description: "Real-time attendance monitoring and reporting",
        enabled: true,
        config: { 
          clockInOut: true, 
          overtimeCalculation: true, 
          breakManagement: true,
          geolocation: true
        }
      },
      {
        id: "employee-management",
        name: "Employee Management",
        description: "Complete employee lifecycle management",
        enabled: true,
        config: { 
          onboarding: true, 
          performanceReviews: true, 
          documentManagement: true,
          organizationChart: true
        }
      },
      {
        id: "compliance-management",
        name: "Compliance Management",
        description: "Ensure HR compliance and statutory requirements",
        enabled: true,
        config: { 
          statutoryCompliance: true, 
          auditTrails: true, 
          reportGeneration: true,
          deadlineAlerts: true
        }
      }
    ],
    workflow: {
      stages: [
        { id: "1", name: "Request Received", description: "HR request or application received", order: 1, requiredActions: ["review"] },
        { id: "2", name: "Processing", description: "Process the request", order: 2, requiredActions: ["process"] },
        { id: "3", name: "Approval", description: "Get necessary approvals", order: 3, requiredActions: ["approve"] },
        { id: "4", name: "Implementation", description: "Implement the approved request", order: 4, requiredActions: ["implement"] },
        { id: "5", name: "Documentation", description: "Update records and documentation", order: 5, requiredActions: ["document"] }
      ],
      autoAssignment: true,
      escalationRules: [
        { id: "1", condition: "payroll_approval_pending_48h", action: "escalate_to_finance", target: "finance_manager", timeThreshold: 48 },
        { id: "2", condition: "leave_approval_pending_24h", action: "escalate_to_manager", target: "hr_manager", timeThreshold: 24 }
      ]
    },
    permissions: [
      { id: "manage_payroll", name: "Manage Payroll", description: "Can process and manage payroll", module: "payroll", actions: ["read", "create", "edit", "approve"] },
      { id: "manage_leaves", name: "Manage Leaves", description: "Can approve/reject leave applications", module: "leaves", actions: ["read", "approve", "reject"] },
      { id: "manage_attendance", name: "Manage Attendance", description: "Can view and manage attendance records", module: "attendance", actions: ["read", "edit"] },
      { id: "manage_employees", name: "Manage Employees", description: "Can manage employee profiles and data", module: "employees", actions: ["read", "create", "edit", "delete"] },
      { id: "hr_analytics", name: "HR Analytics", description: "Can view HR analytics and reports", module: "analytics", actions: ["read", "create"] },
      { id: "compliance_management", name: "Compliance Management", description: "Can manage compliance and statutory requirements", module: "compliance", actions: ["read", "manage"] }
    ]
  }
];

// Add HR staff member to enhanced staff members
export const enhancedStaffMembers: EnhancedStaffMember[] = [
  {
    id: "staff-001",
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1234567890",
    department: "sales",
    role: "Senior Sales Executive",
    status: "active",
    avatar: "/avatars/john-smith.png",
    joinDate: "2023-01-15",
    employeeId: "1001",
    operationalCountries: ["1", "2", "3"], // USA, Canada, UK
    skills: ["Lead Generation", "Client Relationship", "Proposal Writing", "Negotiation"],
    certifications: ["Certified Sales Professional", "Tourism Industry Expert"],
    performance: {
      daily: {
        date: "2025-05-26",
        tasksCompleted: 8,
        responseTime: 2.5,
        customerSatisfaction: 4.8,
        revenue: 15000,
        enquiriesHandled: 12,
        conversions: 3
      },
      monthly: {
        month: "2025-05",
        totalTasks: 180,
        averageResponseTime: 3.2,
        averageCustomerSatisfaction: 4.6,
        totalRevenue: 350000,
        totalEnquiries: 280,
        conversionRate: 25.5,
        targetAchievement: 87.5
      },
      quarterly: {
        quarter: "Q2 2025",
        performanceRating: 4.2,
        goalsAchieved: 7,
        totalGoals: 8,
        growthPercentage: 15.3
      },
      overall: {
        totalExperience: "3 years",
        totalRevenue: 2500000,
        clientRetentionRate: 78.5,
        performanceScore: 92,
        ranking: 2,
        badges: ["Top Performer", "Client Favorite", "Revenue Star"]
      }
    },
    targets: [
      {
        id: "target-001",
        name: "Monthly Revenue",
        type: "revenue",
        value: 400000,
        achieved: 350000,
        period: "monthly",
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        status: "active"
      },
      {
        id: "target-002",
        name: "Daily Enquiries",
        type: "enquiries",
        value: 15,
        achieved: 12,
        period: "daily",
        startDate: "2025-05-26",
        endDate: "2025-05-26",
        status: "active"
      }
    ],
    permissions: ["enquiry-management", "proposal-creation"],
    workingHours: {
      monday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: "manager-001"
  },
  {
    id: "staff-002",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1234567891",
    department: "operations",
    role: "Operations Manager",
    status: "active",
    joinDate: "2022-11-20",
    employeeId: "1002",
    operationalCountries: ["1", "4", "5"], // USA, Australia, Germany
    skills: ["Vendor Management", "Service Delivery", "Process Optimization", "Quality Control"],
    certifications: ["Operations Management", "ITIL Foundation"],
    performance: {
      daily: {
        date: "2025-05-26",
        tasksCompleted: 15,
        responseTime: 1.8,
        customerSatisfaction: 4.9,
        revenue: 0,
        enquiriesHandled: 0,
        conversions: 0
      },
      monthly: {
        month: "2025-05",
        totalTasks: 420,
        averageResponseTime: 2.1,
        averageCustomerSatisfaction: 4.7,
        totalRevenue: 0,
        totalEnquiries: 0,
        conversionRate: 0,
        targetAchievement: 95.2
      },
      quarterly: {
        quarter: "Q2 2025",
        performanceRating: 4.5,
        goalsAchieved: 8,
        totalGoals: 8,
        growthPercentage: 12.8
      },
      overall: {
        totalExperience: "4 years",
        totalRevenue: 0,
        clientRetentionRate: 85.2,
        performanceScore: 96,
        ranking: 1,
        badges: ["Excellence Award", "Process Master", "Quality Champion"]
      }
    },
    targets: [
      {
        id: "target-003",
        name: "Service Delivery Time",
        type: "response-time",
        value: 2,
        achieved: 1.8,
        period: "daily",
        startDate: "2025-05-26",
        endDate: "2025-05-26",
        status: "completed"
      }
    ],
    permissions: ["booking-operations"],
    workingHours: {
      monday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    }
  },
  {
    id: "staff-003",
    name: "Mike Chen",
    email: "mike.chen@company.com",
    phone: "+1234567892",
    department: "customer-support",
    role: "Customer Support Manager",
    status: "active",
    joinDate: "2023-03-10",
    employeeId: "1003",
    operationalCountries: ["1", "2"], // USA, Canada
    skills: ["Agent Management", "Issue Resolution", "Communication", "Relationship Building"],
    certifications: ["Customer Service Excellence", "Agent Management"],
    performance: {
      daily: {
        date: "2025-05-26",
        tasksCompleted: 12,
        responseTime: 1.5,
        customerSatisfaction: 4.7,
        revenue: 0,
        enquiriesHandled: 0,
        conversions: 0
      },
      monthly: {
        month: "2025-05",
        totalTasks: 320,
        averageResponseTime: 1.8,
        averageCustomerSatisfaction: 4.5,
        totalRevenue: 0,
        totalEnquiries: 0,
        conversionRate: 0,
        targetAchievement: 88.7
      },
      quarterly: {
        quarter: "Q2 2025",
        performanceRating: 4.0,
        goalsAchieved: 6,
        totalGoals: 7,
        growthPercentage: 8.5
      },
      overall: {
        totalExperience: "2 years",
        totalRevenue: 0,
        clientRetentionRate: 82.3,
        performanceScore: 89,
        ranking: 3,
        badges: ["Agent Champion", "Response Hero"]
      }
    },
    targets: [
      {
        id: "target-004",
        name: "Customer Satisfaction",
        type: "satisfaction",
        value: 4.8,
        achieved: 4.7,
        period: "monthly",
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        status: "active"
      }
    ],
    permissions: ["agent-management"],
    workingHours: {
      monday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    }
  },
  {
    id: "staff-004",
    name: "Lisa Anderson",
    email: "lisa.anderson@company.com",
    phone: "+1234567893",
    department: "finance",
    role: "Finance Manager",
    status: "active",
    joinDate: "2022-08-05",
    employeeId: "1004",
    operationalCountries: ["1", "2", "3", "4"], // Global finance operations
    skills: ["Financial Analysis", "Billing Systems", "Revenue Management", "Compliance"],
    certifications: ["CPA", "Financial Management"],
    performance: {
      daily: {
        date: "2025-05-26",
        tasksCompleted: 10,
        responseTime: 2.2,
        customerSatisfaction: 4.6,
        revenue: 0,
        enquiriesHandled: 0,
        conversions: 0
      },
      monthly: {
        month: "2025-05",
        totalTasks: 250,
        averageResponseTime: 2.5,
        averageCustomerSatisfaction: 4.4,
        totalRevenue: 0,
        totalEnquiries: 0,
        conversionRate: 0,
        targetAchievement: 92.3
      },
      quarterly: {
        quarter: "Q2 2025",
        performanceRating: 4.3,
        goalsAchieved: 7,
        totalGoals: 8,
        growthPercentage: 10.2
      },
      overall: {
        totalExperience: "5 years",
        totalRevenue: 0,
        clientRetentionRate: 0,
        performanceScore: 94,
        ranking: 1,
        badges: ["Financial Wizard", "Accuracy Master", "Compliance Champion"]
      }
    },
    targets: [
      {
        id: "target-005",
        name: "Invoice Processing Time",
        type: "response-time",
        value: 2,
        achieved: 2.2,
        period: "daily",
        startDate: "2025-05-26",
        endDate: "2025-05-26",
        status: "active"
      }
    ],
    permissions: ["billing-management"],
    workingHours: {
      monday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    }
  },
  {
    id: "staff-005",
    name: "David Rodriguez",
    email: "david.rodriguez@company.com",
    phone: "+1234567894",
    department: "field-sales",
    role: "Field Sales Executive",
    status: "active",
    joinDate: "2023-06-12",
    employeeId: "1005",
    operationalCountries: ["3", "6"], // UK, France
    skills: ["Lead Generation", "Agent Acquisition", "Territory Management", "Business Development"],
    certifications: ["Sales Management", "Business Development"],
    performance: {
      daily: {
        date: "2025-05-26",
        tasksCompleted: 6,
        responseTime: 3.0,
        customerSatisfaction: 4.5,
        revenue: 8000,
        enquiriesHandled: 5,
        conversions: 1
      },
      monthly: {
        month: "2025-05",
        totalTasks: 150,
        averageResponseTime: 3.5,
        averageCustomerSatisfaction: 4.3,
        totalRevenue: 180000,
        totalEnquiries: 120,
        conversionRate: 18.5,
        targetAchievement: 75.2
      },
      quarterly: {
        quarter: "Q2 2025",
        performanceRating: 3.8,
        goalsAchieved: 5,
        totalGoals: 7,
        growthPercentage: 22.1
      },
      overall: {
        totalExperience: "1.5 years",
        totalRevenue: 850000,
        clientRetentionRate: 65.8,
        performanceScore: 85,
        ranking: 4,
        badges: ["Rising Star", "Territory Explorer"]
      }
    },
    targets: [
      {
        id: "target-006",
        name: "New Agents Acquired",
        type: "conversions",
        value: 5,
        achieved: 3,
        period: "monthly",
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        status: "active"
      }
    ],
    permissions: ["lead-management"],
    workingHours: {
      monday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    }
  },
  {
    id: "hr-001",
    name: "Rachel Green",
    email: "rachel.green@company.com",
    phone: "+1-555-0199",
    department: "hr",
    role: "HR Manager",
    status: "active",
    avatar: "/avatars/rachel-green.png",
    joinDate: "2024-03-15",
    employeeId: "1006",
    operationalCountries: ["1", "2", "3", "4"], // Global HR operations
    skills: ["Payroll Management", "Employee Relations", "Compliance", "Performance Management"],
    certifications: ["SHRM-CP", "PHR", "Payroll Certification"],
    performance: {
      daily: {
        date: "2025-05-26",
        tasksCompleted: 12,
        responseTime: 1.5,
        customerSatisfaction: 4.8,
        revenue: 0,
        enquiriesHandled: 8,
        conversions: 6
      },
      monthly: {
        month: "2025-05",
        totalTasks: 250,
        averageResponseTime: 1.2,
        averageCustomerSatisfaction: 4.7,
        totalRevenue: 0,
        totalEnquiries: 180,
        conversionRate: 95,
        targetAchievement: 98
      },
      quarterly: {
        quarter: "Q2-2025",
        performanceRating: 4.8,
        goalsAchieved: 9,
        totalGoals: 10,
        growthPercentage: 15
      },
      overall: {
        totalExperience: "8 years",
        totalRevenue: 0,
        clientRetentionRate: 98,
        performanceScore: 96,
        ranking: 1,
        badges: ["HR Excellence", "Compliance Expert", "Employee Champion", "Process Optimizer"]
      }
    },
    targets: [
      {
        id: "hr-target-1",
        name: "Payroll Processing Accuracy",
        type: "satisfaction",
        value: 100,
        achieved: 98,
        period: "monthly",
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        status: "active"
      },
      {
        id: "hr-target-2",
        name: "Leave Processing Time",
        type: "response-time",
        value: 24,
        achieved: 18,
        period: "monthly",
        startDate: "2025-05-01",
        endDate: "2025-05-31",
        status: "completed"
      }
    ],
    permissions: [
      "manage_payroll",
      "manage_leaves", 
      "manage_attendance",
      "manage_employees",
      "hr_analytics",
      "compliance_management"
    ],
    workingHours: {
      monday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      tuesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      wednesday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      thursday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      friday: { isWorking: true, startTime: "09:00", endTime: "18:00", breakTime: "13:00-14:00" },
      saturday: { isWorking: false },
      sunday: { isWorking: false }
    },
    reportingManager: "director-001",
    salaryStructure: {
      id: "sal-hr-001",
      employeeId: "hr-001",
      basicSalary: 60000,
      allowances: [
        { id: "hra-hr", name: "HRA", type: "allowance", amount: 12000, isPercentage: false, isFixed: true, taxable: true },
        { id: "transport-hr", name: "Transport Allowance", type: "allowance", amount: 3600, isPercentage: false, isFixed: true, taxable: false },
        { id: "medical-hr", name: "Medical Allowance", type: "allowance", amount: 2400, isPercentage: false, isFixed: true, taxable: false }
      ],
      deductions: [
        { id: "tax-hr", name: "Income Tax", type: "deduction", amount: 8500, isPercentage: false, isFixed: false, taxable: false },
        { id: "pf-hr", name: "PF Contribution", type: "deduction", amount: 12, isPercentage: true, isFixed: true, taxable: false },
        { id: "esi-hr", name: "ESI Contribution", type: "deduction", amount: 1.75, isPercentage: true, isFixed: true, taxable: false }
      ],
      variablePay: [
        { id: "performance-hr", name: "Performance Bonus", type: "variable", amount: 8000, isPercentage: false, isFixed: false, taxable: true }
      ],
      currency: "USD",
      effectiveDate: "2025-01-01",
      lastUpdated: "2025-05-26",
      approvalStatus: "approved",
      approvedBy: "director-001"
    },
    leaveBalance: {
      employeeId: "hr-001",
      annualLeave: 20,
      sickLeave: 10,
      casualLeave: 6,
      maternityPaternityLeave: 84,
      compensatoryOff: 3,
      year: 2025,
      lastUpdated: "2025-05-26"
    }
  }
];

export const tasks: Task[] = [
  {
    id: "task-001",
    title: "Follow up with Premium Travel Inc enquiry",
    description: "Client interested in 15-day Europe package for corporate group",
    assignedTo: "staff-001",
    assignedBy: "manager-001",
    department: "sales",
    priority: "high",
    status: "in-progress",
    dueDate: "2025-05-27T18:00:00Z",
    createdAt: "2025-05-26T09:00:00Z",
    updatedAt: "2025-05-26T14:30:00Z",
    tags: ["enquiry", "corporate", "europe", "premium"],
    comments: [
      {
        id: "comment-001",
        userId: "staff-001",
        userName: "John Smith",
        message: "Initial contact made, client very interested. Scheduled call for tomorrow.",
        timestamp: "2025-05-26T14:30:00Z"
      }
    ]
  },
  {
    id: "task-002",
    title: "Process hotel booking for Booking #BK-2025-001",
    description: "Confirm hotel reservation for Thailand package",
    assignedTo: "staff-002",
    assignedBy: "system",
    department: "operations",
    priority: "medium",
    status: "pending",
    dueDate: "2025-05-27T12:00:00Z",
    createdAt: "2025-05-26T08:00:00Z",
    updatedAt: "2025-05-26T08:00:00Z",
    tags: ["booking", "hotel", "thailand"],
    comments: []
  },
  {
    id: "task-003",
    title: "Resolve agent login issues for Travel Hub Ltd",
    description: "Agent unable to access portal, needs immediate assistance",
    assignedTo: "staff-003",
    assignedBy: "staff-003",
    department: "customer-support",
    priority: "urgent",
    status: "in-progress",
    dueDate: "2025-05-26T20:00:00Z",
    createdAt: "2025-05-26T15:00:00Z",
    updatedAt: "2025-05-26T16:00:00Z",
    tags: ["agent-support", "technical", "urgent"],
    comments: [
      {
        id: "comment-002",
        userId: "staff-003",
        userName: "Mike Chen",
        message: "Identified the issue, working on resolution.",
        timestamp: "2025-05-26T16:00:00Z"
      }
    ]
  }
];

export const realTimeUpdates: RealTimeUpdate[] = [
  {
    id: "update-001",
    type: "enquiry",
    data: {
      enquiryId: "ENQ-2025-0156",
      clientName: "Adventure Seekers Ltd",
      destination: "Nepal",
      value: 25000,
      assignedTo: "staff-001"
    },
    timestamp: "2025-05-26T16:30:00Z",
    department: "sales",
    staffId: "staff-001"
  },
  {
    id: "update-002",
    type: "booking",
    data: {
      bookingId: "BK-2025-0089",
      status: "confirmed",
      clientName: "Global Tours Inc",
      value: 45000
    },
    timestamp: "2025-05-26T16:25:00Z",
    department: "operations",
    staffId: "staff-002"
  },
  {
    id: "update-003",
    type: "performance",
    data: {
      staffId: "staff-001",
      metric: "daily_revenue",
      value: 15000,
      target: 12000,
      achievement: 125
    },
    timestamp: "2025-05-26T16:20:00Z",
    department: "sales",
    staffId: "staff-001"
  }
];

// Helper functions
export const getDepartmentById = (id: string) => {
  return departments.find(dept => dept.id === id);
};

export const getStaffByDepartment = (departmentId: string) => {
  return enhancedStaffMembers.filter(staff => staff.department === departmentId);
};

export const getTasksByStaff = (staffId: string) => {
  return tasks.filter(task => task.assignedTo === staffId);
};

export const getTasksByDepartment = (departmentId: string) => {
  return tasks.filter(task => task.department === departmentId);
};

export const getRealtimeUpdatesByDepartment = (departmentId: string): RealTimeUpdate[] => {
  const baseUpdates: RealTimeUpdate[] = [
    {
      id: "update-004",
      type: "performance" as const,
      data: {
        staffId: "staff-002",
        metric: "monthly_revenue",
        value: 300000,
        target: 250000,
        achievement: 90
      },
      timestamp: "2025-05-26T16:15:00Z",
      department: "operations",
      staffId: "staff-002"
    },
    {
      id: "update-005",
      type: "enquiry" as const,
      data: {
        enquiryId: "ENQ-2025-0157",
        clientName: "Adventure Seekers Ltd",
        destination: "Nepal",
        value: 25000,
        assignedTo: "staff-002"
      },
      timestamp: "2025-05-26T16:10:00Z",
      department: "sales",
      staffId: "staff-002"
    },
    {
      id: "update-006",
      type: "booking" as const,
      data: {
        bookingId: "BK-2025-0090",
        status: "confirmed",
        clientName: "Global Tours Inc",
        value: 45000
      },
      timestamp: "2025-05-26T16:05:00Z",
      department: "operations",
      staffId: "staff-002"
    }
  ];

  if (departmentId === "hr") {
    return [
      {
        id: `hr-update-${Date.now()}-1`,
        type: "leave" as const,
        data: {
          employeeName: "John Doe",
          leaveType: "annual",
          days: 3,
          status: "pending"
        },
        timestamp: new Date().toISOString(),
        department: "hr",
        staffId: "hr-001"
      },
      {
        id: `hr-update-${Date.now()}-2`,
        type: "payroll" as const,
        data: {
          period: "05-2025",
          status: "processing",
          employeesCount: 45,
          totalAmount: 2925000
        },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        department: "hr",
        staffId: "hr-001"
      },
      {
        id: `hr-update-${Date.now()}-3`,
        type: "attendance" as const,
        data: {
          date: new Date().toLocaleDateString(),
          presentEmployees: 42,
          totalEmployees: 45,
          attendanceRate: 93
        },
        timestamp: new Date(Date.now() - 600000).toISOString(),
        department: "hr",
        staffId: "hr-001"
      }
    ];
  }

  return baseUpdates.filter(update => update.department === departmentId);
};
