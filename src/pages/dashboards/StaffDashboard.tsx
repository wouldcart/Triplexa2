import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { 
  User,
  Calendar,
  CreditCard,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const goTargets = () => {
    const id = (currentUser as any)?.id;
    if (id) navigate(`/management/staff/profile/${id}`);
    else navigate('/management/staff');
  };

  return (
    <PageLayout title="Staff Dashboard" description="Quick access to your personal tools">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">View and update your personal information.</p>
              <Button className="w-full" onClick={() => navigate('/profile')}>Open Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Leaves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Apply for leave and track approvals.</p>
              <Button className="w-full" onClick={() => navigate('/management/hr/leaves')}>Manage Leaves</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                My Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">View payslips and payroll history.</p>
              <Button className="w-full" onClick={() => navigate('/management/hr/payroll')}>Open Payroll</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                My Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Check progress against performance targets.</p>
              <Button className="w-full" onClick={goTargets}>View Targets</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Generate and view workplace reports.</p>
              <Button className="w-full" onClick={() => navigate('/reports')}>Open Reports</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Manage account preferences and security.</p>
              <Button className="w-full" onClick={() => navigate('/settings/account')}>Account Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffDashboard;