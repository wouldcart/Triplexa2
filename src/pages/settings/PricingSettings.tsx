import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { PricingService } from '@/services/pricingService';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { MarkupSlab, PricingSettings as PricingSettingsType } from '@/types/pricing';
import { CurrencyService } from '@/services/currencyService';
import EnhancedMarkupSlabForm from '@/components/pricing/EnhancedMarkupSlabForm';
import MarkupSlabsPagination from '@/components/pricing/MarkupSlabsPagination';
import { Plus, Edit, Trash2, Save, DollarSign, Percent, Settings, Globe, Calculator, FileText, Users } from 'lucide-react';
import CountryPricingManager from '@/components/pricing/CountryPricingManager';
import RegionalPricingTemplates from '@/components/pricing/RegionalPricingTemplates';
import PricingSimulator from '@/components/pricing/PricingSimulator';
import TaxManagement from '@/components/pricing/TaxManagement';
import AdvancedPricingEngine from '@/components/pricing/AdvancedPricingEngine';
import MarkupExportPreview from '@/components/pricing/MarkupExportPreview';
const PricingSettings: React.FC = () => {
  const [settings, setSettings] = useState<PricingSettingsType>(PricingService.getSettings());
  const [enhancedSettings, setEnhancedSettings] = useState(EnhancedPricingService.getEnhancedSettings());
  const [editingSlab, setEditingSlab] = useState<MarkupSlab | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingSlabId, setDeletingSlabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const {
    defaultCurrency,
    getCurrencyByCountryCode
  } = useCurrency();
  useEffect(() => {
    const currentSettings = PricingService.getSettings();
    const currentEnhancedSettings = EnhancedPricingService.getEnhancedSettings();
    setSettings(currentSettings);
    setEnhancedSettings(currentEnhancedSettings);
  }, []);
  const handleRefresh = () => {
    setSettings(PricingService.getSettings());
    setEnhancedSettings(EnhancedPricingService.getEnhancedSettings());
  };
  const handleSettingsUpdate = async (updates: Partial<PricingSettingsType>) => {
    setIsLoading(true);
    try {
      const updatedSettings = {
        ...settings,
        ...updates
      };

      // Optimistic update
      setSettings(updatedSettings);

      // Persist to storage
      PricingService.updateSettings(updatedSettings);
      toast({
        title: "Settings Updated",
        description: "Pricing settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating pricing settings:', error);

      // Rollback optimistic update
      setSettings(PricingService.getSettings());
      toast({
        title: "Update Failed",
        description: "Failed to save pricing settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveSlab = async (slabData: MarkupSlab) => {
    setIsLoading(true);
    try {
      let updatedSlabs: MarkupSlab[];
      let actionType: string;
      if (isCreating) {
        // Creating new slab
        updatedSlabs = [...settings.markupSlabs, slabData];
        actionType = "created";
      } else {
        // Updating existing slab
        updatedSlabs = settings.markupSlabs.map(slab => slab.id === slabData.id ? {
          ...slabData,
          updatedAt: new Date().toISOString()
        } : slab);
        actionType = "updated";
      }
      await handleSettingsUpdate({
        markupSlabs: updatedSlabs
      });

      // Reset form state
      setIsCreating(false);
      setEditingSlab(null);
      toast({
        title: `Slab ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`,
        description: `Markup slab "${slabData.name}" has been ${actionType} successfully.`
      });
    } catch (error) {
      console.error(`Error ${isCreating ? 'creating' : 'updating'} markup slab:`, error);
      toast({
        title: `${isCreating ? 'Creation' : 'Update'} Failed`,
        description: `Failed to ${isCreating ? 'create' : 'update'} markup slab. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingSlab(null);
  };
  const handleDeleteSlab = async (slabId: string) => {
    setIsLoading(true);
    try {
      const slabToDelete = settings.markupSlabs.find(slab => slab.id === slabId);
      const updatedSlabs = settings.markupSlabs.filter(slab => slab.id !== slabId);
      await handleSettingsUpdate({
        markupSlabs: updatedSlabs
      });
      toast({
        title: "Slab Deleted",
        description: `Markup slab "${slabToDelete?.name}" has been deleted successfully.`
      });
    } catch (error) {
      console.error('Error deleting markup slab:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete markup slab. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setDeletingSlabId(null);
    }
  };
  const confirmDeleteSlab = (slabId: string) => {
    setDeletingSlabId(slabId);
  };
  const toggleSlabStatus = async (slabId: string) => {
    setIsLoading(true);
    try {
      const updatedSlabs = settings.markupSlabs.map(slab => slab.id === slabId ? {
        ...slab,
        isActive: !slab.isActive,
        updatedAt: new Date().toISOString()
      } : slab);
      await handleSettingsUpdate({
        markupSlabs: updatedSlabs
      });
      const toggledSlab = updatedSlabs.find(slab => slab.id === slabId);
      toast({
        title: "Status Updated",
        description: `Markup slab "${toggledSlab?.name}" has been ${toggledSlab?.isActive ? 'activated' : 'deactivated'}.`
      });
    } catch (error) {
      console.error('Error toggling slab status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update slab status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <PageLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 px-2 sm:px-0">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-xl sm:text-2xl font-bold truncate">Pricing Configuration</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="flex lg:grid lg:grid-cols-6 w-max lg:w-full min-w-full bg-muted p-1 h-auto">
              <TabsTrigger value="general" className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                General & Slabs
              </TabsTrigger>
              <TabsTrigger value="countries" className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                Countries
              </TabsTrigger>
              <TabsTrigger value="export" className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                Export Control
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                Tax
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                Advanced
              </TabsTrigger>
              <TabsTrigger value="simulator" className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                Calculator
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* General Settings */}
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">General Pricing Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultMarkup">Default Markup Percentage</Label>
                    <div className="flex items-center gap-2">
                      <Input id="defaultMarkup" type="number" value={settings.defaultMarkupPercentage} onChange={e => handleSettingsUpdate({
                      defaultMarkupPercentage: Number(e.target.value)
                    })} min="0" max="100" step="0.1" />
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Country & Currency</Label>
                    <Select value={enhancedSettings.defaultCountry || "TH"} onValueChange={value => {
                    if (value && value !== "") {
                      const selectedCountry = EnhancedPricingService.getAvailableCountries().find(c => c.code === value);
                      if (selectedCountry) {
                        EnhancedPricingService.updateEnhancedSettings({
                          defaultCountry: value,
                          currencyConversion: {
                            ...enhancedSettings.currencyConversion,
                            baseCurrency: selectedCountry.currency
                          }
                        });
                        setEnhancedSettings(EnhancedPricingService.getEnhancedSettings());

                        // Create country rule if it doesn't exist
                        const existingRule = EnhancedPricingService.getCountryRule(value);
                        if (!existingRule) {
                          EnhancedPricingService.createCountryRule({
                            countryCode: value,
                            countryName: selectedCountry.name,
                            currency: selectedCountry.currency,
                            currencySymbol: selectedCountry.currencySymbol,
                            defaultMarkup: settings.defaultMarkupPercentage,
                            markupType: 'percentage',
                            isActive: true,
                            region: selectedCountry.region,
                            tier: 'standard',
                            conversionMargin: 2
                          });
                        }
                        toast({
                          title: "Country Updated",
                          description: `Default country set to ${selectedCountry.name}. Currency: ${selectedCountry.currency}.`
                        });
                      }
                    }
                  }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default country" />
                      </SelectTrigger>
                      <SelectContent>
                        {EnhancedPricingService.getAvailableCountries().map(country => <SelectItem key={country.code} value={country.code}>
                            {country.name} ({country.currency})
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-3 sm:p-4 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base">Slab-Based Pricing</Label>
                      <p className="text-xs text-muted-foreground">Use pricing tiers based on amount ranges</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={settings.useSlabPricing ? "default" : "outline"} className="text-xs">
                        {settings.useSlabPricing ? "Active" : "Inactive"}
                      </Badge>
                      <Switch checked={settings.useSlabPricing} onCheckedChange={checked => {
                      handleSettingsUpdate({
                        useSlabPricing: checked
                      });

                      // Auto-activate slabs for countries with configured rules
                      if (checked) {
                        const activeCountries = enhancedSettings.countryRules.filter(rule => rule.isActive);
                        const updatedSlabs = settings.markupSlabs.map(slab => {
                          // Check if any active country uses this slab's currency OR if it's Thailand (THB) - default active
                          const hasMatchingCountry = activeCountries.some(country => country.currency === slab.currency);
                          const isThailandCurrency = slab.currency === 'THB';
                          return (hasMatchingCountry || isThailandCurrency) ? {
                            ...slab,
                            isActive: true,
                            updatedAt: new Date().toISOString()
                          } : slab;
                        });
                        if (updatedSlabs.some((slab, index) => slab.isActive !== settings.markupSlabs[index].isActive)) {
                          handleSettingsUpdate({
                            markupSlabs: updatedSlabs
                          });
                          const activatedCount = updatedSlabs.filter(slab => slab.isActive).length;
                          toast({
                            title: "Slab Pricing Enabled",
                            description: `Pricing will now use configured markup slabs. ${activatedCount} slabs activated based on configured countries.`
                          });
                        } else {
                          toast({
                            title: "Slab Pricing Enabled",
                            description: "Pricing will now use configured markup slabs"
                          });
                        }
                      } else {
                        toast({
                          title: "Slab Pricing Disabled",
                          description: "Pricing will use default markup percentage"
                        });
                      }
                    }} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-3 sm:p-4 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base">Country-Based Pricing</Label>
                      <p className="text-xs text-muted-foreground">Apply different markups per country</p>
                    </div>
                    <Switch checked={enhancedSettings.enableCountryBasedPricing} onCheckedChange={checked => {
                    EnhancedPricingService.updateEnhancedSettings({
                      enableCountryBasedPricing: checked
                    });
                    setEnhancedSettings(EnhancedPricingService.getEnhancedSettings());
                    toast({
                      title: checked ? "Country Pricing Enabled" : "Country Pricing Disabled",
                      description: checked ? "Pricing will consider country-specific rules" : "Pricing will use standard rules only"
                    });
                  }} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <Label className="text-sm">Show Pricing to Agents</Label>
                    <Switch checked={settings.showPricingToAgents} onCheckedChange={checked => handleSettingsUpdate({
                    showPricingToAgents: checked
                  })} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <Label className="text-sm">Show Pricing to Staff</Label>
                    <Switch checked={settings.showPricingToStaff} onCheckedChange={checked => handleSettingsUpdate({
                    showPricingToStaff: checked
                  })} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <Label className="text-sm">Allow Staff Pricing Edit</Label>
                    <Switch checked={settings.allowStaffPricingEdit} onCheckedChange={checked => handleSettingsUpdate({
                    allowStaffPricingEdit: checked
                  })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Markup Slabs Section */}
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-lg sm:text-xl">Markup Slabs Configuration</span>
                    {settings.useSlabPricing && <Badge variant="default" className="ml-2 text-xs">Active</Badge>}
                  </span>
                  <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingSlab !== null || isLoading} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Slab</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enhanced Slab Application Mode Setting with Country-Based Pricing */}
                {settings.useSlabPricing && <div className="space-y-4">
                    

                    {/* Country-Based Slab Pricing Configuration */}
                    {enhancedSettings.enableCountryBasedPricing && <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">Country-Based Slab Settings</span>
                          </div>
                          <Badge variant="outline" className="border-blue-300 text-blue-700">
                            {enhancedSettings.countryRules.filter(rule => rule.isActive).length} Countries Active
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {/* Per-Country Slab Application */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Per-Country Slab Application</Label>
                            <div className="grid gap-2">
                              {enhancedSettings.countryRules.filter(rule => rule.isActive).slice(0, 3) // Show first 3 active countries
                        .map(rule => <div key={rule.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {rule.countryCode}
                                    </Badge>
                                    <span className="text-sm">{rule.countryName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({rule.currencySymbol} {rule.currency})
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant={rule.countryCode === 'TH' ? "default" : "secondary"} className="text-xs">
                                      {rule.countryCode === 'TH' ? 'Per Person' : rule.markupType === 'percentage' ? `${rule.defaultMarkup}%` : `${rule.currencySymbol}${rule.defaultMarkup}`}
                                    </Badge>
                                    
                                    {rule.countryCode === 'TH' && <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-primary" />
                                        <span className="text-xs text-primary font-medium">Per Person Applied</span>
                                      </div>}
                                  </div>
                                </div>)}
                            </div>
                            
                            {enhancedSettings.countryRules.filter(rule => rule.isActive).length > 3 && <div className="text-xs text-muted-foreground text-center">
                                ... and {enhancedSettings.countryRules.filter(rule => rule.isActive).length - 3} more countries
                              </div>}
                          </div>

                          {/* Thailand Specific Settings */}
                          {enhancedSettings.countryRules.some(rule => rule.countryCode === 'TH' && rule.isActive) && <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  TH
                                </Badge>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Thailand - Enhanced Per Person Pricing
                                </span>
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-300">
                                ✓ Markup calculated per person basis<br />
                                ✓ Slab ranges applied to individual traveler amounts<br />
                                ✓ Optimal for group bookings and family packages
                              </div>
                            </div>}

                          <div className="text-xs text-muted-foreground">
                            💡 Country-specific rules override slab settings. For Thailand, markup is always applied per person for accurate group pricing.
                          </div>
                        </div>
                      </div>}
                  </div>}
                
                {!settings.useSlabPricing && <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      💡 Slab-based pricing is currently disabled. Enable it above to use these markup slabs for automatic pricing tiers.
                    </p>
                  </div>}

                {settings.useSlabPricing && enhancedSettings.enableCountryBasedPricing && <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      ℹ️ Both slab and country-based pricing are enabled. Country rules take precedence over markup slabs.
                    </p>
                  </div>}

                {isCreating && <EnhancedMarkupSlabForm onSave={handleSaveSlab} onCancel={handleCancelEdit} existingSlabs={settings.markupSlabs} isEditing={false} />}

                {editingSlab && <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Edit className="h-4 w-4" />
                      <span className="font-medium">Editing: {editingSlab.name}</span>
                    </div>
                    <EnhancedMarkupSlabForm slab={editingSlab} onSave={handleSaveSlab} onCancel={handleCancelEdit} existingSlabs={settings.markupSlabs} isEditing={true} />
                  </div>}

                <MarkupSlabsPagination slabs={settings.markupSlabs} onEdit={setEditingSlab} onDelete={confirmDeleteSlab} onToggleStatus={toggleSlabStatus} isLoading={isLoading} editingSlab={editingSlab} isCreating={isCreating} />
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deletingSlabId !== null} onOpenChange={open => !open && setDeletingSlabId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Markup Slab</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this markup slab? This action cannot be undone and may affect existing pricing calculations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletingSlabId && handleDeleteSlab(deletingSlabId)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>


          <TabsContent value="countries" className="px-2 sm:px-0">
            <CountryPricingManager onUpdate={handleRefresh} />
          </TabsContent>

          <TabsContent value="export" className="px-2 sm:px-0">
            <MarkupExportPreview onSettingsChange={handleRefresh} />
          </TabsContent>

          <TabsContent value="tax" className="px-2 sm:px-0">
            <TaxManagement onTaxUpdate={taxSettings => {
            toast({
              title: "Tax Settings Updated",
              description: "Tax configuration has been saved successfully."
            });
          }} />
          </TabsContent>

          <TabsContent value="advanced" className="px-2 sm:px-0">
            <AdvancedPricingEngine onPricingUpdate={pricingData => {
            console.log('Advanced pricing updated:', pricingData);
          }} />
          </TabsContent>

          <TabsContent value="simulator" className="px-2 sm:px-0">
            <PricingSimulator />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>;
};
export default PricingSettings;