
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { User } from '@/types/User';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useEffect, useState } from 'react';
import * as serviceWorkerRegistration from '@/utils/serviceWorkerRegistration';
import { HelmetProvider } from 'react-helmet-async';
import { SEOProvider } from '@/contexts/SEOContext';
import { supabase } from '@/lib/supabaseClient';
import { AuthService } from '@/services/authService';
import { locationResolutionService } from '@/services/locationResolutionService';
import { telemetryService } from '@/services/telemetryService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AgentSignup from '@/pages/auth/AgentSignup';
import AgentPasswordChange from '@/pages/auth/AgentPasswordChange';
import ResetPassword from '@/pages/auth/ResetPassword';
import Unauthorized from '@/pages/auth/Unauthorized';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';



// Sales Module
import SalesLayout from '@/layouts/SalesLayout';
import SalesEnquiries from '@/pages/sales/SalesEnquiries';
import SalesBookings from '@/pages/sales/SalesBookings';
import SalesAgents from '@/pages/sales/SalesAgents';
import SalesReports from '@/pages/sales/SalesReports';


// Dashboard pages
import Dashboard from '@/pages/Dashboard';
import ManagerDashboard from '@/pages/dashboards/ManagerDashboard';
import AgentDashboard from '@/pages/dashboards/AgentDashboard';
import OperationsDashboard from '@/pages/dashboards/OperationsDashboard';
import SalesDashboard from '@/pages/dashboards/SalesDashboard';
import ContentDashboard from '@/pages/dashboards/ContentDashboard';
import SupportDashboard from '@/pages/dashboards/SupportDashboard';
import FinanceDashboard from '@/pages/dashboards/FinanceDashboard';
import StaffDashboard from '@/pages/dashboards/StaffDashboard';
import AgentProfileModern from '@/pages/dashboards/agent/profile';

// Profile page
import Profile from '@/pages/Profile';

import { Toaster } from "@/components/ui/toaster";
import { testSupabaseConnection } from "@/debug/supabaseConnectionTest";
import FollowUps from './pages/followups/FollowUps';

// Run Supabase connection test on app start
// Removed global invocation to avoid Supabase calls on public pages
import AssignQueries from './pages/queries/AssignQueries';
import BookingManagement from './pages/bookings/BookingManagement';
import ItineraryBuilder from './pages/itinerary/ItineraryBuilder';
import EditQuery from './pages/queries/EditQuery';
import EditPackage from './pages/inventory/packages/EditPackage';
import AdvancedProposalCreation from './pages/proposal/AdvancedProposalCreation';
import EnhancedDayWiseBuilder from './components/proposal/EnhancedDayWiseBuilder';

// Import the settings pages
import Settings from './pages/Settings';
import GeneralSettings from './pages/settings/GeneralSettings';
import AccountSettings from './pages/settings/AccountSettings';
import NotificationSettings from './pages/settings/NotificationSettings';
import AppearanceSettings from './pages/settings/AppearanceSettings';
import LanguageManager from './pages/settings/LanguageManager';
import ApiSettings from './pages/settings/ApiSettings';
import AccessControl from './pages/settings/AccessControl';
import AgentSettings from './pages/settings/AgentSettings';
import TranslationTool from './pages/settings/TranslationTool';
import PricingSettings from './pages/settings/PricingSettings';
import EmailTemplates from './pages/settings/EmailTemplates';
import CurrencyConverter from './pages/settings/CurrencyConverter';


// Import hotel inventory pages
import AddHotel from './pages/inventory/hotels/AddHotel';
import AddRoomType from './pages/inventory/hotels/AddRoomType';
import EditRoomType from './pages/inventory/hotels/EditRoomType';
import AddRoomTypePage from './pages/inventory/hotels/AddRoomTypePage';
import EditHotel from './pages/inventory/hotels/EditHotel';
import ViewHotel from './pages/inventory/hotels/ViewHotel';

