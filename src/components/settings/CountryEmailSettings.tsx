import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Globe,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { countryEmailSettingsService } from '@/services/countryEmailSettingsService';
import { supabase } from '@/lib/supabaseClient';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface CountryEmailSetting {
  id?: string;
  country_id: string;
  country_name?: string;
  country_code?: string;
  cc_emails: string[];
  bcc_emails: string[];
  is_active: boolean;
}

const CountryEmailSettings: React.FC = () => {
  const { toast } = useToast();
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [settings, setSettings] = useState<CountryEmailSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editingSetting, setEditingSetting] = useState<CountryEmailSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    country_id: '',
    cc_emails: '', // Store as string for textarea, convert to array on save
    bcc_emails: '', // Store as string for textarea, convert to array on save
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load active countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (countriesError) {
        throw countriesError;
      }

      setCountries(countriesData || []);

      // Load country email settings
      const response = await countryEmailSettingsService.getCountryEmailSettings();
      
      if (response.success) {
        setSettings(response.data || []);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load country email settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.country_id) {
      toast({
        title: 'Error',
        description: 'Please select a country',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      // Parse email addresses
      const ccEmails = formData.cc_emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && isValidEmail(email));
      
      const bccEmails = formData.bcc_emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && isValidEmail(email));

      const settingData = {
        country_id: formData.country_id,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        is_active: formData.is_active,
      };

      const response = await countryEmailSettingsService.saveCountryEmailSetting(settingData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: editingSetting ? 'Country email settings updated successfully' : 'Country email settings created successfully',
        });
        
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to save country email settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving country email settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save country email settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (setting: CountryEmailSetting) => {
    setEditingSetting(setting);
    setFormData({
      country_id: setting.country_id,
      cc_emails: setting.cc_emails.join(', '),
      bcc_emails: setting.bcc_emails.join(', '),
      is_active: setting.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these country email settings?')) {
      return;
    }

    try {
      const response = await countryEmailSettingsService.deleteCountryEmailSetting(id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Country email settings deleted successfully',
        });
        loadData();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete country email settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting country email settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete country email settings',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await countryEmailSettingsService.toggleCountryEmailSettingStatus(id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Country email settings status updated',
        });
        loadData();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling country email setting status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingSetting(null);
    setFormData({
      country_id: '',
      cc_emails: '',
      bcc_emails: '',
      is_active: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getCountryName = (countryId: string): string => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : 'Unknown';
  };

  const getCountryCode = (countryId: string): string => {
    const country = countries.find(c => c.id === countryId);
    return country ? country.code : '';
  };

  const availableCountries = countries.filter(country => 
    !settings.some(setting => setting.country_id === country.id)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Better Spacing */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-gray-800/30 dark:to-blue-900/20 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/70 dark:bg-gray-700/50 rounded-lg border border-white/80 dark:border-gray-600">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Country-Based Email Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Configure CC and BCC email addresses for different countries
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Country Setting
        </Button>
      </div>

      {/* Settings List */}
      {settings.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/30 border-2 border-dashed border-blue-200 dark:border-blue-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-full mb-6">
              <Globe className="h-16 w-16 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">No Country Email Settings</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
              You haven't configured any country-based email settings yet. Add your first setting to automatically include CC/BCC emails based on country.
            </p>
            <Button 
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Country Setting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {settings.map((setting) => (
            <Card key={setting.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/30 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      {getCountryName(setting.country_id)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                        {getCountryCode(setting.country_id)}
                      </Badge>
                      <Badge variant={setting.is_active ? "default" : "secondary"} className={setting.is_active ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600"}>
                        {setting.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(setting)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(setting.id!)}
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 transition-all duration-200"
                  >
                    {setting.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(setting.id!)}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                    <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1 font-medium">
                      <Mail className="h-3 w-3" />
                      CC Emails
                    </Label>
                    <div className="mt-2">
                      {setting.cc_emails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {setting.cc_emails.map((email, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground dark:text-gray-400 text-xs">No CC emails configured</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                    <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-1 font-medium">
                      <Mail className="h-3 w-3" />
                      BCC Emails
                    </Label>
                    <div className="mt-2">
                      {setting.bcc_emails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {setting.bcc_emails.map((email, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground dark:text-gray-400 text-xs">No BCC emails configured</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {editingSetting ? 'Edit Country Email Settings' : 'Add Country Email Settings'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country_id}
                      onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                      disabled={!!editingSetting}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingSetting ? countries : availableCountries).map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name} ({country.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cc_emails">CC Email Addresses</Label>
                    <textarea
                      id="cc_emails"
                      value={formData.cc_emails}
                      onChange={(e) => setFormData({ ...formData, cc_emails: e.target.value })}
                      placeholder="Enter email addresses separated by commas (e.g., manager@company.com, sales@company.com)"
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      These email addresses will be added as CC recipients for emails related to this country.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bcc_emails">BCC Email Addresses</Label>
                    <textarea
                      id="bcc_emails"
                      value={formData.bcc_emails}
                      onChange={(e) => setFormData({ ...formData, bcc_emails: e.target.value })}
                      placeholder="Enter email addresses separated by commas (e.g., admin@company.com, backup@company.com)"
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      These email addresses will be added as BCC recipients for emails related to this country.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>How it works</AlertTitle>
                  <AlertDescription>
                    When sending emails related to this country, the system will automatically include the specified CC and BCC email addresses. This helps ensure relevant team members are kept in the loop for country-specific communications.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || !formData.country_id}>
                    {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                    <Save className="h-4 w-4 mr-2" />
                    {editingSetting ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CountryEmailSettings;