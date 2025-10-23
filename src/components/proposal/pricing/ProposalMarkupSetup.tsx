import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PricingService } from '@/services/pricingService';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { MarkupSlab, PricingSettings as PricingSettingsType } from '@/types/pricing';
import { MarkupSlabManager } from './MarkupSlabManager';
import { Plus, Edit, Trash2, Save, DollarSign, Percent, Settings, Globe, Calculator } from 'lucide-react';

interface ProposalMarkupSetupProps {
  queryId: string;
  onMarkupUpdate?: (markup: any) => void;
}

interface ProposalSpecificMarkupSettings {
  inheritFromGlobal: boolean;
  defaultMarkupPercentage: number;
  useSlabPricing: boolean;
  markupSlabs: MarkupSlab[];
  slabApplicationMode: 'per-person' | 'total';
  countrySpecific: boolean;
  selectedCountry: string;
}

export const ProposalMarkupSetup: React.FC<ProposalMarkupSetupProps> = ({
  queryId,
  onMarkupUpdate
}) => {
  const { toast } = useToast();
  const [globalSettings, setGlobalSettings] = useState<PricingSettingsType>(PricingService.getSettings());
  const [proposalSettings, setProposalSettings] = useState<ProposalSpecificMarkupSettings>({
    inheritFromGlobal: true,
    defaultMarkupPercentage: globalSettings.defaultMarkupPercentage,
    useSlabPricing: globalSettings.useSlabPricing,
    markupSlabs: [...globalSettings.markupSlabs],
    slabApplicationMode: globalSettings.slabApplicationMode,
    countrySpecific: false,
    selectedCountry: 'TH'
  });
  const [isLoading, setIsLoading] = useState(false);

  const storageKey = `markup_settings_${queryId}`;

  // Load proposal-specific settings from localStorage
  useEffect(() => {
    const loadProposalSettings = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          setProposalSettings(prevSettings => ({
            ...prevSettings,
            ...parsedSettings
          }));
        }
      } catch (error) {
        console.error('Error loading proposal markup settings:', error);
      }
    };

    loadProposalSettings();
  }, [storageKey]);

  // Save proposal-specific settings to localStorage
  const saveProposalSettings = (settings: Partial<ProposalSpecificMarkupSettings>) => {
    try {
      const updatedSettings = { ...proposalSettings, ...settings };
      setProposalSettings(updatedSettings);
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
      
      // Notify parent component of markup changes
      onMarkupUpdate?.(updatedSettings);
      
      return true;
    } catch (error) {
      console.error('Error saving proposal markup settings:', error);
      return false;
    }
  };

  const handleInheritanceToggle = (inherit: boolean) => {
    if (inherit) {
      // Copy current global settings
      const currentGlobal = PricingService.getSettings();
      saveProposalSettings({
        inheritFromGlobal: true,
        defaultMarkupPercentage: currentGlobal.defaultMarkupPercentage,
        useSlabPricing: currentGlobal.useSlabPricing,
        markupSlabs: [...currentGlobal.markupSlabs],
        slabApplicationMode: currentGlobal.slabApplicationMode
      });
    } else {
      saveProposalSettings({ inheritFromGlobal: false });
    }
    
    toast({
      title: inherit ? "Inheriting Global Settings" : "Using Custom Settings",
      description: inherit 
        ? "This proposal will use global pricing settings" 
        : "This proposal will use custom pricing settings"
    });
  };

  const handleSettingUpdate = (updates: Partial<ProposalSpecificMarkupSettings>) => {
    saveProposalSettings(updates);
  };

  const handleSlabUpdate = (newSlabs: MarkupSlab[]) => {
    saveProposalSettings({ markupSlabs: newSlabs });
    toast({
      title: "Slabs Updated",
      description: "Markup slabs have been updated for this proposal"
    });
  };

  const addNewSlab = () => {
    const newSlab: MarkupSlab = {
      id: `slab_${Date.now()}`,
      name: `Slab ${proposalSettings.markupSlabs.length + 1}`,
      minAmount: 0,
      maxAmount: 5000,
      markupType: 'percentage',
      markupValue: 10,
      currency: 'THB',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedSlabs = [...proposalSettings.markupSlabs, newSlab];
    handleSlabUpdate(updatedSlabs);
  };

  const deleteSlab = (slabId: string) => {
    const updatedSlabs = proposalSettings.markupSlabs.filter(slab => slab.id !== slabId);
    handleSlabUpdate(updatedSlabs);
  };

  const toggleSlabStatus = (slabId: string) => {
    const updatedSlabs = proposalSettings.markupSlabs.map(slab => 
      slab.id === slabId 
        ? { ...slab, isActive: !slab.isActive, updatedAt: new Date().toISOString() }
        : slab
    );
    handleSlabUpdate(updatedSlabs);
  };

  // Calculate example pricing
  const calculateExamplePricing = (baseAmount: number) => {
    const settings = proposalSettings.inheritFromGlobal ? globalSettings : proposalSettings;
    
    if (settings.useSlabPricing) {
      const applicableSlab = settings.markupSlabs.find(slab => 
        slab.isActive && 
        baseAmount >= slab.minAmount && 
        baseAmount <= slab.maxAmount
      );
      
      if (applicableSlab) {
        const markup = applicableSlab.markupType === 'percentage' 
          ? (baseAmount * applicableSlab.markupValue) / 100
          : applicableSlab.markupValue;
        return { markup, total: baseAmount + markup, slabUsed: applicableSlab.name };
      }
    }
    
    const markup = (baseAmount * settings.defaultMarkupPercentage) / 100;
    return { markup, total: baseAmount + markup, slabUsed: null };
  };

  const exampleAmounts = [5000, 10000, 15000];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Markup Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure markup settings specific to this proposal
          </p>
        </div>
        <Badge variant={proposalSettings.inheritFromGlobal ? "default" : "secondary"}>
          {proposalSettings.inheritFromGlobal ? "Global Settings" : "Custom Settings"}
        </Badge>
      </div>

      {/* Inheritance Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Inherit Global Settings</Label>
              <p className="text-sm text-muted-foreground">
                Use global pricing settings or customize for this proposal
              </p>
            </div>
            <Switch 
              checked={proposalSettings.inheritFromGlobal}
              onCheckedChange={handleInheritanceToggle}
            />
          </div>
          
          {proposalSettings.inheritFromGlobal && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Current Global Settings:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Default Markup: {globalSettings.defaultMarkupPercentage}%</div>
                <div>Slab Pricing: {globalSettings.useSlabPricing ? 'Enabled' : 'Disabled'}</div>
                <div>Application Mode: {globalSettings.slabApplicationMode}</div>
                <div>Active Slabs: {globalSettings.markupSlabs.filter(s => s.isActive).length}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Settings (only show when not inheriting) */}
      {!proposalSettings.inheritFromGlobal && (
        <>
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Basic Markup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultMarkup">Default Markup Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="defaultMarkup"
                      type="number" 
                      value={proposalSettings.defaultMarkupPercentage}
                      onChange={(e) => handleSettingUpdate({ 
                        defaultMarkupPercentage: Number(e.target.value) 
                      })}
                      min="0" 
                      max="100" 
                      step="0.1" 
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <Label>Application Mode</Label>
                  <Select 
                    value={proposalSettings.slabApplicationMode}
                    onValueChange={(value: 'per-person' | 'total') => 
                      handleSettingUpdate({ slabApplicationMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per-person">Per Person</SelectItem>
                      <SelectItem value="total">Total Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="text-base">Slab-Based Pricing</Label>
                  <p className="text-sm text-muted-foreground">
                    Use different markup rates for different amount ranges
                  </p>
                </div>
                <Switch 
                  checked={proposalSettings.useSlabPricing}
                  onCheckedChange={(checked) => handleSettingUpdate({ useSlabPricing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Slab Management */}
          {proposalSettings.useSlabPricing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Markup Slabs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Slabs */}
                <div className="space-y-3">
                  {proposalSettings.markupSlabs.map((slab, index) => (
                    <div key={slab.id} className="grid grid-cols-6 gap-2 items-center p-3 border rounded">
                      <Input
                        type="text"
                        value={slab.name}
                        onChange={(e) => {
                          const updatedSlabs = proposalSettings.markupSlabs.map(s => 
                            s.id === slab.id ? { ...s, name: e.target.value } : s
                          );
                          handleSlabUpdate(updatedSlabs);
                        }}
                        placeholder="Slab Name"
                      />
                      <Input
                        type="number"
                        value={slab.minAmount}
                        onChange={(e) => {
                          const updatedSlabs = proposalSettings.markupSlabs.map(s => 
                            s.id === slab.id ? { ...s, minAmount: Number(e.target.value) } : s
                          );
                          handleSlabUpdate(updatedSlabs);
                        }}
                        placeholder="Min"
                      />
                      <Input
                        type="number"
                        value={slab.maxAmount}
                        onChange={(e) => {
                          const updatedSlabs = proposalSettings.markupSlabs.map(s => 
                            s.id === slab.id ? { ...s, maxAmount: Number(e.target.value) } : s
                          );
                          handleSlabUpdate(updatedSlabs);
                        }}
                        placeholder="Max"
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={slab.markupValue}
                          onChange={(e) => {
                            const updatedSlabs = proposalSettings.markupSlabs.map(s => 
                              s.id === slab.id ? { ...s, markupValue: Number(e.target.value) } : s
                            );
                            handleSlabUpdate(updatedSlabs);
                          }}
                          placeholder="Rate"
                          step="0.1"
                        />
                        <span className="text-sm">%</span>
                      </div>
                      <Switch
                        checked={slab.isActive}
                        onCheckedChange={() => toggleSlabStatus(slab.id)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteSlab(slab.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={addNewSlab} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Slab
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Pricing Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Markup Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exampleAmounts.map(amount => {
              const example = calculateExamplePricing(amount);
              return (
                <div key={amount} className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="text-sm">Base: ฿{amount.toLocaleString()}</span>
                  {example.slabUsed && (
                    <Badge variant="outline" className="text-xs">
                      {example.slabUsed}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Markup: ฿{example.markup.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium">
                    Total: ฿{example.total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      <div className="flex justify-end">
        <Badge variant="secondary" className="text-xs">
          Auto-saved to proposal #{queryId}
        </Badge>
      </div>
    </div>
  );
};
