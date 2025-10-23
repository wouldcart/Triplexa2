import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Key, 
  AlertCircle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { ManagedAgent, AgentStatus, StaffMember } from '@/types/agentManagement';
import { AgentManagementService } from '@/services/agentManagementService';
import { toast } from 'sonner';

interface AgentApprovalModalProps {
  agent: ManagedAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onAgentUpdated: () => void;
  staffMembers: StaffMember[];
}

const AgentApprovalModal: React.FC<AgentApprovalModalProps> = ({
  agent,
  isOpen,
  onClose,
  onAgentUpdated,
  staffMembers
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  if (!agent) return null;

  const getMissingRequiredFields = () => {
    const missing: string[] = [];
    if (!agent.name || !agent.name.trim()) missing.push('Name');
    if (!agent.email || !agent.email.trim()) missing.push('Email');
    if (!agent.phone || !agent.phone.trim()) missing.push('Phone');
    if (!agent.company_name || !agent.company_name.trim()) missing.push('Company');
    return missing;
  };

  const missingFields = getMissingRequiredFields();
  const isProfileComplete = missingFields.length === 0;

  const handleApprove = async () => {
    if (!agent) return;
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      toast.error(`Cannot approve: missing required fields - ${missing.join(', ')}`);
      return;
    }
    
    setLoading(true);
    try {
      const result = await AgentManagementService.approveAgent({
        id: agent.id,
        status: 'active',
        assigned_staff: assignedStaff
      });

      if (result.error) {
        toast.error('Failed to approve agent');
        return;
      }

      // Generate credentials for the approved agent
      const credentialsResult = await AgentManagementService.generateCredentials(agent.id);
      if (credentialsResult.data) {
        setCredentials({
          username: credentialsResult.data.username,
          password: credentialsResult.data.temporaryPassword
        });
      }

      toast.success('Agent approved successfully');
      onAgentUpdated();
    } catch (error) {
      console.error('Error approving agent:', error);
      toast.error('Failed to approve agent');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!agent || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setLoading(true);
    try {
      const result = await AgentManagementService.rejectAgent(agent.id, rejectionReason);

      if (result.error) {
        toast.error('Failed to reject agent');
        return;
      }

      toast.success('Agent rejected');
      onAgentUpdated();
      onClose();
    } catch (error) {
      console.error('Error rejecting agent:', error);
      toast.error('Failed to reject agent');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCredentials = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      const result = await AgentManagementService.resetCredentials(agent.id);
      
      if (result.error) {
        toast.error('Failed to reset credentials');
        return;
      }

      if (result.data) {
        setCredentials({
          username: result.data.username,
          password: result.data.temporaryPassword
        });
        toast.success('Credentials reset successfully');
      }
    } catch (error) {
      console.error('Error resetting credentials:', error);
      toast.error('Failed to reset credentials');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleClose = () => {
    setAction(null);
    setAssignedStaff([]);
    setRejectionReason('');
    setCredentials(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Management - {agent.name}
          </DialogTitle>
          <DialogDescription>
            Review and manage agent application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{agent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{agent.email}</span>
              </div>
              {agent.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{agent.phone}</span>
                </div>
              )}
              {agent.company_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Company:</span>
                  <span>{agent.company_name}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={agent.status === 'pending' ? 'secondary' : 'default'}>
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Applied:</span>
                <span>{new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Credentials Display (if generated) */}
          {credentials && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Login Credentials Generated:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Username:</span>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{credentials.username}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials.username, 'Username')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Password:</span>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{credentials.password}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials.password, 'Password')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please share these credentials securely with the agent.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Selection */}
          {agent.status === 'pending' && !action && (
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setAction('approve')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Agent
              </Button>
              <Button
                variant="destructive"
                onClick={() => setAction('reject')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject Agent
              </Button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <div className="space-y-4">
              {!isProfileComplete && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The agent profile is incomplete. Please ensure the following fields are filled: {missingFields.join(', ')}.
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="staff-assignment">Assign to Staff Members (Optional)</Label>
                <Select
                  value={assignedStaff[0] || ''}
                  onValueChange={(value) => setAssignedStaff(value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Credential Reset for Active Agents */}
          {agent.status === 'active' && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Credential Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Reset login credentials for this agent
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetCredentials}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Credentials
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {action === 'approve' && (
            <Button onClick={handleApprove} disabled={loading || !isProfileComplete}>
              {loading ? 'Approving...' : 'Approve Agent'}
            </Button>
          )}
          {action === 'reject' && (
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? 'Rejecting...' : 'Reject Agent'}
            </Button>
          )}
          {credentials && (
            <Button 
              variant="default" 
              onClick={() => {
                onClose();
                navigate(`/management/agents/${agent.id}`);
              }}
            >
              Done – Go to Profile
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentApprovalModal;