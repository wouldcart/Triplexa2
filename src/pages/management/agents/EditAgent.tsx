
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Mail, RefreshCw, Plus, X, MapPin, User, AlertCircle, Copy, Key } from "lucide-react";
import { toast } from "sonner";
import CompanyLogoUpload from "@/components/inventory/packages/components/CompanyLogoUpload";
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

import { Agent } from "@/types/agent";
import { getAgentById, agents } from "@/data/agentData";
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
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Available countries and cities
  const availableCountries = [
    "United States", "United Kingdom", "United Arab Emirates", 
    "India", "Thailand", "Singapore", "Malaysia", "Indonesia",
    "Philippines", "Vietnam", "Australia", "Canada"
  ];

  const citiesByCountry: Record<string, string[]> = {
    "United States": ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas", "San Francisco"],
    "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh", "Liverpool"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad"],
    "Thailand": ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Koh Samui"],
    "Singapore": ["Singapore"],
    "Malaysia": ["Kuala Lumpur", "Penang", "Johor Bahru", "Langkawi"],
    "Indonesia": ["Jakarta", "Bali", "Yogyakarta", "Surabaya"],
    "Philippines": ["Manila", "Cebu", "Davao", "Boracay"],
    "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hoi An"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary"]
  };

  // Available staff members (mock data - in real app would come from API)
  const availableStaff = [
    { id: "1", name: "John Smith", department: "Sales" },
    { id: "2", name: "Jane Doe", department: "Operations" },
    { id: "3", name: "David Johnson", department: "Customer Support" },
    { id: "4", name: "Sarah Sales", department: "Sales" },
    { id: "5", name: "Mike Marketing", department: "Marketing" }
  ];

  const sourceOptions = [
    { value: "event", label: "Trade Show/Event", description: "Met at travel fair, exhibition, or industry event" },
    { value: "lead", label: "Lead Generation", description: "Generated through marketing campaigns or online ads" },
    { value: "referral", label: "Referral", description: "Referred by existing agent or business partner" },
    { value: "website", label: "Website Inquiry", description: "Applied through company website or online form" },
    { value: "other", label: "Other", description: "Cold call, direct approach, or other methods" }
  ];

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

  // Initialize form with agent data
  useEffect(() => {
    if (id) {
      const agentId = parseInt(id);
      const agentData = getAgentById(agentId);
      
      if (agentData) {
        setAgent(agentData);
        setLogoUrl(agentData.profileImage || '');
        
        // Set form values from agent data
        form.reset({
          name: agentData.name,
          email: agentData.email,
          mobile: agentData.contact?.phone || "",
          company: agentData.type === "company" ? agentData.name : "",
          profileImage: agentData.profileImage || "",
          password: "********", // Placeholder for existing password
          confirmPassword: "********",
          countries: agentData.country ? [agentData.country] : [],
          cities: agentData.city ? [agentData.city] : [],
          staffAssignments: agentData.staffAssignments?.map(s => s.staffId.toString()) || [],
          agentType: agentData.type as "individual" | "company",
          isActive: agentData.status === "active",
          commissionType: agentData.commissionType as "flat" | "percentage",
          commissionValue: agentData.commissionValue,
          language: "English",
          currency: "USD",
          sourceType: agentData.source?.type || "website",
          sourceDetails: agentData.source?.details || "",
          forcePasswordChange: false,
          sendCredentialsEmail: false,
          trackLoginActivity: true,
          remarks: "",
          termsAgreed: false,
        });

        setSelectedCountries(agentData.country ? [agentData.country] : []);
        setSelectedCities(agentData.city ? [agentData.city] : []);
        setSelectedStaff(agentData.staffAssignments?.map(s => s.staffId.toString()) || []);
      }
      
      setLoading(false);
    }
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

  const addCountry = (country: string) => {
    if (country && !selectedCountries.includes(country)) {
      const newCountries = [...selectedCountries, country];
      setSelectedCountries(newCountries);
      form.setValue("countries", newCountries);
    }
  };

  const removeCountry = (country: string) => {
    const newCountries = selectedCountries.filter(c => c !== country);
    setSelectedCountries(newCountries);
    form.setValue("countries", newCountries);
    
    // Remove cities from removed country
    const availableCities = newCountries.flatMap(c => citiesByCountry[c] || []);
    const newCities = selectedCities.filter(city => availableCities.includes(city));
    setSelectedCities(newCities);
    form.setValue("cities", newCities);
  };

  const addCity = (city: string) => {
    if (city && !selectedCities.includes(city)) {
      const newCities = [...selectedCities, city];
      setSelectedCities(newCities);
      form.setValue("cities", newCities);
    }
  };

  const removeCity = (city: string) => {
    const newCities = selectedCities.filter(c => c !== city);
    setSelectedCities(newCities);
    form.setValue("cities", newCities);
  };

  const addStaffAssignment = (staffId: string) => {
    if (staffId && !selectedStaff.includes(staffId)) {
      const newStaff = [...selectedStaff, staffId];
      setSelectedStaff(newStaff);
      form.setValue("staffAssignments", newStaff);
    }
  };

  const removeStaffAssignment = (staffId: string) => {
    const newStaff = selectedStaff.filter(s => s !== staffId);
    setSelectedStaff(newStaff);
    form.setValue("staffAssignments", newStaff);
  };

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

  const handleLogoChange = (imageUrl: string) => {
    setLogoUrl(imageUrl);
    form.setValue("profileImage", imageUrl);
  };

  const handleLogoRemove = () => {
    setLogoUrl('');
    form.setValue("profileImage", "");
  };

  // Get available cities based on selected countries
  const getAvailableCities = () => {
    return selectedCountries.flatMap(country => 
      (citiesByCountry[country] || []).map(city => ({ country, city }))
    );
  };

  const onSubmit = async (values: AgentFormValues) => {
    if (!agent) return;

    const idStr = String(agent.id);
    const updatePayload = {
      id: idStr,
      name: values.name,
      email: values.email,
      phone: values.mobile,
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

    navigate(`/management/agents/view/${agent.id}`);
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
        { title: agent.name, href: `/management/agents/view/${agent.id}` },
        { title: "Edit", href: `/management/agents/edit/${agent.id}` },
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
            {/* Basic Information - MANDATORY */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-700 flex items-center">
                  Basic Information
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name or company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address*</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number*</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Type*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agent type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {agentType === "company" && (
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Legal company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

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

            {/* Optional Sections */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600 mb-2">Optional Information</h3>
                <p className="text-sm text-gray-500">The following sections can be updated as needed</p>
              </div>

              {/* Source Information - OPTIONAL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Source Information
                    <Badge variant="secondary" className="ml-2">Optional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sourceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sourceOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-500">{option.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sourceDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide specific details about how this agent was acquired..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            E.g., "Met at ITB Berlin 2024, Booth #123" or "Referred by Agent XYZ"
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Company Logo Upload - OPTIONAL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Company Logo
                    <Badge variant="secondary" className="ml-2">Optional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CompanyLogoUpload
                    currentImage={logoUrl}
                    onImageChange={handleLogoChange}
                    onImageRemove={handleLogoRemove}
                  />
                </CardContent>
              </Card>

              {/* Location & Assignment - OPTIONAL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Location & Assignment
                    <Badge variant="secondary" className="ml-2">Optional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Countries */}
                  <div>
                    <FormLabel className="text-base font-medium mb-3 block">Countries</FormLabel>
                    <div className="space-y-3">
                      <Select onValueChange={addCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select countries to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCountries
                            .filter(country => !selectedCountries.includes(country))
                            .map(country => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedCountries.map(country => (
                          <Badge key={country} variant="secondary" className="flex items-center gap-1">
                            {country}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeCountry(country)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cities */}
                  <div>
                    <FormLabel className="text-base font-medium mb-3 block">Cities</FormLabel>
                    <div className="space-y-3">
                      <Select 
                        onValueChange={addCity}
                        disabled={selectedCountries.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedCountries.length === 0 
                              ? "Select countries first" 
                              : "Select cities to add"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableCities()
                            .filter(({ city }) => !selectedCities.includes(city))
                            .map(({ country, city }) => (
                              <SelectItem key={`${country}-${city}`} value={city}>
                                {city} ({country})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedCities.map(city => (
                          <Badge key={city} variant="outline" className="flex items-center gap-1">
                            {city}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeCity(city)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Staff Assignments */}
                  <div>
                    <FormLabel className="text-base font-medium mb-3 block">Staff Assignments</FormLabel>
                    <div className="space-y-3">
                      <Select onValueChange={addStaffAssignment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign staff members" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaff
                            .filter(staff => !selectedStaff.includes(staff.id))
                            .map(staff => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} - {staff.department}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex flex-wrap gap-2">
                        {selectedStaff.map(staffId => {
                          const staff = availableStaff.find(s => s.id === staffId);
                          return staff ? (
                            <Badge key={staffId} variant="default" className="flex items-center gap-1">
                              {staff.name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeStaffAssignment(staffId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Structure - OPTIONAL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Commission Structure
                    <Badge variant="secondary" className="ml-2">Optional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="commissionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select commission type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="flat">Flat Fee</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="commissionValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Value</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                form.getValues("commissionType") === "percentage"
                                  ? "E.g., 10 (for 10%)"
                                  : "E.g., 50 (flat fee amount)"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information - OPTIONAL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Additional Information
                    <Badge variant="secondary" className="ml-2">Optional</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Language</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Spanish">Spanish</SelectItem>
                              <SelectItem value="French">French</SelectItem>
                              <SelectItem value="German">German</SelectItem>
                              <SelectItem value="Arabic">Arabic</SelectItem>
                              <SelectItem value="Thai">Thai</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="AED">AED</SelectItem>
                              <SelectItem value="THB">THB</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes or special instructions..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

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