// Import transport inventory pages
import TransportRoutesPage from './pages/inventory/transport/TransportRoutesPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import TransportTypesPage from './pages/inventory/transport/TransportTypesPage';
import LocationCodesPage from './pages/inventory/transport/LocationCodesPage';

import HRDashboard from './pages/management/staff/HRDashboard';
import HRLayout from './pages/management/hr/HRLayout';
import PayrollPage from './pages/management/hr/PayrollPage';
import LeavesPage from './pages/management/hr/LeavesPage';
import AttendanceManagement from './pages/management/staff/hr/AttendanceManagement';
import SalaryStructureManager from './pages/management/staff/hr/SalaryStructureManager';
import StaffDocsVerification from './pages/management/hr/StaffDocsVerification';
import BankVerification from './pages/management/hr/BankVerification';
import Onboarding from './pages/management/hr/Onboarding';
import Offboarding from './pages/management/hr/Offboarding';
import ComplianceCenter from './pages/management/hr/ComplianceCenter';
import NotFound from './pages/NotFound';

// Import existing inventory pages
import Hotels from './pages/inventory/Hotels';
import Restaurants from './pages/inventory/Restaurants';
import Transport from './pages/inventory/Transport';
import Countries from './pages/inventory/countries/CountriesPage';
import Cities from './pages/inventory/Cities';
import Sightseeing from './pages/inventory/Sightseeing';
import Visa from './pages/inventory/Visa';
import VisaWizard from './pages/inventory/visa/VisaWizard';
import VisaDashboard from './pages/inventory/visa/VisaDashboard';
import AddVisa from './pages/inventory/visa/AddVisa';
import EditVisa from './pages/inventory/visa/EditVisa';
import ViewVisa from './pages/inventory/visa/ViewVisa';
import Packages from './pages/inventory/Packages';
import Templates from './pages/inventory/Templates';

// Import missing query components
import QueryManagement from './pages/queries/QueryManagement';
import CreateQuery from './pages/queries/CreateQuery';
import QueryDetails from './pages/queries/QueryDetails';

// Test components
import DatabaseTest from './components/test/DatabaseTest';
import SupabaseConnectionTest from './components/test/SupabaseConnectionTest';
import TestSeedPage from './pages/TestSeedPage';
import TestHotelCrud from './pages/TestHotelCrud';

// Import missing management components
import AgentManagement from './pages/management/AgentManagement';
import AddAgent from './pages/management/agents/AddAgent';
import ManagementAgentProfile from './pages/management/agents/AgentProfile';
import EditAgent from './pages/management/agents/EditAgent';
import StaffManagement from './pages/management/StaffManagement';
import AddStaff from './pages/management/staff/AddStaff';
import Departments from './pages/management/staff/Departments';
import StaffProfile from './pages/management/staff/StaffProfile';
import EditStaff from './pages/management/staff/EditStaff';
import AdminManagement from './pages/management/AdminManagement';
import AppSettingsAdmin from './pages/management/AppSettingsAdmin';
import AdminUsers from './pages/management/AdminUsers';
import NominatimTools from '@/pages/tools/NominatimTools';
import AdminRoleManager from '@/pages/management/admin-role-manager/AdminRoleManager';

// Import missing restaurant components
import AddEditRestaurant from './pages/inventory/restaurants/AddEditRestaurant';

// Import missing sightseeing components
import AddSightseeing from './pages/inventory/sightseeing/AddSightseeing';
import EditSightseeing from './pages/inventory/sightseeing/EditSightseeing';

// Import missing package components
import CreatePackage from './pages/inventory/packages/CreatePackage';
import ViewPackage from './pages/inventory/packages/ViewPackage';

// Import agent-specific pages
import AgentProfile from './pages/agent/AgentProfile';

// Import traveler dashboard and components
import TravelerDashboardPage from './pages/TravelerDashboardPage';
import TravelerItineraryPage from './pages/TravelerItineraryPage';
import TravelerHistoryPage from './pages/TravelerHistoryPage';
import TravelerNotificationsPage from './pages/TravelerNotificationsPage';
import TravelerSettingsPage from './pages/TravelerSettingsPage';
import TravelerSupportPage from './pages/TravelerSupportPage';
import TravelerProfilePage from './pages/TravelerProfilePage';

