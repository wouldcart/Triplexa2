import React, { useState } from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import type { AdminProfile } from '../AdminRoleManager';

type Props = {
  admins: AdminProfile[];
  loading?: boolean;
  onRefresh?: () => void;
};

const AdminList: React.FC<Props> = ({ admins, loading, onRefresh }) => {
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const setPasswordFor = (id: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [id]: value }));
  };

  const changePassword = async (id: string, email: string) => {
    const newPassword = passwords[id];
    if (!newPassword || newPassword.length < 8) {
      toast({ title: 'Invalid password', description: 'Use at least 8 characters.', variant: 'destructive' });
      return;
    }

    if (!isAdminClientConfigured) {
      toast({ title: 'Admin API unavailable', description: 'Service role key missing.', variant: 'destructive' });
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [id]: true }));
      const { data: users, error } = await adminSupabase.auth.admin.listUsers();
      if (error) throw error;
      const target = users.users.find((u: any) => u.email === email);
      if (!target) throw new Error('Auth user not found for profile');

      const updateRes = await adminSupabase.auth.admin.updateUserById(target.id, { password: newPassword } as any);
      if (updateRes.error) throw updateRes.error;

      toast({ title: 'Password updated', description: `Password changed for ${email}`, variant: 'success' });
      setPasswords((prev) => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Unable to update password', variant: 'destructive' });
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const setStatus = async (id: string, status: AdminProfile['status']) => {
    if (!isAdminClientConfigured) {
      toast({ title: 'Admin API unavailable', description: 'Service role key missing.', variant: 'destructive' });
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [id]: true }));
      const { error } = await adminSupabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Status updated', description: `Profile set to ${status}`, variant: 'success' });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message || 'Unable to update status', variant: 'destructive' });
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading admins...</div>
      ) : admins.length === 0 ? (
        <div className="text-sm text-muted-foreground">No admin profiles found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.position || '—'}</div>
                </TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>
                  <Badge variant={a.role === 'super_admin' ? 'default' : 'secondary'}>{a.role}</Badge>
                </TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell>
                  <Badge variant={a.status === 'active' ? 'success' : a.status === 'suspended' ? 'destructive' : 'secondary'}>
                    {a.status}
                  </Badge>
                </TableCell>
                <TableCell>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Input
                      type="password"
                      value={passwords[a.id] || ''}
                      onChange={(e) => setPasswordFor(a.id, e.target.value)}
                      placeholder="New password"
                      className="w-40"
                      disabled={!!updating[a.id]}
                    />
                    <Button variant="outline" size="sm" disabled={!!updating[a.id]} onClick={() => changePassword(a.id, a.email)}>
                      {updating[a.id] ? 'Updating...' : 'Change Password'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!!updating[a.id]}
                      onClick={() => setStatus(a.id, a.status === 'active' ? 'suspended' : 'active')}
                    >
                      {a.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminList;