
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Mail, RefreshCw, User, AlertCircle, Copy, Key } from "lucide-react";
import { toast } from "sonner";
import { useAccessControl } from "@/hooks/use-access-control";
import { useApp } from "@/contexts/AppContext";
import { generateSecurePassword } from "@/utils/credentialGenerator";
import { storeAgentCredentials } from "@/utils/agentAuth";
import { agentWelcomeTemplate } from "@/email/templates";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { ManagedAgent } from "@/types/agentManagement";
import { AgentManagementService } from "@/services/agentManagementService";

// Updated agent form schema matching AddAgent structure
const agentFormSchema = z.object({
  // Basic Information - MANDATORY
  name: z.string().min(3, { message: "Agent name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  mobile: z.string().min(10, { message: "Please enter a valid mobile number." }),
  agentType: z.enum(["individual", "company"], { 
    required_error: "Please select an agent type."
  }),
  company: z.string().optional(),
  
  // Account Access & Security - MANDATORY
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  forcePasswordChange: z.boolean().default(true),
  sendCredentialsEmail: z.boolean().default(false),
  trackLoginActivity: z.boolean().default(true),
  isActive: z.boolean().default(true),
  
  // All other fields are now OPTIONAL
  profileImage: z.string().optional(),
  countries: z.array(z.string()).optional().default([]),
  cities: z.array(z.string()).optional().default([]),
  staffAssignments: z.array(z.string()).optional().default([]),
  commissionType: z.enum(["flat", "percentage"]).optional(),
  commissionValue: z.string().optional(),
  language: z.string().optional().default("English"),
  currency: z.string().optional().default("USD"),
  sourceType: z.enum(["event", "lead", "referral", "website", "other"]).optional(),
  sourceDetails: z.string().optional(),
  documents: z.any().optional(),
  remarks: z.string().optional(),
  termsAgreed: z.boolean().default(false)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

const EditAgent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { isStaff, hasAdminAccess } = useAccessControl();
  const [agent, setAgent] = useState<ManagedAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Removed location, staff, and source option data per requirement

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      company: "",
      profileImage: "",
      password: "",
      confirmPassword: "",
      countries: [],
      cities: [],
      staffAssignments: [],
      agentType: "individual",
      isActive: true,
      commissionType: "percentage",
      commissionValue: "",
      language: "English",
      currency: "USD",
      sourceType: "website",
      sourceDetails: "",
      forcePasswordChange: true,
      sendCredentialsEmail: false,
      trackLoginActivity: true,
      remarks: "",
      termsAgreed: false,
    },
  });

  const agentType = form.watch("agentType");
  const email = form.watch("email");
  const name = form.watch("name");

  // Initialize form with agent data (service-based by UUID)
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await AgentManagementService.getAgentById(id);
      if (!isMounted) return;
      if (error || !data) {
        setAgent(null);
        setLoading(false);
        return;
      }

      setAgent(data);
      setLogoUrl(data.profile_image || '');

      // Set form values from managed agent data
      form.reset({
        name: data.name || "",
        email: data.email || "",
        mobile: (data.business_phone || data.phone || "") as string,
        company: (data.type === "company" ? (data.company_name || "") : ""),
        profileImage: data.profile_image || "",
        password: "********", // Placeholder for existing password
        confirmPassword: "********",
        countries: data.country ? [data.country] : [],
        cities: data.city ? [data.city] : [],
        staffAssignments: [],
        agentType: (data.type as "individual" | "company") || "individual",
        isActive: data.status === "active",
        commissionType: (data.commission_type as "flat" | "percentage") || "percentage",
        commissionValue: typeof data.commission_value === 'number' ? String(data.commission_value) : (data.commission_value || ""),
        language: (data.preferred_language || "English") as string,
        currency: "USD",
        sourceType: (data.source_type as any) || "website",
        sourceDetails: data.source_details || "",
        forcePasswordChange: false,
        sendCredentialsEmail: false,
        trackLoginActivity: true,
        remarks: "",
        termsAgreed: false,
      });

      // Removed selected lists initialization since sections are hidden
      setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [id, form]);

  const generateCredentials = () => {
    setIsGeneratingCredentials(true);
    
    // Generate secure password
    const generatedPassword = generateSecurePassword(12);
    
    form.setValue("password", generatedPassword);
    form.setValue("confirmPassword", generatedPassword);
    
    setGeneratedCredentials({ email: email, password: generatedPassword });
    setShowCredentialsModal(true);
    toast.success("New credentials generated successfully! Credentials will activate after Save.");
    setIsGeneratingCredentials(false);
  };

  // Removed country/city/staff handlers per requirement

  const sendPasswordResetEmail = () => {
    const agentEmail = form.getValues("email");
    if (!agentEmail) {
      toast.error("Please enter agent email first");
      return;
    }
    
    // In real app, this would call an API to send reset email
    console.log("Sending password reset email to:", agentEmail);
    toast.success(`Password reset email sent to ${agentEmail}`);
  };

  // Removed logo handlers since logo section is hidden

  // Removed dependent city lookup helper

  const onSubmit = async (values: AgentFormValues) => {
    const idStr = (id ? String(id) : (agent ? String(agent.id) : ""));
    if (!idStr) {
      toast.error('Invalid agent ID');
      return;
    }
    const updatePayload = {
      id: idStr,
      name: values.name,
      email: values.email,
      business_phone: values.mobile,
      company_name: values.company,
      status: values.isActive ? 'active' : 'inactive',
      profile_image: logoUrl || undefined,
      preferred_language: values.language || undefined,
      country: values.countries && values.countries.length > 0 ? values.countries[0] : undefined,
      city: values.cities && values.cities.length > 0 ? values.cities[0] : undefined,
      type: values.agentType as 'individual' | 'company',
      commission_type: values.commissionType,
      commission_value: values.commissionValue,
      source_type: values.sourceType,
      source_details: values.sourceDetails,
    } as any;

    const { data, error } = await AgentManagementService.updateAgent(updatePayload);
    if (error) {
      console.error('Update agent error:', error);
      toast.error('Failed to update agent profile.');
      return;
    }

    // Sync email to Supabase Auth and profiles if changed
    try {
      const emailChanged = values.email !== (agent?.email || "");
      if (emailChanged) {
        const { error: syncErr } = await AgentManagementService.syncAgentEmailAcrossAuth(idStr, values.email);
        if (syncErr) {
          console.warn('Email sync to Auth/profiles failed:', syncErr);
          toast.warning('Saved, but could not sync email to authentication.');
        }
      }
    } catch (e) {
      console.warn('Email sync encountered an error:', e);
    }

    // Persist Track Login Activity preference
    try {
      const { error: prefsErr } = await AgentManagementService.patchAgentSettingsPreferences(idStr, {
        security: { trackLoginActivity: !!values.trackLoginActivity },
      });
      if (prefsErr) {
        console.warn('Persisting trackLoginActivity failed:', prefsErr);
      }
    } catch (e) {
      console.warn('Persisting trackLoginActivity encountered an error:', e);
    }

    // Persist generated credentials via secure RPC
    try {
      const isTemporary = !!values.forcePasswordChange;
      const { error: credErr } = await AgentManagementService.setAgentCredentials(idStr, values.email, values.password, isTemporary);
      if (credErr) {
        console.warn('setAgentCredentials error:', credErr);
        toast.warning('Profile saved, but activating credentials failed.');
      } else {
        toast.success(`Agent "${values.name}" updated. Credentials activated.`);

        // Store credentials locally for login fallback (username or email)
        try {
          storeAgentCredentials({
            agentId: idStr,
            username: values.email,
            password: values.password,
            email: values.email,
            forcePasswordChange: isTemporary,
            isTemporary,
            createdAt: new Date().toISOString(),
            createdBy: {
              staffId: 'self',
              staffName: 'Admin'
            }
          });
        } catch (e) {
          console.warn('Failed to store credentials locally:', e);
        }

        // Optionally send updated credentials email
        if (values.sendCredentialsEmail) {
          try {
            const emailServerUrl = (import.meta as any).env?.VITE_EMAIL_SERVER_URL || 'http://localhost:3001';
            const loginUrl = `${window.location.origin}/login`;
            const html = agentWelcomeTemplate({
              companyName: 'Triplexa',
              recipientName: values.name,
              actionUrl: loginUrl,
            }) + `
              <div style="margin-top:12px;padding:10px;border:1px dashed #ccc;border-radius:6px">
                <p><strong>Login Credentials</strong></p>
                <p>Email: <code>${values.email}</code></p>
                <p>Password: <code>${values.password}</code></p>
                <p style="font-size:12px;color:#666">For security, please change your password after first login.</p>
              </div>
            `;

            const res = await fetch(`${emailServerUrl}/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: values.email,
                subject: 'Your updated agent credentials',
                html
              })
            });
            const json = await res.json().catch(() => ({ success: false }));
            if (json && json.success) {
              toast.success("Updated credentials emailed to the agent");
            } else {
              toast.warning("Saved, but email could not be sent (server not running?)");
            }
          } catch (e) {
            console.warn('Send credentials email error:', e);
            toast.warning("Saved, but emailing credentials failed");
          }
        }
      }
    } catch (e) {
      console.error('Credentials activation error:', e);
      toast.warning('Profile saved, but credentials activation encountered an error.');
    }

    navigate(`/management/agents/${idStr}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <PageLayout title="Edit Agent">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading agent data...</p>
        </div>
      </PageLayout>
    );
  }

  if (!agent) {
    return (
      <PageLayout title="Edit Agent">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Agent not found. The requested agent may have been deleted or doesn't exist.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/management/agents")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agents
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Edit Agent"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Agent Management", href: "/management/agents" },
        { title: agent.name, href: `/management/agents/${agent.id}` },
        { title: "Edit", href: `/management/agents/${agent.id}/edit` },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" asChild>
            <Link to="/management/agents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agent List
            </Link>
          </Button>
          
          {isStaff && (
            <Badge variant="secondary" className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              Staff Access
            </Badge>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information section removed per requirement */}

            {/* Account Access & Security - MANDATORY */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-700 flex items-center">
                  Account Access & Security
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">Login Credentials</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateCredentials}
                    disabled={isGeneratingCredentials}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingCredentials ? 'animate-spin' : ''}`} />
                    Generate New Credentials
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FormLabel>Login Email</FormLabel>
                    <p className="text-sm text-muted-foreground">Login uses the agent's email address.</p>
                  </div>

                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Password*</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-6"
                      onClick={sendPasswordResetEmail}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="forcePasswordChange"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Force Password Change</FormLabel>
                          <FormDescription className="text-xs">
                            Require password change on next login
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sendCredentialsEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Send Updated Credentials</FormLabel>
                          <FormDescription className="text-xs">
                            Email updated login details to agent
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trackLoginActivity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Track Login Activity</FormLabel>
                          <FormDescription className="text-xs">
                            Monitor login attempts and activity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Account Status</FormLabel>
                        <FormDescription>
                          Set whether this account is active or inactive
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Optional sections removed per requirement */}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Update Agent
              </Button>
            </div>
          </form>
        </Form>
      </div>
    {/* Credentials Modal */}
    <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Login Credentials Generated
          </DialogTitle>
          <DialogDescription>
            Copy and share securely. These credentials activate after you click Save.
          </DialogDescription>
        </DialogHeader>
        {generatedCredentials && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Email:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">{generatedCredentials.email}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(generatedCredentials.email)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Password:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">{generatedCredentials.password}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(generatedCredentials.password)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Tip: Enable "Send Updated Credentials" above to email these after Save.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCredentialsModal(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </PageLayout>
  );
};

export default EditAgent;