// New feature components
import ActivityTrackingDashboard from './components/staff/ActivityTrackingDashboard';
import UniversalReportGenerator from './components/reports/UniversalReportGenerator';
import PageLayout from '@/components/layout/PageLayout';

// Component to handle role-based dashboard routing
const DashboardRouter: React.FC = () => {
  const { currentUser } = useApp();
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  switch (currentUser.role) {
    case 'super_admin':
      return <Dashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'operations':
      return <OperationsDashboard />;
    case 'sales':
      return <SalesDashboard />;
    case 'content':
      return <ContentDashboard />;
    case 'support':
      return <SupportDashboard />;
    case 'finance':
      return <FinanceDashboard />;
    case 'user':
      return <TravelerDashboardPage />;
    default:
      return <Dashboard />;
  }
};

// Root redirect component
const RootRedirect = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [resetMode, setResetMode] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect PKCE code for password reset arriving at main domain root and exchange for session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      (async () => {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            setError(error.message || 'Invalid or expired reset link');
            return;
          }
          // Enter reset mode and clean the URL
          setResetMode(true);
          setResetOpen(true);
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, document.title, cleanUrl);
        } catch (e) {
          console.error('Unexpected error exchanging code:', e);
          setError(e instanceof Error ? e.message : 'Unable to process reset link');
        }
      })();
    }
  }, [location.search]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await AuthService.updatePassword(newPassword);
      if (error) {
        setError(error);
        return;
      }
      // Password updated; redirect to role-based dashboard
      setResetMode(false);
      navigate('/', { replace: true });
    } finally {
      setUpdating(false);
    }
  };
  
  // Only show loading during initial session check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // If we're in reset mode, show a modal dialog for password update
  if (resetMode) {
    return (
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
          </DialogHeader>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={() => { setResetOpen(false); navigate('/login'); }}>Back to Login</Button>
                  <Button type="submit" disabled={updating}>{updating ? 'Updating…' : 'Update Password'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect authenticated users based on their role and department
  const getRedirectPath = (user: User) => {
    switch (user.role) {
      case 'hr_manager':
        return '/management/hr';
      case 'super_admin':
      case 'manager':
        return '/dashboard';
      case 'finance_manager':
        return '/dashboards/finance';
      case 'staff':
        switch (user.department) {
          case 'Operations':
            return '/dashboards/operations';
          case 'Sales':
            return '/dashboards/sales';
          case 'Marketing':
            return '/dashboards/content';
          case 'Customer Support':
            return '/dashboards/support';
          case 'Support':
            return '/dashboards/support';
          case 'Finance':
            return '/dashboards/finance';
          case 'Field Sales':
            return '/management/agents';
          default:
            return '/dashboard';
        }
      case 'agent':
        return '/dashboards/agent';
      case 'user':
        return '/traveler';
      default:
        return '/dashboard';
    }
  };
  
  return <Navigate to={getRedirectPath(user)} replace />;
};

function App() {
  const location = useLocation();
  // Pre-warm location cache to improve UX on transport pages
  useEffect(() => {
    locationResolutionService.prewarmCache().catch(() => {});
  }, []);
  // Start telemetry uploader with configurable sinks
  useEffect(() => {
    telemetryService.configure({
      endpointUrl: (import.meta as any).env?.VITE_TELEMETRY_ENDPOINT || null,
      useSupabase: (import.meta as any).env?.VITE_ENABLE_TELEMETRY_SUPABASE === 'true',
      intervalMs: 30000,
    });
    telemetryService.startUploader();
    return () => telemetryService.stopUploader();
  }, []);
  // Register service worker for push notifications
  useEffect(() => {
    const enableSw = (import.meta as any).env?.VITE_ENABLE_SW === 'true';
    const isProd = (import.meta as any).env?.PROD;
    if (isProd && enableSw) {
      serviceWorkerRegistration.register({
        onSuccess: (registration) => {
          console.log('Service Worker registered successfully:', registration);
        },
        onUpdate: (registration) => {
          console.log('Service Worker updated:', registration);
        }
      });
    } else {
      // Prevent SW from interfering during local development
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(regs => regs.forEach(r => r.unregister()))
          .catch(() => {});
      }
    }

    // Cleanup on unmount
    return () => {
      // Optional: unregister service worker on app unmount
      // serviceWorkerRegistration.unregister();
    };
  }, []);

  // Conditionally run Supabase connection test only on non-public routes
  useEffect(() => {
    const path = location.pathname;
    const isPublic = /^\/(privacy|terms)(\/|$)/.test(path);
    if (!isPublic) {
      testSupabaseConnection();
    }
  }, [location.pathname]);

  return (
    <HelmetProvider>
      <SEOProvider>
        <ThemeProvider>
      <Routes>
          {/* Root route with proper authentication handling */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup/agent" element={<AgentSignup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ProtectedRoute><AgentPasswordChange /></ProtectedRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/dashboards" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Query Management Routes */}
        <Route path="/queries" element={<ProtectedRoute><QueryManagement /></ProtectedRoute>} />
        <Route path="/queries/create" element={<ProtectedRoute><CreateQuery /></ProtectedRoute>} />
        <Route path="/queries/:id" element={<ProtectedRoute><QueryDetails /></ProtectedRoute>} />
        <Route path="/queries/:id/edit" element={<ProtectedRoute><EditQuery /></ProtectedRoute>} />
        <Route path="/queries/edit/:id" element={<ProtectedRoute><EditQuery /></ProtectedRoute>} />
        <Route path="/queries/assign" element={<ProtectedRoute><AssignQueries /></ProtectedRoute>} />
        
        {/* Proposal Creation Routes - Unified to single option */}
        <Route path="/queries/proposal/:id" element={<ProtectedRoute><AdvancedProposalCreation /></ProtectedRoute>} />
        <Route path="/queries/advanced-proposal/:id" element={<ProtectedRoute><AdvancedProposalCreation /></ProtectedRoute>} />
        <Route path="/queries/create-proposal/:id" element={<ProtectedRoute><AdvancedProposalCreation /></ProtectedRoute>} />
        
        {/* Day-wise Itinerary Builder Route */}
        <Route path="/queries/enhanced-daywise/:id" element={<ProtectedRoute><EnhancedDayWiseBuilder /></ProtectedRoute>} />
        
        {/* Legacy proposal routes - redirect to unified proposal creation */}
        <Route path="/queries/basic-proposal/:id" element={<Navigate to="/queries/proposal/:id" replace />} />
        <Route path="/queries/enhanced-proposal/:id" element={<Navigate to="/queries/proposal/:id" replace />} />
        
        {/* Follow-ups Routes */}
        <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
        
        {/* Booking Management Routes */}
        <Route path="/bookings" element={<ProtectedRoute><BookingManagement /></ProtectedRoute>} />
        
        {/* Itinerary Builder Routes */}
        <Route path="/itinerary" element={<ProtectedRoute><ItineraryBuilder /></ProtectedRoute>} />
        
        {/* Activity Tracking Routes */}
        <Route path="/activity-tracking" element={<ProtectedRoute><ActivityTrackingDashboard /></ProtectedRoute>} />
        
        {/* Reports Routes */}
        <Route path="/reports" element={<ProtectedRoute><PageLayout><UniversalReportGenerator /></PageLayout></ProtectedRoute>} />
        
        {/* Agent Management Routes */}
        <Route path="/management/agents" element={<ProtectedRoute><AgentManagement /></ProtectedRoute>} />
        <Route path="/management/agents/add" element={<ProtectedRoute><AddAgent /></ProtectedRoute>} />
        <Route path="/management/agents/:id" element={<ProtectedRoute><ManagementAgentProfile /></ProtectedRoute>} />
        <Route path="/management/agents/:id/edit" element={<ProtectedRoute><EditAgent /></ProtectedRoute>} />
        
        {/* Staff Management Routes */}
        <Route path="/management/staff" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
        <Route path="/management/staff/add" element={<ProtectedRoute><AddStaff /></ProtectedRoute>} />
        <Route path="/management/staff/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        {/* Support both /management/staff/:id and /management/staff/profile/:id */}
        <Route path="/management/staff/profile/:id" element={<ProtectedRoute><StaffProfile /></ProtectedRoute>} />
        <Route path="/management/staff/:id" element={<ProtectedRoute><StaffProfile /></ProtectedRoute>} />
        <Route path="/management/staff/:id/edit" element={<ProtectedRoute><EditStaff /></ProtectedRoute>} />
        <Route path="/management/staff/edit/:id" element={<ProtectedRoute><EditStaff /></ProtectedRoute>} />
        <Route path="/management/hr" element={<ProtectedRoute><HRLayout /></ProtectedRoute>}>
          <Route index element={<HRDashboard />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="leaves" element={<LeavesPage />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="salary" element={<SalaryStructureManager />} />
          <Route path="staff-docs" element={<StaffDocsVerification />} />
          <Route path="bank-verification" element={<BankVerification />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="offboarding" element={<Offboarding />} />
          <Route path="compliance" element={<ComplianceCenter />} />
        </Route>
        
        {/* Admin Management Routes */}
        <Route path="/management/admin" element={<ProtectedRoute requiredRole={['super_admin', 'manager']}><AdminManagement /></ProtectedRoute>} />
        {/* Redirect legacy admin app settings route to unified settings path */}
        <Route path="/management/admin/app-settings" element={<Navigate to="/settings/app" replace />} />
        <Route path="/management/admin/users" element={<ProtectedRoute requiredRole={['super_admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/management/admin/role-manager" element={<ProtectedRoute requiredRole={['super_admin', 'admin']}><AdminRoleManager /></ProtectedRoute>} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboards/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
        <Route path="/dashboards/agent/profile" element={<ProtectedRoute><AgentProfileModern /></ProtectedRoute>} />
        <Route path="/dashboards/operations" element={<ProtectedRoute><OperationsDashboard /></ProtectedRoute>} />
        <Route path="/dashboards/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/dashboards/content" element={<ProtectedRoute><ContentDashboard /></ProtectedRoute>} />
        <Route path="/dashboards/support" element={<ProtectedRoute><SupportDashboard /></ProtectedRoute>} />
        <Route path="/dashboards/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
        <Route path="/dashboards/staff" element={<ProtectedRoute><StaffDashboard /></ProtectedRoute>} />
        
        {/* Sales Module Routes with Layout */}
        <Route path="/dashboards/sales" element={<ProtectedRoute><SalesLayout /></ProtectedRoute>}>
          <Route index element={<SalesDashboard />} />
        </Route>
        
        <Route path="/sales" element={<ProtectedRoute><SalesLayout /></ProtectedRoute>}>
          <Route index element={<SalesEnquiries />} />
          <Route path="enquiries" element={<SalesEnquiries />} />
          <Route path="bookings" element={<SalesBookings />} />
          <Route path="agents" element={<SalesAgents />} />
          <Route path="reports" element={<SalesReports />} />
        </Route>
        
        {/* Inventory Routes */}
        <Route path="/inventory/hotels" element={<ProtectedRoute><Hotels /></ProtectedRoute>} />
        <Route path="/inventory/hotels/add" element={<ProtectedRoute><AddHotel /></ProtectedRoute>} />
        <Route path="/inventory/hotels/:id/edit" element={<ProtectedRoute><EditHotel /></ProtectedRoute>} />
        <Route path="/inventory/hotels/:id" element={<ProtectedRoute><ViewHotel /></ProtectedRoute>} />
        <Route path="/inventory/hotels/:id/add-room-type" element={<ProtectedRoute><AddRoomType /></ProtectedRoute>} />
        <Route path="/inventory/hotels/:hotelId/rooms/add" element={<ProtectedRoute><AddRoomType /></ProtectedRoute>} />
        <Route path="/inventory/hotels/add-room-type/:hotelId" element={<ProtectedRoute><AddRoomType /></ProtectedRoute>} />
        <Route path="/inventory/hotels/rooms/add" element={<ProtectedRoute><AddRoomTypePage /></ProtectedRoute>} />
        <Route path="/inventory/hotels/:hotelId/edit-room-type/:roomTypeId" element={<ProtectedRoute><EditRoomType /></ProtectedRoute>} />
        
        <Route path="/inventory/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
        <Route path="/inventory/restaurants/add" element={<ProtectedRoute><AddEditRestaurant /></ProtectedRoute>} />
        <Route path="/inventory/restaurants/edit/:id" element={<ProtectedRoute><AddEditRestaurant /></ProtectedRoute>} />
        <Route path="/inventory/restaurants/:id/edit" element={<ProtectedRoute><AddEditRestaurant /></ProtectedRoute>} />
        
        <Route path="/inventory/transport" element={<ProtectedRoute><Transport /></ProtectedRoute>} />
        <Route path="/inventory/transport/routes" element={<ProtectedRoute><TransportRoutesPage /></ProtectedRoute>} />
        <Route path="/inventory/transport/types" element={<ProtectedRoute><TransportTypesPage /></ProtectedRoute>} />
        <Route path="/inventory/transport/locations" element={<ProtectedRoute><LocationCodesPage /></ProtectedRoute>} />
        
        <Route path="/inventory/countries" element={<ProtectedRoute><Countries /></ProtectedRoute>} />
        <Route path="/inventory/cities" element={<ProtectedRoute><Cities /></ProtectedRoute>} />
        
        {/* Test routes */}
        <Route path="/test/database" element={<ProtectedRoute><DatabaseTest /></ProtectedRoute>} />
        <Route path="/test/supabase" element={<ProtectedRoute><SupabaseConnectionTest /></ProtectedRoute>} />
        <Route path="/test/seed" element={<ProtectedRoute><TestSeedPage /></ProtectedRoute>} />
        <Route path="/test/hotel-crud" element={<ProtectedRoute><TestHotelCrud /></ProtectedRoute>} />
        
        <Route path="/inventory/sightseeing" element={<ProtectedRoute><Sightseeing /></ProtectedRoute>} />
        <Route path="/inventory/sightseeing/add" element={<ProtectedRoute><AddSightseeing /></ProtectedRoute>} />
        <Route path="/inventory/sightseeing/:id/edit" element={<ProtectedRoute><EditSightseeing /></ProtectedRoute>} />
        <Route path="/inventory/sightseeing/edit/:id" element={<ProtectedRoute><EditSightseeing /></ProtectedRoute>} />
        
        <Route path="/inventory/visa" element={<ProtectedRoute><Visa /></ProtectedRoute>} />
        <Route path="/inventory/visa/wizard" element={<ProtectedRoute><VisaWizard /></ProtectedRoute>} />
        <Route path="/inventory/visa/dashboard" element={<ProtectedRoute><VisaDashboard /></ProtectedRoute>} />
        <Route path="/inventory/visa/add" element={<ProtectedRoute><AddVisa /></ProtectedRoute>} />
        <Route path="/inventory/visa/:id/edit" element={<ProtectedRoute><EditVisa /></ProtectedRoute>} />
        <Route path="/inventory/visa/:id/view" element={<ProtectedRoute><ViewVisa /></ProtectedRoute>} />
        
        <Route path="/inventory/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
        <Route path="/inventory/packages/create" element={<ProtectedRoute><CreatePackage /></ProtectedRoute>} />
        {/* Support both /inventory/packages/:id and /inventory/packages/view/:id for viewing packages */}
        <Route path="/inventory/packages/:id" element={<ProtectedRoute><ViewPackage /></ProtectedRoute>} />
        <Route path="/inventory/packages/view/:id" element={<ProtectedRoute><ViewPackage /></ProtectedRoute>} />
        <Route path="/inventory/packages/:id/edit" element={<ProtectedRoute><EditPackage /></ProtectedRoute>} />
        
        {/* Templates Route - New */}
        <Route path="/inventory/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        
        {/* Agent-specific Routes */}
        <Route path="/agent/profile" element={<Navigate to="/dashboards/agent/profile" replace />} />
        
        {/* Traveler-specific Routes */}
        <Route path="/traveler" element={<ProtectedRoute requiredRole="user"><TravelerDashboardPage /></ProtectedRoute>} />
        <Route path="/traveler/dashboard" element={<ProtectedRoute requiredRole="user"><TravelerDashboardPage /></ProtectedRoute>} />
        <Route path="/traveler/itinerary" element={<ProtectedRoute requiredRole="user"><TravelerItineraryPage /></ProtectedRoute>} />
        <Route path="/traveler/history" element={<ProtectedRoute requiredRole="user"><TravelerHistoryPage /></ProtectedRoute>} />
        <Route path="/traveler/notifications" element={<ProtectedRoute requiredRole="user"><TravelerNotificationsPage /></ProtectedRoute>} />
        <Route path="/traveler/profile" element={<ProtectedRoute requiredRole="user"><TravelerProfilePage /></ProtectedRoute>} />
        <Route path="/traveler/settings" element={<ProtectedRoute requiredRole="user"><TravelerSettingsPage /></ProtectedRoute>} />
        <Route path="/traveler/support" element={<ProtectedRoute requiredRole="user"><TravelerSupportPage /></ProtectedRoute>} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/legacy" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/general" element={<ProtectedRoute><GeneralSettings /></ProtectedRoute>} />
        <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/settings/appearance" element={<ProtectedRoute><AppearanceSettings /></ProtectedRoute>} />
        <Route path="/settings/language" element={<ProtectedRoute><LanguageManager /></ProtectedRoute>} />
        <Route path="/settings/api" element={<ProtectedRoute><ApiSettings /></ProtectedRoute>} />
        <Route path="/settings/access" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
        {/* Alias route for Access Control settings */}
        <Route path="/settings/access-control" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
        <Route path="/settings/agents" element={<ProtectedRoute><AgentSettings /></ProtectedRoute>} />
        {/* Alias route for Agent Management settings */}
        <Route path="/settings/agent-management" element={<ProtectedRoute><AgentSettings /></ProtectedRoute>} />
        <Route path="/settings/translation" element={<ProtectedRoute><TranslationTool /></ProtectedRoute>} />
        {/* Alias route for Translation Tool settings */}
        <Route path="/settings/translation-tool" element={<ProtectedRoute><TranslationTool /></ProtectedRoute>} />
        <Route path="/settings/pricing" element={<ProtectedRoute><PricingSettings /></ProtectedRoute>} />
        <Route path="/settings/currency-converter" element={<ProtectedRoute><CurrencyConverter /></ProtectedRoute>} />
        <Route path="/settings/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
        {/* Unified App Settings route for admins/managers */}
        <Route path="/settings/app" element={<ProtectedRoute requiredRole={['super_admin', 'manager']}><AppSettingsAdmin /></ProtectedRoute>} />
        <Route path="/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />

        {/* Tools */}
        <Route path="/tools/nominatim" element={<ProtectedRoute requiredRole={["super_admin", "manager"]}><NominatimTools /></ProtectedRoute>} />

        {/* Alias routes added to fix broken links */}
        <Route path="/settings/languages" element={<ProtectedRoute><LanguageManager /></ProtectedRoute>} />
        <Route path="/management/admin/" element={<ProtectedRoute requiredRole={['super_admin', 'manager']}><AdminManagement /></ProtectedRoute>} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
        </ThemeProvider>
      </SEOProvider>
    </HelmetProvider>
  );
}

export default App;
