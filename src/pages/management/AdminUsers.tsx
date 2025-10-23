import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import PageLayout from '@/components/layout/PageLayout';

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager';
  department: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;
};

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'manager'>('manager');
  const [department, setDepartment] = useState('Administration');
  const [phone, setPhone] = useState('');

  const canManageAdmins = useMemo(
    () => (user?.role === 'super_admin' || user?.role === 'manager'),
    [user]
  );

  const loadAdmins = async () => {
    try {
      setLoadingList(true);
      // First try via session client (RLS-aware)
      let { data, error } = await supabase
        .from('profiles')
        .select('id,name,email,role,department,phone,status,created_at')
        .in('role', ['super_admin', 'manager']);

      if (error && isAdminClientConfigured) {
        // Fallback to admin client if RLS blocks the query
        const adminRes = await adminSupabase
          .from('profiles')
          .select('id,name,email,role,department,phone,status,created_at')
          .in('role', ['super_admin', 'manager']);
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('manager');
    setDepartment('Administration');
    setPhone('');
  };

  const createAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdminClientConfigured) {
      toast({
        title: 'Admin client not configured',
        description: 'Set env var VITE_SUPABASE_SERVICE_ROLE_KEY to allow creating admin users.',
        variant: 'destructive'
      });
      return;
    }

    if (!email || !password || !name) {
      toast({
        title: 'Form incomplete',
        description: 'Please fill in email, password, and name.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);

      // Create auth user via admin API (doesn't affect current session)
      const { data: created, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role },
        email_confirm: true
      } as any);

      if (createError) throw createError;

      const authUserId = (created?.user?.id as string) || '';
      if (!authUserId) throw new Error('User created but ID not returned');

      // Create profile record bypassing RLS
      const profilePayload = {
        id: authUserId,
        email,
        name,
        role,
        department,
        phone,
        status: 'active' as const,
        position: role === 'super_admin' ? 'Super Admin' : 'Manager',
        avatar: '/avatars/default.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert(profilePayload);

      if (profileError) throw profileError;

      toast({
        title: 'Admin user created',
        description: `${role === 'super_admin' ? 'Super Admin' : 'Manager'} created: ${name}`
      });

      resetForm();
      await loadAdmins();
    } catch (err: any) {
      toast({
        title: 'Create failed',
        description: err?.message || 'Unable to create admin user',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  if (!canManageAdmins) {
    return (
      <PageLayout title="Admin Users">
        <div className="p-2 sm:p-3 md:p-4">
          <Card>
            <CardHeader>
              <CardTitle>No Access</CardTitle>
              <CardDescription>Only administrators can access this page.</CardDescription>
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
      title="Admin Users" 
      description="Create and manage users with admin roles"
      keywords={["admin", "users", "management"]}
      breadcrumbItems={[{ title: 'Management', href: '/management' }, { title: 'Admin Users', href: '/management/admin/users' }]}
    >
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">Create and manage users with admin roles.</p>
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
          <CardTitle>Create admin user</CardTitle>
          <CardDescription>Create admin accounts using the service role key without affecting the current session.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAdminUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" disabled={!isAdminClientConfigured || creating} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" disabled={!isAdminClientConfigured || creating} />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" disabled={!isAdminClientConfigured || creating} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'super_admin' | 'manager')} disabled={!isAdminClientConfigured || creating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Administration" disabled={!isAdminClientConfigured || creating} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" disabled={!isAdminClientConfigured || creating} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={!isAdminClientConfigured || creating}>
                {creating ? 'Creating...' : 'Create Admin User'}
              </Button>
            </div>
            {!isAdminClientConfigured && (
              <div className="md:col-span-2">
                <p className="text-sm text-destructive">Service role key missing. Set env `VITE_SUPABASE_SERVICE_ROLE_KEY` to enable admin creation.</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle>Admin users list</CardTitle>
          <CardDescription>Users who currently have admin roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingList ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-6 text-center text-muted-foreground">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-6 text-center text-muted-foreground">No admin users found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>
                        <Badge variant={a.role === 'super_admin' ? 'default' : 'secondary'}>
                          {a.role === 'super_admin' ? 'Super Admin' : 'Manager'}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.department}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'active' ? 'default' : a.status === 'suspended' ? 'destructive' : 'secondary'}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageLayout>
  );
};

export default AdminUsers;