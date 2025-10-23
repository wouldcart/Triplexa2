import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getStoredAgentCredentials, changeAgentPassword } from '@/utils/agentAuth';
import { AgentManagementService } from '@/services/agentManagementService';

const AgentPasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState(''); // username or email
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Include at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Include at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Include at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pwd)) return 'Include at least one special character';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }
      const pwdErr = validatePassword(newPassword);
      if (pwdErr) {
        setError(pwdErr);
        return;
      }

      const creds = getStoredAgentCredentials();
      const match = creds.find(c => {
        const id = identifier.trim().toLowerCase();
        return (
          (c.username && c.username.toLowerCase() === id) ||
          (c.email && c.email.toLowerCase() === id)
        );
      });

      if (!match) {
        setError('No agent found for provided username or email');
        return;
      }

      // Local change first (validates current password)
      const localResult = changeAgentPassword(match.agentId, currentPassword, newPassword);
      if (!localResult.success) {
        setError(localResult.message || 'Failed to change password');
        return;
      }

      // Update DB credentials via RPC (set as permanent)
      try {
        const { error: rpcErr } = await AgentManagementService.setAgentCredentials(
          match.agentId,
          match.username,
          newPassword,
          false
        );
        if (rpcErr) {
          console.warn('RPC credential update error:', rpcErr);
        }
      } catch (rpcEx) {
        console.warn('RPC credential update exception:', rpcEx);
      }

      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              For new agents with temporary credentials or required password change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current (temporary) Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentPasswordChange;