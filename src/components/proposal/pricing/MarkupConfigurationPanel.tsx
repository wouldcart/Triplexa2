import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PricingService } from '@/services/pricingService';
import { MarkupSlab } from '@/types/pricing';
import { 
  Settings, DollarSign, Percent, Calculator, Plus, 
  Edit, Trash2, Save, Globe, Users, TrendingUp,
  AlertCircle, CheckCircle, Zap
} from 'lucide-react';

interface MarkupConfigurationPanelProps {
  queryId: string;
  markupSettings: any;
  onSettingsUpdate: (settings: any) => void;
  formatCurrency: (amount: number) => string;
}

export const MarkupConfigurationPanel: React.FC<MarkupConfigurationPanelProps> = ({
  queryId,
  markupSettings,
  onSettingsUpdate,
  formatCurrency
}) => {
  const { toast } = useToast();
  const [globalSettings] = useState(PricingService.getSettings());
  const [localSettings, setLocalSettings] = useState(markupSettings);

  const handleInheritanceToggle = (inherit: boolean) => {
    if (inherit) {
      const currentGlobal = PricingService.getSettings();
      const inheritedSettings = {
        inheritFromGlobal: true,
        defaultMarkupPercentage: currentGlobal.defaultMarkupPercentage,
        useSlabPricing: currentGlobal.useSlabPricing,
        markupSlabs: [...currentGlobal.markupSlabs],
        slabApplicationMode: currentGlobal.slabApplicationMode
      };
      setLocalSettings(inheritedSettings);
      onSettingsUpdate(inheritedSettings);
    } else {
      const customSettings = {
        ...localSettings,
        inheritFromGlobal: false
      };
      setLocalSettings(customSettings);
      onSettingsUpdate(customSettings);
    }
  };

  const handleSettingUpdate = (updates: any) => {
    const updatedSettings = { ...localSettings, ...updates };
    setLocalSettings(updatedSettings);
    onSettingsUpdate(updatedSettings);
  };

  const addNewSlab = () => {
    const newSlab: MarkupSlab = {
      id: `slab_${Date.now()}`,
      name: `Slab ${(localSettings.markupSlabs?.length || 0) + 1}`,
      minAmount: 0,
      maxAmount: 5000,
      markupType: 'percentage',
      markupValue: 10,
      currency: 'THB',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedSlabs = [...(localSettings.markupSlabs || []), newSlab];
    handleSettingUpdate({ markupSlabs: updatedSlabs });
  };

  const updateSlab = (slabId: string, updates: Partial<MarkupSlab>) => {
    const updatedSlabs = (localSettings.markupSlabs || []).map((slab: MarkupSlab) => 
      slab.id === slabId 
        ? { ...slab, ...updates, updatedAt: new Date().toISOString() }
        : slab
    );
    handleSettingUpdate({ markupSlabs: updatedSlabs });
  };

  const deleteSlab = (slabId: string) => {
    const updatedSlabs = (localSettings.markupSlabs || []).filter((slab: MarkupSlab) => slab.id !== slabId);
    handleSettingUpdate({ markupSlabs: updatedSlabs });
    toast({
      title: "Slab Deleted",
      description: "Markup slab has been removed successfully"
    });
  };

  const calculateExamplePricing = (baseAmount: number) => {
    const settings = localSettings.inheritFromGlobal ? globalSettings : localSettings;
    
    if (settings.useSlabPricing && settings.markupSlabs) {
      const applicableSlab = settings.markupSlabs.find((slab: MarkupSlab) => 
        slab.isActive && 
        baseAmount >= slab.minAmount && 
        baseAmount <= slab.maxAmount
      );
      
      if (applicableSlab) {
        const markup = applicableSlab.markupType === 'percentage' 
          ? (baseAmount * applicableSlab.markupValue) / 100
          : applicableSlab.markupValue;
        return { 
          markup, 
          total: baseAmount + markup, 
          slabUsed: applicableSlab.name,
          markupType: applicableSlab.markupType,
          markupValue: applicableSlab.markupValue
        };
      }
    }
    
    const markup = (baseAmount * (settings.defaultMarkupPercentage || 0)) / 100;
    return { 
      markup, 
      total: baseAmount + markup, 
      slabUsed: null,
      markupType: 'percentage',
      markupValue: settings.defaultMarkupPercentage || 0
    };
  };

  const exampleAmounts = [5000, 10000, 20000, 50000];

  return (
    <div className="space-y-6">
      {/* Settings Source Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Inherit Global Settings</Label>
              <p className="text-sm text-muted-foreground">
                Use global pricing settings or customize for this proposal
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={localSettings.inheritFromGlobal ? "default" : "secondary"}>
                {localSettings.inheritFromGlobal ? "Global" : "Custom"}
              </Badge>
              <Switch 
                checked={localSettings.inheritFromGlobal}
                onCheckedChange={handleInheritanceToggle}
              />
            </div>
          </div>
          
          {localSettings.inheritFromGlobal && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Current Global Settings
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Default Markup:</span>
                  <Badge variant="outline">{globalSettings.defaultMarkupPercentage}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Slab Pricing:</span>
                  <Badge variant={globalSettings.useSlabPricing ? "default" : "outline"}>
                    {globalSettings.useSlabPricing ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Application Mode:</span>
                  <Badge variant="outline">{globalSettings.slabApplicationMode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Active Slabs:</span>
                  <Badge variant="outline">{globalSettings.markupSlabs.filter(s => s.isActive).length}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Settings - Only show when not inheriting */}
      {!localSettings.inheritFromGlobal && (
        <>
          {/* Basic Markup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Basic Markup Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultMarkup" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Default Markup Percentage
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="defaultMarkup"
                      type="number" 
                      value={localSettings.defaultMarkupPercentage || 0}
                      onChange={(e) => handleSettingUpdate({ 
                        defaultMarkupPercentage: Number(e.target.value) 
                      })}
                      min="0" 
                      max="100" 
                      step="0.1"
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Application Mode
                  </Label>
                  <Select 
                    value={localSettings.slabApplicationMode || 'per-person'}
                    onValueChange={(value: 'per-person' | 'total') => 
                      handleSettingUpdate({ slabApplicationMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per-person">Per Person Calculation</SelectItem>
                      <SelectItem value="total">Total Amount Calculation</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {localSettings.slabApplicationMode === 'per-person' 
                      ? 'Calculate markup based on per-person cost'
                      : 'Calculate markup based on total cost'
                    }
                  </p>
                </div>
              </div>

              <Separator />

              {/* Slab Pricing Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Slab-Based Pricing</Label>
                  <p className="text-sm text-muted-foreground">
                    Use different markup rates for different amount ranges
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={localSettings.useSlabPricing ? "default" : "outline"}>
                    {localSettings.useSlabPricing ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch 
                    checked={localSettings.useSlabPricing || false}
                    onCheckedChange={(checked) => handleSettingUpdate({ useSlabPricing: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slab Management - Only show if slab pricing is enabled */}
          {localSettings.useSlabPricing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Markup Slabs Configuration
                  </div>
                  <Button onClick={addNewSlab} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slab
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slab Headers */}
                <div className="grid grid-cols-7 gap-2 text-sm font-medium text-muted-foreground px-2">
                  <span>Name</span>
                  <span>Min Amount</span>
                  <span>Max Amount</span>
                  <span>Type</span>
                  <span>Value</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {/* Existing Slabs */}
                <div className="space-y-3">
                  {(localSettings.markupSlabs || []).map((slab: MarkupSlab) => (
                    <div key={slab.id} className="grid grid-cols-7 gap-2 items-center p-3 border rounded-lg">
                      <Input
                        value={slab.name}
                        onChange={(e) => updateSlab(slab.id, { name: e.target.value })}
                        placeholder="Slab Name"
                        className="text-sm"
                      />
                      
                      <Input
                        type="number"
                        value={slab.minAmount}
                        onChange={(e) => updateSlab(slab.id, { minAmount: Number(e.target.value) })}
                        placeholder="Min"
                        className="text-sm"
                      />
                      
                      <Input
                        type="number"
                        value={slab.maxAmount === Infinity ? 999999 : slab.maxAmount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          updateSlab(slab.id, { maxAmount: value >= 999999 ? Infinity : value });
                        }}
                        placeholder="Max"
                        className="text-sm"
                      />
                      
                      <Select 
                        value={slab.markupType}
                        onValueChange={(value: 'percentage' | 'fixed') => 
                          updateSlab(slab.id, { markupType: value })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={slab.markupValue}
                          onChange={(e) => updateSlab(slab.id, { markupValue: Number(e.target.value) })}
                          placeholder="Value"
                          step="0.1"
                          className="text-sm"
                        />
                        {slab.markupType === 'percentage' && (
                          <span className="text-xs text-muted-foreground">%</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={slab.isActive}
                          onCheckedChange={(checked) => updateSlab(slab.id, { isActive: checked })}
                        />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteSlab(slab.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {(localSettings.markupSlabs || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No markup slabs configured. Add your first slab to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Pricing Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Markup Calculation Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exampleAmounts.map(amount => {
              const example = calculateExamplePricing(amount);
              return (
                <div key={amount} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">Base: {formatCurrency(amount)}</span>
                    {example.slabUsed && (
                      <Badge variant="outline" className="text-xs">
                        {example.slabUsed}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {example.markupType === 'percentage' 
                        ? `${example.markupValue}%` 
                        : formatCurrency(example.markupValue)
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-600">
                      Markup: {formatCurrency(example.markup)}
                    </span>
                    <span className="font-semibold text-primary">
                      Total: {formatCurrency(example.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      <div className="flex justify-between items-center">
        <Badge variant="secondary" className="text-xs">
          <Save className="h-3 w-3 mr-1" />
          Auto-saved to proposal #{queryId}
        </Badge>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Configuration ready</span>
        </div>
      </div>
    </div>
  );
};
