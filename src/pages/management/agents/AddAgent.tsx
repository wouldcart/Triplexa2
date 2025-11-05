import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageLayout from '@/components/layout/PageLayout';
import { ArrowLeft, Save, UserPlus, Users, AlertCircle, CheckCircle, Mail, Phone, Building } from 'lucide-react';
import { AgentManagementService } from '@/services/agentManagementService';
import { CreateAgentRequest, AgentStatus, StaffMember } from '@/types/agentManagement';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';
import { agentWelcomeTemplate } from '@/email/templates';
import { storeAgentCredentials } from '@/utils/agentAuth';
import { authHelpers } from '@/lib/supabaseClient';

const AddAgent: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { hasAdminAccess } = useAccessControl();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [modalCredentials, setModalCredentials] = useState<{ email: string; password: string }>({ email: '', password: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    status: 'inactive' as AgentStatus,
    assigned_staff: [] as string[],
    notes: '',
    // Account access
    sendMagicLinkEmail: true,
    trackLoginActivity: true
  });

  // Fetch staff members for assignment
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (hasAdminAccess) {
        setLoadingStaff(true);
        try {
          const { data, error } = await AgentManagementService.getStaffMembers();
          if (error) {
            console.error('Error fetching staff members:', error);
            toast.error('Failed to load staff members');
          } else {
            setStaffMembers(data || []);
          }
        } catch (error) {
          console.error('Error fetching staff members:', error);
          toast.error('Failed to load staff members');
        } finally {
          setLoadingStaff(false);
        }
      }
    };

    fetchStaffMembers();
  }, [hasAdminAccess]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    // No password validation needed for magic link authentication

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleStaffAssignment = (staffId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assigned_staff: checked 
        ? [...prev.assigned_staff, staffId]
        : prev.assigned_staff.filter(id => id !== staffId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create agent request data
      const agentRequest: CreateAgentRequest = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        company_name: formData.company_name?.trim() || undefined,
        status: formData.status,
        assigned_staff: formData.assigned_staff,
        notes: formData.notes,
      };

      const { data, error } = await AgentManagementService.createAgent(agentRequest);
      
      if (error) {
        console.error('Error creating agent:', error);
        // Handle string error returned by service (e.g., duplicate email)
        if (typeof error === 'string') {
          toast.error(error);
        } else if ((error as any)?.code === '23505') {
          toast.error('An agent with this email already exists');
        } else {
          toast.error((error as any)?.message || 'Failed to create agent');
        }
      } else if (data) {
        // Success toast
        toast.success(`Agent "${data.name}" created successfully!`);

        // Send magic link for passwordless authentication
        if (formData.sendMagicLinkEmail) {
          try {
            const { error: magicLinkError } = await authHelpers.signInWithMagicLink(formData.email.trim().toLowerCase());
            
            if (magicLinkError) {
              console.warn('Magic link error:', magicLinkError);
              toast.warning('Agent created, but magic link email could not be sent.');
            } else {
              toast.success('Magic link sent to agent\'s email for secure login access.');
            }
          } catch (e) {
            console.error('Magic link error:', e);
            toast.warning('Agent created, but magic link sending failed.');
          }
        }

        // Navigate back to agents list after successful creation
        setTimeout(() => {
          navigate('/management/agents');
        }, 2000);

        // Stay on page to allow admin to review credentials; optionally navigate later
      } else {
        toast.error('Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Add New Agent"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Agent Management", href: "/management/agents" },
        { title: "Add Agent", href: "/management/agents/add" }
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/management/agents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    <UserPlus className="mr-1 h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter agent's full name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="mr-1 h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="mr-1 h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="flex items-center">
                    <Building className="mr-1 h-4 w-4" />
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select value={formData.status} onValueChange={(value: AgentStatus) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes about this agent..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Access & Security */}
          <Card>
            <CardHeader>
              <CardTitle>Account Access & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Authentication Method</Label>
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Magic Link Authentication</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Agents will receive a secure login link via email. No password required.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Login Email</Label>
                  <p className="text-sm text-muted-foreground">
                    The agent will use their email address to receive magic login links.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium">Send magic link email</p>
                    <p className="text-xs text-muted-foreground">Send login link to agent's email after creation</p>
                  </div>
                  <Switch checked={formData.sendMagicLinkEmail} onCheckedChange={(checked) => handleInputChange('sendMagicLinkEmail', checked ? true : false)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium">Track login activity</p>
                    <p className="text-xs text-muted-foreground">Monitor login attempts and activity</p>
                  </div>
                  <Switch checked={formData.trackLoginActivity} onCheckedChange={(checked) => handleInputChange('trackLoginActivity', checked ? true : false)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Assignment */}
          {hasAdminAccess && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Staff Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStaff ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading staff members...</span>
                  </div>
                ) : staffMembers.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Select staff members to assign to this agent:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {staffMembers.map((staff) => (
                        <div key={staff.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            id={`staff-${staff.id}`}
                            checked={formData.assigned_staff.includes(staff.id)}
                            onCheckedChange={(checked) => handleStaffAssignment(staff.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`staff-${staff.id}`} className="font-medium cursor-pointer">
                              {staff.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                            <Badge variant="outline" className="text-xs">
                              {staff.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.assigned_staff.length > 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          {formData.assigned_staff.length} staff member(s) will be assigned to this agent.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No staff members available for assignment.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  All data is securely stored and encrypted
                </div>
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/management/agents')}
                    disabled={isSubmitting}
                    className="min-w-[100px]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.name || !formData.email}
                    className="min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Credentials Modal */}
        <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Agent Credentials
              </DialogTitle>
              <DialogDescription>
                Credentials have been activated. Share securely with the agent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm">Email</p>
                  <p className="font-mono text-sm">{modalCredentials.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(modalCredentials.email)}
                >
                  Copy
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm">Password</p>
                  <p className="font-mono text-sm">{modalCredentials.password}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(modalCredentials.password)}
                >
                  Copy
                </Button>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  For security, advise the agent to change the password after first login.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setShowCredentialsModal(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default AddAgent;