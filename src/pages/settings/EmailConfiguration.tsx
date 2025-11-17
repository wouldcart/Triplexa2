import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  AlertCircle, 
  CheckCircle, 
  Mail, 
  Server, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Send,
  Star,
  Loader2,
  BarChart,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  emailConfigurationService,
  EmailConfiguration,
  EmailConfigurationResponse
} from '@/services/emailConfigurationService';
import CountryEmailSettings from '@/components/settings/CountryEmailSettings';

interface EmailConfigFormData {
  name: string;
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  daily_send_limit: number;
}

const EmailConfigurationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [configurations, setConfigurations] = useState<EmailConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfiguration | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [configToTest, setConfigToTest] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EmailConfigFormData>({
    name: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    is_active: true,
    is_default: false,
    daily_send_limit: 100,
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await emailConfigurationService.getEmailConfigurations();
      
      if (response.success) {
        console.log('Loaded configurations:', response.data);
        setConfigurations(response.data || []);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load email configurations',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const configData = {
        ...formData,
        smtp_port: parseInt(formData.smtp_port, 10),
      };

      let response: EmailConfigurationResponse<any>;
      
      if (editingConfig) {
        response = await emailConfigurationService.updateEmailConfiguration(
          editingConfig.id!,
          configData
        );
      } else {
        response = await emailConfigurationService.createEmailConfiguration(configData);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: editingConfig 
            ? 'Email configuration updated successfully'
            : 'Email configuration created successfully',
        });
        
        setIsDialogOpen(false);
        resetForm();
        loadConfigurations();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to save configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (configId: string) => {
    console.log('handleTest called with configId:', configId);
    if (!configId) {
      console.error('Configuration ID is undefined in handleTest!');
      toast({
        title: 'Error',
        description: 'Configuration ID is missing',
        variant: 'destructive',
      });
      return;
    }
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(configId);
      console.log('Testing configuration with ID:', configId, 'and email:', testEmail);
      const response = await emailConfigurationService.testEmailConfiguration(configId, testEmail);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: response.data?.previewUrl 
            ? 'Test email sent! Check the preview URL in the console.'
            : 'Test email sent successfully!',
        });
        
        if (response.data?.previewUrl) {
          console.log('Email preview URL:', response.data.previewUrl);
        }
        
        setShowTestDialog(false);
        setTestEmail('');
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to send test email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to test configuration',
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (configId: string) => {
    setConfigToDelete(configId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;

    try {
      const response = await emailConfigurationService.deleteEmailConfiguration(configToDelete);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Email configuration deleted successfully',
        });
        loadConfigurations();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleToggleStatus = async (configId: string) => {
    try {
      const response = await emailConfigurationService.toggleEmailConfigurationStatus(configId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Configuration status updated',
        });
        loadConfigurations();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const response = await emailConfigurationService.setDefaultEmailConfiguration(configId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Default configuration updated',
        });
        loadConfigurations();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to set default',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error setting default:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default configuration',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (config: EmailConfiguration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port.toString(),
      smtp_secure: config.smtp_secure,
      smtp_user: config.smtp_user,
      smtp_password: config.smtp_password,
      from_email: config.from_email,
      from_name: config.from_name,
      is_active: config.is_active ?? true,
      is_default: config.is_default ?? false,
      daily_send_limit: config.daily_send_limit ?? 100,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingConfig(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      smtp_host: '',
      smtp_port: '587',
      smtp_secure: false,
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: '',
      is_active: true,
      is_default: false,
      daily_send_limit: 100,
    });
  };

  const openTestDialog = (configId: string, email?: string) => {
    console.log('Opening test dialog for config ID:', configId);
    if (!configId) {
      console.error('Configuration ID is undefined!');
      toast({
        title: 'Error',
        description: 'Configuration ID is missing',
        variant: 'destructive',
      });
      return;
    }
    setConfigToTest(configId);
    setTestEmail(email || '');
    setShowTestDialog(true);
    console.log('Set configToTest to:', configId);
  };

  if (loading) {
    return (
      <PageLayout title="Email Configuration" description="Manage SMTP settings and email providers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Email Configuration" 
      description="Manage SMTP settings and email providers"
      action={
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      }
    >
      {/* Enhanced Header Section - Dark Mode Compatible */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-800 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Email Configuration
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Manage your SMTP settings, email providers, and country-specific configurations
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-white/80 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Configs</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{configurations.length}</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-white/80 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {configurations.filter(c => c.is_active).length}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-white/80 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {configurations.filter(c => c.is_default).length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {configurations.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/30 border-2 border-dashed border-blue-200 dark:border-blue-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-full mb-6">
                <Mail className="h-16 w-16 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">No Email Configurations</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
                You haven't configured any email providers yet. Add your first configuration to start sending emails from your application.
              </p>
              <Button 
                onClick={openCreateDialog}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {configurations.map((config) => {
              console.log('Rendering config:', config.id, config.name);
              return (
              <Card key={config.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/30 rounded-t-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">{config.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {config.is_default && (
                          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        <Badge variant={config.is_active ? "default" : "secondary"} className={config.is_active ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600"}>
                          {config.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Test button clicked, config.id:', config.id);
                        openTestDialog(config.id!);
                      }}
                      disabled={!config.is_active}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-all duration-200"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(config)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id!)}
                      disabled={config.is_default}
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                      <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        SMTP Host
                      </Label>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">{config.smtp_host}</p>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                      <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        SMTP Port
                      </Label>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">{config.smtp_port}</p>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                      <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        From Email
                      </Label>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">{config.from_email}</p>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                      <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        From Name
                      </Label>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">{config.from_name}</p>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                      <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                        <BarChart className="h-3 w-3" />
                        Daily Usage
                      </Label>
                      <div className="mt-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {config.current_day_sent || 0} / {config.daily_send_limit || 100}
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              ((config.current_day_sent || 0) / (config.daily_send_limit || 100)) >= 0.9 
                                ? 'bg-red-500' 
                                : ((config.current_day_sent || 0) / (config.daily_send_limit || 100)) >= 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((config.current_day_sent || 0) / (config.daily_send_limit || 100)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => handleToggleStatus(config.id!)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</Label>
                    </div>
                    {!config.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(config.id!)}
                        className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300 transition-all duration-200"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set as Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Configure your SMTP settings to send emails from your application.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-200">Configuration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Primary SMTP"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="smtp_host" className="text-gray-700 dark:text-gray-200">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={formData.smtp_host}
                      onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp_port" className="text-gray-700 dark:text-gray-200">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={formData.smtp_port}
                      onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                      placeholder="587"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="smtp_user" className="text-gray-700 dark:text-gray-200">SMTP Username</Label>
                    <Input
                      id="smtp_user"
                      value={formData.smtp_user}
                      onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                      placeholder="your-email@gmail.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp_password" className="text-gray-700 dark:text-gray-200">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={formData.smtp_password}
                      onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                      placeholder="Your SMTP password"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="from_email" className="text-gray-700 dark:text-gray-200">From Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                      placeholder="noreply@yourdomain.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="from_name" className="text-gray-700 dark:text-gray-200">From Name</Label>
                    <Input
                      id="from_name"
                      value={formData.from_name}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                      placeholder="Your Company Name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="daily_send_limit" className="text-gray-700 dark:text-gray-200">Daily Send Limit</Label>
                    <Input
                      id="daily_send_limit"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.daily_send_limit}
                      onChange={(e) => setFormData({ ...formData, daily_send_limit: parseInt(e.target.value) || 100 })}
                      placeholder="100"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Maximum emails this account can send per day (1-10,000)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtp_secure"
                      checked={formData.smtp_secure}
                      onCheckedChange={(checked) => setFormData({ ...formData, smtp_secure: checked })}
                    />
                    <Label htmlFor="smtp_secure" className="text-gray-700 dark:text-gray-200">Use Secure Connection (SSL/TLS)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="text-gray-700 dark:text-gray-200">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                    <Label htmlFor="is_default" className="text-gray-700 dark:text-gray-200">Default</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingConfig ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Test Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent>
            {console.log('Test dialog rendered, configToTest:', configToTest, 'testEmail:', testEmail)}
            <DialogHeader>
              <DialogTitle>Test Email Configuration</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Send a test email to verify your configuration is working correctly.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="test_email" className="text-gray-700 dark:text-gray-200">Test Email Address</Label>
                <Input
                  id="test_email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTestDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log('Test button clicked, configToTest:', configToTest);
                  configToTest && handleTest(configToTest);
                }}
                disabled={!testEmail || testing === configToTest}
              >
                {testing === configToTest && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Test Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Help Section with Better Spacing */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800/50 dark:to-blue-900/30 rounded-t-lg pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800 dark:text-gray-100">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Configuration Help
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">Common SMTP Settings</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[60px]">Gmail:</span>
                      <span>smtp.gmail.com:587 (use app password)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[60px]">Outlook:</span>
                      <span>smtp-mail.outlook.com:587</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[60px]">SendGrid:</span>
                      <span>smtp.sendgrid.net:587</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[60px]">AWS SES:</span>
                      <span>email-smtp.[region].amazonaws.com:587</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-300 font-semibold">Security Notes</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Store your SMTP credentials securely. For Gmail, use app-specific passwords instead of your regular password.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Added spacing between sections */}
        <div className="h-8"></div>
      </div>

      {/* Country-Based Email Settings */}
      <CountryEmailSettings />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email configuration? This action cannot be undone.
              All settings for this email provider will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </PageLayout>
  );
};

export default EmailConfigurationSettings;