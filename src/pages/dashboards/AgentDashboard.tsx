import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  FileText, CheckCircle, Calendar, DollarSign, 
  Upload, Bell, Users, MapPin, Clock, Download,
  Eye, Share, Edit, BookOpen, Wallet, Plus
} from 'lucide-react';
import AgentDashboardHeader from '@/components/dashboards/agent/AgentDashboardHeader';
import { useApp } from '@/contexts/AppContext';
import AgentOverviewCards from '@/components/dashboards/agent/AgentOverviewCards';
import { AgentManagementService } from '../../services/agentManagementService';
import MobileBottomNavigation from '@/components/dashboards/agent/MobileBottomNavigation';
import { FloatingActionButton, ProposalQuickActions, ClientQuickActions, DocumentQuickActions } from '@/components/dashboard/FloatingActionButton';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { 
  ProposalsSection, 
  FixedDeparturesSection, 
  ClientDetailsSection, 
  DocumentsSection, 
  ReportsSection, 
  EnhancedProfileSettings 
} from '@/components/dashboard/sections';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAgentProfileGuard } from '@/hooks/useAgentProfileGuard';

const AgentDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [suspensionReason, setSuspensionReason] = useState<string | undefined>(undefined);
  
  // Initialize real-time notifications
  useRealTimeNotifications();

  const getQuickActions = () => {
    switch (activeTab) {
      case 'proposals':
        return ProposalQuickActions;
      case 'clients':
        return ClientQuickActions;
      case 'documents':
        return DocumentQuickActions;
      default:
        return []; // Default actions for overview and other tabs
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AgentOverviewCards />;
      case 'proposals':
        return <ProposalsSection />;
      case 'departures':
        return <FixedDeparturesSection />;
      case 'clients':
        return <ClientDetailsSection />;
      case 'documents':
        return <DocumentsSection />;
      // case 'commission':
      //   return <CommissionWalletSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return <EnhancedProfileSettings />;
      default:
        return <AgentOverviewCards />;
    }
  };

  const navigate = useNavigate();
  const { loading: guardLoading, shouldRedirect, shouldPopup, completion, status } = useAgentProfileGuard(50);
  const [profilePromptOpen, setProfilePromptOpen] = useState(false);

  useEffect(() => {
    if (shouldRedirect) {
      navigate('/dashboards/agent/profile', { replace: true });
      return;
    }
    if (shouldPopup) {
      setProfilePromptOpen(true);
    } else {
      setProfilePromptOpen(false);
    }
  }, [shouldRedirect, shouldPopup, navigate]);

  // Fetch suspension reason when user is suspended
  useEffect(() => {
    let mounted = true;
    const loadReason = async () => {
      if (currentUser?.role === 'agent' && String(currentUser?.status) === 'suspended' && currentUser?.id) {
        const { data } = await AgentManagementService.getAgentById(String(currentUser.id));
        if (mounted) setSuspensionReason((data as any)?.suspension_reason);
      } else {
        if (mounted) setSuspensionReason(undefined);
      }
    };
    loadReason();
    return () => { mounted = false; };
  }, [currentUser?.id, currentUser?.status, currentUser?.role]);

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      {/* Agent Dashboard Header */}
      <AgentDashboardHeader />
      
      <div className={`container mx-auto ${isMobile ? 'px-4 py-4' : 'p-6'} space-y-6`}>
        {/* Suspended status notice and gating */}
        {currentUser?.role === 'agent' && String(currentUser?.status) === 'suspended' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="destructive">Suspended</Badge>
                <span>Account access restricted</span>
              </CardTitle>
              <CardDescription>
                <div>Your account has been suspended. Dashboard functionality is temporarily disabled. Please contact support or your agency admin for assistance.</div>
                {suspensionReason && (
                  <div className="mt-2"><span className="font-medium">Reason:</span> {suspensionReason}</div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {/* If not suspended, render the rest of the dashboard */}
        {!(currentUser?.role === 'agent' && String(currentUser?.status) === 'suspended') && (
          <>
            {/* Pending status notice */}
            {currentUser?.role === 'agent' && String(currentUser?.status) === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">Pending Approval</Badge>
                    <span>Account under review</span>
                  </CardTitle>
                  <CardDescription>
                    Your account is pending approval by our team. You can use the dashboard with limited access while we review your application.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            {isMobile ? (
              /* Mobile: Single content area with bottom navigation */
              <div className="space-y-4">
                {/* Quick Actions for Mobile */}
                {activeTab === 'overview' && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    <Button size="sm" className="flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      New Proposal
                    </Button>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <Users className="h-4 w-4 mr-2" />
                      Clients
                    </Button>
                  </div>
                )}
                
                {/* Content */}
                <div className="min-h-[60vh]">
                  {renderTabContent()}
                </div>
              </div>
            ) : (
              /* Desktop: Traditional tabs layout */
              <div className="space-y-6">
                {/* Overview Cards */}
                <AgentOverviewCards />
                
                {/* Main Dashboard Tabs */}
                <Tabs defaultValue="proposals" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="proposals" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Proposals
                    </TabsTrigger>
                    <TabsTrigger value="departures" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fixed Departures
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Client Details
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Reports
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="proposals">
                    <ProposalsSection />
                  </TabsContent>

                  <TabsContent value="departures">
                    <FixedDeparturesSection />
                  </TabsContent>

                  <TabsContent value="clients">
                    <ClientDetailsSection />
                  </TabsContent>

                  <TabsContent value="documents">
                    <DocumentsSection />
                  </TabsContent>

                  <TabsContent value="reports">
                    <ReportsSection />
                  </TabsContent>

                  <TabsContent value="settings">
                    <EnhancedProfileSettings />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}
      
      {/* Floating Action Button */}
      <FloatingActionButton 
        actions={getQuickActions()}
      />

      {/* Profile Completion Prompt */}
      <Dialog open={profilePromptOpen} onOpenChange={setProfilePromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Update required profile fields to reach the minimum completion target.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your profile is {completion}% complete. Please update Company Logo, Agency/Company Name, Business Type, Business Phone, Full Name, City, Country, and Business Address to reach at least 50% completion.
            </p>
            <div className="space-y-2">
              <Progress value={completion} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Status: {(status || 'unknown')}</span>
                <span>Target: 50%+</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setProfilePromptOpen(false)}>Maybe Later</Button>
              <Button onClick={() => navigate('/dashboards/agent/profile')}>Complete Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDashboard;