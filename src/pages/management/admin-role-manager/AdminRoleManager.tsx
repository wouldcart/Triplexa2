import React, { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import CreateAdminForm from './components/CreateAdminForm';
import AdminList from './components/AdminList';


export type AdminRole = 'super_admin' | 'admin';

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  department: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  position?: string;
  created_at?: string;
  updated_at?: string;
};

const AdminRoleManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const canAccessPage = useMemo(
    () => (user?.role === 'super_admin' || user?.role === 'admin'),
    [user]
  );

  const loadAdmins = async () => {
    try {
      setLoadingList(true);
      // Prefer regular client; fallback to admin client if RLS blocks
      let { data, error } = await supabase
        .from('profiles')
        .select('id,name,email,role,department,phone,status,position,created_at,updated_at')
        .in('role', ['super_admin', 'admin']);

      if (error && isAdminClientConfigured) {
        const adminRes = await adminSupabase
          .from('profiles')
          .select('id,name,email,role,department,phone,status,position,created_at,updated_at')
          .in('role', ['super_admin', 'admin']);
        data = adminRes.data as any[];
      }

      setAdmins((data || []) as AdminProfile[]);
    } catch (err) {
      toast({
        title: 'Load failed',
        description: 'Unable to load admin users. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canAccessPage) {
    return (
      <PageLayout title="Admin Role Manager">
        <div className="p-2 sm:p-3 md:p-4">
          <Card>
            <CardHeader>
              <CardTitle>No Access</CardTitle>
              <CardDescription>Only super_admin and admin can access this page.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Contact your system administrator to request access.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Admin Role Manager" 
      description="Create and manage users with super_admin and admin roles"
      keywords={["admin", "super_admin", "management", "roles"]}
      breadcrumbItems={[{ title: 'Management', href: '/management' }, { title: 'Admin Role Manager', href: '/management/admin/role-manager' }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/management/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Admin Role Manager</h1>
              <p className="text-muted-foreground">Create and manage admin-level users.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Admins only</Badge>
            {isAdminClientConfigured ? (
              <Badge variant="secondary">Admin API configured</Badge>
            ) : (
              <Badge variant="destructive">Admin API not configured</Badge>
            )}
          </div>
        </div>

        {/* Create Admin Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create admin/super_admin</CardTitle>
            <CardDescription>Uses the service role API; created users can login via /login.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAdminForm onCreated={loadAdmins} />
          </CardContent>
        </Card>

        {/* Admins List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing admin profiles</CardTitle>
            <CardDescription>View and edit admin-level profiles; change passwords securely.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminList admins={admins} loading={loadingList} onRefresh={loadAdmins} />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AdminRoleManager;