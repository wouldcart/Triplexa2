// Dynamic Import Optimization Configuration
// This file helps optimize code splitting and lazy loading

// Lazy load heavy components and pages
export const lazyLoadPages = {
  // Dashboard pages - grouped for better caching
  Dashboard: () => import('@/pages/Dashboard'),
  ManagerDashboard: () => import('@/pages/dashboards/ManagerDashboard'),
  AgentDashboard: () => import('@/pages/dashboards/AgentDashboard'),
  OperationsDashboard: () => import('@/pages/dashboards/OperationsDashboard'),
  SalesDashboard: () => import('@/pages/dashboards/SalesDashboard'),
  ContentDashboard: () => import('@/pages/dashboards/ContentDashboard'),
  SupportDashboard: () => import('@/pages/dashboards/SupportDashboard'),
  FinanceDashboard: () => import('@/pages/dashboards/FinanceDashboard'),
  StaffDashboard: () => import('@/pages/dashboards/StaffDashboard'),
  
  // Management pages - grouped for better caching
  AgentManagement: () => import('@/pages/management/AgentManagement'),
  StaffManagement: () => import('@/pages/management/StaffManagement'),
  AdminManagement: () => import('@/pages/management/AdminManagement'),
  AdminUsers: () => import('@/pages/management/AdminUsers'),
  AdminRoleManager: () => import('@/pages/management/admin-role-manager/AdminRoleManager'),
  
  // Settings pages - grouped for better caching
  Settings: () => import('@/pages/settings/SettingsPage'),
  GeneralSettings: () => import('@/pages/settings/GeneralSettings'),
  AccountSettings: () => import('@/pages/settings/AccountSettings'),
  NotificationSettings: () => import('@/pages/settings/NotificationSettings'),
  AppearanceSettings: () => import('@/pages/settings/AppearanceSettings'),
  LanguageManager: () => import('@/pages/settings/LanguageManager'),
  ApiSettings: () => import('@/pages/settings/ApiSettings'),
  AccessControl: () => import('@/pages/settings/AccessControl'),
  AgentSettings: () => import('@/pages/settings/AgentSettings'),
  TranslationTool: () => import('@/pages/settings/TranslationTool'),
  PricingSettings: () => import('@/pages/settings/PricingSettings'),
  EmailTemplates: () => import('@/pages/settings/EmailTemplates'),
  CurrencyConverter: () => import('@/pages/settings/CurrencyConverter'),
  EmailConfiguration: () => import('@/pages/settings/EmailConfiguration'),
  MarketingCommunications: () => import('@/pages/email/MarketingCommunications'),
  SmsOtpSettings: () => import('@/pages/settings/SmsOtpSettings'),
  
  // Inventory pages - grouped for better caching
  AddHotel: () => import('@/pages/inventory/hotels/AddHotel'),
  AddRoomType: () => import('@/pages/inventory/hotels/AddRoomType'),
  EditRoomType: () => import('@/pages/inventory/hotels/EditRoomType'),
  AddRoomTypePage: () => import('@/pages/inventory/hotels/AddRoomTypePage'),
  EditHotel: () => import('@/pages/inventory/hotels/EditHotel'),
  ViewHotel: () => import('@/pages/inventory/hotels/ViewHotel'),
  
  // Query and proposal pages - grouped for better caching
  CreateQuery: () => import('@/pages/queries/CreateQuery'),
  QueryDetails: () => import('@/pages/queries/QueryDetails'),
  Queries: () => import('@/pages/queries/Queries'),
  TravelEnquiryHub: () => import('@/pages/queries/TravelEnquiryHub'),
  AssignQueries: () => import('@/pages/queries/AssignQueries'),
  EditQuery: () => import('@/pages/queries/EditQuery'),
  AdvancedProposalCreation: () => import('@/pages/proposal/AdvancedProposalCreation'),
  EnhancedDayWiseBuilder: () => import('@/components/proposal/EnhancedDayWiseBuilder'),
  
  // Other pages - grouped for better caching
  FollowUps: () => import('@/pages/followups/FollowUps'),
  BookingManagement: () => import('@/pages/bookings/BookingManagement'),
  ItineraryBuilder: () => import('@/pages/itinerary/ItineraryBuilder'),


  AddAgent: () => import('@/pages/management/agents/AddAgent'),
  ManagementAgentProfile: () => import('@/pages/management/agents/AgentProfile'),
  EditAgent: () => import('@/pages/management/agents/EditAgent'),
  AddStaff: () => import('@/pages/management/staff/AddStaff'),
  Departments: () => import('@/pages/management/staff/Departments'),
  StaffProfile: () => import('@/pages/management/staff/StaffProfile'),
  EditStaff: () => import('@/pages/management/staff/EditStaff'),
  PayrollPage: () => import('@/pages/management/staff/hr/PayrollManagement'),
  LeavesPage: () => import('@/pages/management/staff/hr/LeaveManagement'),
  AttendanceManagement: () => import('@/pages/management/staff/hr/AttendanceManagement'),
  SalaryStructureManager: () => import('@/pages/management/staff/hr/SalaryStructureManager'),
  StaffDocsVerification: () => import('@/pages/management/hr/StaffDocsVerification'),
  BankVerification: () => import('@/pages/management/hr/BankVerification'),
  Onboarding: () => import('@/pages/management/hr/Onboarding'),
  Offboarding: () => import('@/pages/management/hr/Offboarding'),
  AgentProfileModern: () => import('@/pages/dashboards/agent/profile'),
  
  // Traveler pages - grouped for better caching
  TravelerDashboardPage: () => import('@/pages/TravelerDashboardPage'),
  TravelerItineraryPage: () => import('@/pages/TravelerItineraryPage'),
  TravelerHistoryPage: () => import('@/pages/TravelerHistoryPage'),
  TravelerNotificationsPage: () => import('@/pages/TravelerNotificationsPage'),
  TravelerProfilePage: () => import('@/pages/TravelerProfilePage'),
  TravelerSettingsPage: () => import('@/pages/TravelerSettingsPage'),
  TravelerSupportPage: () => import('@/pages/TravelerSupportPage'),
  
  // Sales pages - grouped for better caching
  SalesEnquiries: () => import('@/pages/sales/SalesEnquiries'),
  SalesBookings: () => import('@/pages/sales/SalesBookings'),
  SalesAgents: () => import('@/pages/sales/SalesAgents'),
  SalesReports: () => import('@/pages/sales/SalesReports'),
};

// Route-based chunk groups for better caching and loading
export const routeChunkGroups = {
  // Critical routes that should be preloaded
  critical: [
    'Dashboard',
    'Queries',
    'Settings',
  ],
  
  // Management routes - loaded when user accesses management features
  management: [
    'AgentManagement',
    'StaffManagement',
    'AdminManagement',
    'AdminUsers',
    'AdminRoleManager',
    'AddAgent',
    'ManagementAgentProfile',
    'EditAgent',
    'AddStaff',
    'Departments',
    'StaffProfile',
    'EditStaff',
    'PayrollPage',
    'LeavesPage',
    'AttendanceManagement',
    'SalaryStructureManager',
    'StaffDocsVerification',
    'BankVerification',
    'Onboarding',
    'Offboarding',
  ],
  
  // Dashboard routes - loaded based on user role
  dashboards: [
    'ManagerDashboard',
    'AgentDashboard',
    'OperationsDashboard',
    'SalesDashboard',
    'ContentDashboard',
    'SupportDashboard',
    'FinanceDashboard',
    'StaffDashboard',
    'AgentProfileModern',
  ],
  
  // Settings routes - loaded when user accesses settings
  settings: [
    'SettingsPage',
    'GeneralSettings',
    'AccountSettings',
    'AppearanceSettings',
    'NotificationSettings',
    'EmailConfiguration',
    'LanguageManager',
    'TranslationTool',
    'CurrencyConverter',
    'PricingSettings',
    'ApiSettings',
    'AgentSettings',
    'EmailTemplates',
    'SmsOtpSettings',
    'AccessControl',
  ],
  
  // Inventory routes - loaded when user accesses inventory features
  inventory: [
    'AddHotel',
    'AddRoomType',
    'EditRoomType',
    'AddRoomTypePage',
    'EditHotel',
    'ViewHotel',
  ],
  
  // Query and proposal routes - loaded when user accesses query features
  queries: [
    'CreateQuery',
    'QueryDetails',
    'Queries',
    'TravelEnquiryHub',
    'AssignQueries',
    'EditQuery',
    'AdvancedProposalCreation',
    'EnhancedDayWiseBuilder',
  ],
  
  // Traveler routes - loaded when user accesses traveler features
  traveler: [
    'TravelerDashboardPage',
    'TravelerItineraryPage',
    'TravelerHistoryPage',
    'TravelerNotificationsPage',
    'TravelerProfilePage',
    'TravelerSettingsPage',
    'TravelerSupportPage',
  ],
  
  // Sales routes - loaded when user accesses sales features
  sales: [
    'SalesEnquiries',
    'SalesBookings',
    'SalesAgents',
    'SalesReports',
  ],
};

// Lazy load heavy service dependencies
export const lazyLoadServices = {
  // Heavy services that should be loaded on demand
  aiIntegrationService: () => import('@/services/aiIntegrationService'),
  universalPDFService: () => import('@/services/universalPDFService'),
  emailService: () => import('@/services/emailService'),
  comprehensiveTransportService: () => import('@/services/comprehensiveTransportService'),
  integratedTransportService: () => import('@/services/integratedTransportService'),
  transportRouteErrorService: () => import('@/services/transportRouteErrorService'),
  locationResolutionService: () => import('@/services/locationResolutionService'),
  telemetryService: () => import('@/services/telemetryService'),
  agentManagementService: () => import('@/services/agentManagementService'),
  
  // Country/City services
  countriesService: () => import('@/services/countriesService'),
  citiesService: () => import('@/services/citiesService'),
  locationCodesService: () => import('@/services/locationCodesService'),
  
  // Settings services
  appSettingsService: () => import('@/services/appSettingsService'),
  appSettingsService_database: () => import('@/services/appSettingsService_database'),
  metaSettingsService: () => import('@/services/metaSettingsService'),
  countryEmailSettingsService: () => import('@/services/countryEmailSettingsService'),
  emailConfigurationService: () => import('@/services/emailConfigurationService'),
  emailTemplateService: () => import('@/services/emailTemplateService'),
  
  // Auth and user services
  authService: () => import('@/services/authService'),
  credentialService: () => import('@/services/credentialService'),
  loginRecordService: () => import('@/services/loginRecordService'),
  profilesHelper: () => import('@/services/profilesHelper'),
  userTrackingService: () => import('@/services/userTrackingService'),
  
  // Management services
  departmentService: () => import('@/services/departmentService'),
  staffAssignmentService: () => import('@/services/staffAssignmentService'),
  staffBankService: () => import('@/services/staffBankService'),
  staffDocumentsService: () => import('@/services/staffDocumentsService'),
  staffReferralService: () => import('@/services/staffReferralService'),
  staffSequenceService: () => import('@/services/staffSequenceService'),
  
  // Query and proposal services
  enquiriesService: () => import('@/services/enquiriesService'),
  proposalService: () => import('@/services/proposalService'),
  enhancedProposalService: () => import('@/services/enhancedProposalService'),
  supabaseProposalService: () => import('@/services/supabaseProposalService'),
  assignmentRulesService: () => import('@/services/assignmentRulesService'),
  autoAssignmentEngine: () => import('@/services/autoAssignmentEngine'),
  workflowEventsService: () => import('@/services/workflowEventsService'),
  
  // Utility services
  aiRouter: () => import('@/services/aiRouter'),
  supabaseConnectionTest: () => import('@/debug/supabaseConnectionTest'),
  activityDataUtils: () => import('@/utils/activityDataUtils'),
  enqIdGenerator: () => import('@/utils/enqIdGenerator'),
};

