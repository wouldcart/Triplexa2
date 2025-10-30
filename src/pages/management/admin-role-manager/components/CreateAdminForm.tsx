import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

type Props = {
  onCreated?: () => void;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\- ()]{7,20}$/;

const CreateAdminForm: React.FC<Props> = ({ onCreated }) => {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin'>('super_admin');
  const [department, setDepartment] = useState('Administrator');
  const [position, setPosition] = useState('owner');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('super_admin');
    setDepartment('Administrator');
    setPosition('owner');
    setPassword('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdminClientConfigured) {
      toast({
        title: 'Admin client not configured',
        description: 'Set env var VITE_SUPABASE_SERVICE_ROLE_KEY to allow creating admin users.',
        variant: 'destructive'
      });
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({ title: 'Form incomplete', description: 'Name, email and password are required.', variant: 'destructive' });
      return;
    }

    if (!emailRegex.test(email)) {
      toast({ title: 'Invalid email', description: 'Enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (phone && !phoneRegex.test(phone)) {
      toast({ title: 'Invalid phone', description: 'Enter a valid phone number.', variant: 'destructive' });
      return;
    }

    try {
      setCreating(true);

      // Create auth user via admin API
      const { data: created, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role },
        email_confirm: true
      } as any);

      if (createError) throw createError;

      const authUserId = (created?.user?.id as string) || '';
      if (!authUserId) throw new Error('User created but ID not returned');

      // Ensure raw_user_meta_data role is set explicitly
      await adminSupabase.auth.admin.updateUserById(authUserId, {
        user_metadata: { role }
      } as any);

      // Upsert profile record bypassing RLS (avoids duplicate key when trigger already created profile)
      const profilePayload = {
        id: authUserId,
        email,
        name,
        role,
        department,
        phone,
        status: 'active' as const,
        position,
        avatar: '/avatars/default.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileError) throw profileError;

      // Create or update user role record for normalization (if table exists)
      // This will no-op safely if the table is missing, but we prefer it present via migration
      const { error: userRoleError } = await adminSupabase
        .from('user_roles')
        .upsert({
          user_id: authUserId,
          role,
          source: 'admin_create',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,role' });

      if (userRoleError && !/relation .* user_roles .* does not exist/i.test(userRoleError.message)) {
        // If table exists but operation failed, surface the error; otherwise ignore missing table
        throw userRoleError;
      }

      toast({ title: 'Admin user created', description: `${role} created: ${name}`, variant: 'success' });
      resetForm();
      onCreated?.();
    } catch (err: any) {
      toast({ title: 'Create failed', description: err?.message || 'Unable to create user', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" disabled={!isAdminClientConfigured || creating} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" disabled={!isAdminClientConfigured || creating} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" disabled={!isAdminClientConfigured || creating} />
      </div>
      <div>
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as 'super_admin' | 'admin')} disabled={!isAdminClientConfigured || creating}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">super_admin</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="department">Department</Label>
        <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Administrator" disabled={!isAdminClientConfigured || creating} />
      </div>
      <div>
        <Label htmlFor="position">Position</Label>
        <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="owner" disabled={!isAdminClientConfigured || creating} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" disabled={!isAdminClientConfigured || creating} />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" disabled={!isAdminClientConfigured || creating}>
          {creating ? 'Creating...' : 'Create User'}
        </Button>
      </div>
      {!isAdminClientConfigured && (
        <div className="md:col-span-2">
          <p className="text-sm text-destructive">Service role key missing. Set env `VITE_SUPABASE_SERVICE_ROLE_KEY` to enable admin creation.</p>
        </div>
      )}
    </form>
  );
};

export default CreateAdminForm;