// Preload critical chunks for better performance
export const preloadCriticalChunks = async () => {
  try {
    // Preload essential services first
    const criticalServices = [
      lazyLoadServices.authService,
      lazyLoadServices.countriesService,
      lazyLoadServices.citiesService,
      lazyLoadServices.locationResolutionService,
    ];
    
    // Preload in parallel
    await Promise.all(criticalServices.map(service => service()));
    
    // Preload UI components that are likely to be used
    const criticalComponents = [
      lazyLoadPages.Dashboard,
      lazyLoadPages.Queries,
      lazyLoadPages.Settings,
    ];
    
    // Preload after critical services
    setTimeout(() => {
      Promise.all(criticalComponents.map(component => component()));
    }, 1000);
    
  } catch (error) {
    console.warn('Failed to preload critical chunks:', error);
  }
};

// Preload route groups based on user role and likely usage
export const preloadRouteGroup = async (groupName: keyof typeof routeChunkGroups) => {
  try {
    const group = routeChunkGroups[groupName];
    if (!group) return;
    
    const components = group.map(pageName => {
      const loader = lazyLoadPages[pageName as keyof typeof lazyLoadPages];
      return loader ? loader() : Promise.resolve();
    });
    
    await Promise.all(components);
    console.log(`Preloaded route group: ${groupName}`);
  } catch (error) {
    console.warn(`Failed to preload route group ${groupName}:`, error);
  }
};

// Preload services based on user role
export const preloadServicesForRole = (userRole: string) => {
  const roleBasedServices: Record<string, (() => Promise<any>)[]> = {
    super_admin: [
      lazyLoadServices.authService,
      lazyLoadServices.agentManagementService,
      lazyLoadServices.departmentService,
      lazyLoadServices.metaSettingsService,
    ],
    manager: [
      lazyLoadServices.authService,
      lazyLoadServices.agentManagementService,
      lazyLoadServices.departmentService,
      lazyLoadServices.enquiriesService,
    ],
    admin: [
      lazyLoadServices.authService,
      lazyLoadServices.enquiriesService,
      lazyLoadServices.assignmentRulesService,
    ],
    staff: [
      lazyLoadServices.authService,
      lazyLoadServices.enquiriesService,
      lazyLoadServices.assignmentRulesService,
    ],
    agent: [
      lazyLoadServices.authService,
      lazyLoadServices.enquiriesService,
      lazyLoadServices.proposalService,
    ],
    user: [
      lazyLoadServices.authService,
    ],
  };
  
  const services = roleBasedServices[userRole] || [lazyLoadServices.authService];
  
  // Preload services in background
  setTimeout(() => {
    Promise.all(services.map(service => service().catch(() => {})));
  }, 2000);
};

// Service loading utilities
export const loadService = async (serviceName: keyof typeof lazyLoadServices) => {
  try {
    const service = await lazyLoadServices[serviceName]();
    return service;
  } catch (error) {
    console.error(`Failed to load service: ${serviceName}`, error);
    throw error;
  }
};

export const loadPage = async (pageName: keyof typeof lazyLoadPages) => {
  try {
    const page = await lazyLoadPages[pageName]();
    return page;
  } catch (error) {
    console.error(`Failed to load page: ${pageName}`, error);
    throw error;
  }
};

export default {
  lazyLoadPages,
  lazyLoadServices,
  routeChunkGroups,
  preloadCriticalChunks,
  preloadRouteGroup,
  preloadServicesForRole,
  loadService,
  loadPage,
};