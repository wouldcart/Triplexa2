import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { CountryPricingRule } from '@/types/countryPricing';
import { Plus, Edit, Trash2, Globe, DollarSign } from 'lucide-react';
import CountryPricingEditDialog from './CountryPricingEditDialog';

interface CountryPricingManagerProps {
  onUpdate?: () => void;
}

const CountryPricingManager: React.FC<CountryPricingManagerProps> = ({ onUpdate }) => {
  const [settings, setSettings] = useState(EnhancedPricingService.getEnhancedSettings());
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<CountryPricingRule | null>(null);
  const { toast } = useToast();

  const [newRule, setNewRule] = useState<Partial<CountryPricingRule>>({
    countryCode: '',
    countryName: '',
    currency: '',
    currencySymbol: '',
    defaultMarkup: 8,
    markupType: 'percentage',
    isActive: true,
    region: '',
    tier: 'standard',
    conversionMargin: 2
  });

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const unConfiguredCountries = availableCountries.filter(
    country => !settings.countryRules.some(rule => rule.countryCode === country.code)
  );

  const handleCountrySelect = (countryCode: string) => {
    const country = availableCountries.find(c => c.code === countryCode);
    if (country) {
      setNewRule(prev => ({
        ...prev,
        countryCode: country.code,
        countryName: country.name,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        region: country.region
      }));
    }
  };

  const handleCreateRule = () => {
    if (!newRule.countryCode || !newRule.defaultMarkup) {
      toast({
        title: "Validation Error",
        description: "Please select a country and set markup value.",
        variant: "destructive"
      });
      return;
    }

    EnhancedPricingService.createCountryRule(newRule as Omit<CountryPricingRule, 'id' | 'createdAt' | 'updatedAt'>);
    setSettings(EnhancedPricingService.getEnhancedSettings());
    setIsCreating(false);
    setNewRule({
      countryCode: '',
      countryName: '',
      currency: '',
      currencySymbol: '',
      defaultMarkup: 8,
      markupType: 'percentage',
      isActive: true,
      region: '',
      tier: 'standard',
      conversionMargin: 2
    });

    toast({
      title: "Country Rule Created",
      description: `Pricing rule for ${newRule.countryName} has been created.`
    });

    onUpdate?.();
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<CountryPricingRule>) => {
    EnhancedPricingService.updateCountryRule(ruleId, updates);
    setSettings(EnhancedPricingService.getEnhancedSettings());
    setEditingRule(null);

    toast({
      title: "Rule Updated",
      description: "Country pricing rule has been updated successfully."
    });

    onUpdate?.();
  };

  const handleDeleteRule = (ruleId: string) => {
    EnhancedPricingService.deleteCountryRule(ruleId);
    setSettings(EnhancedPricingService.getEnhancedSettings());

    toast({
      title: "Rule Deleted",
      description: "Country pricing rule has been deleted."
    });

    onUpdate?.();
  };

  const toggleRuleStatus = (ruleId: string) => {
    const rule = settings.countryRules.find(r => r.id === ruleId);
    if (rule) {
      handleUpdateRule(ruleId, { isActive: !rule.isActive });
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      budget: 'bg-green-100 text-green-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      luxury: 'bg-yellow-100 text-yellow-800'
    };
    return colors[tier as keyof typeof colors] || colors.standard;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Country-Based Pricing
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure pricing rules for different countries and regions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableCountryBasedPricing}
              onCheckedChange={(checked) => {
                EnhancedPricingService.updateEnhancedSettings({ enableCountryBasedPricing: checked });
                setSettings(EnhancedPricingService.getEnhancedSettings());
                onUpdate?.();
              }}
            />
            <Label>Enable Country-Based Pricing</Label>
          </div>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Add Country Rule
          </Button>
        </div>
      </div>

      {!settings.enableCountryBasedPricing && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Country-based pricing is currently disabled. Enable it to configure country-specific pricing rules.
          </p>
        </div>
      )}

      {/* Create New Rule */}
      {isCreating && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Add New Country Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={newRule.countryCode} onValueChange={handleCountrySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {unConfiguredCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pricing Tier</Label>
                <Select 
                  value={newRule.tier} 
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, tier: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Markup Type</Label>
                <Select 
                  value={newRule.markupType} 
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, markupType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Markup</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newRule.defaultMarkup}
                    onChange={(e) => setNewRule(prev => ({ ...prev, defaultMarkup: Number(e.target.value) }))}
                    min="0"
                    step={newRule.markupType === 'percentage' ? '0.1' : '1'}
                  />
                  <span className="text-sm text-muted-foreground">
                    {newRule.markupType === 'percentage' ? '%' : newRule.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Rules */}
      <div className="grid gap-4">
        {settings.countryRules.map((rule) => (
          <Card key={rule.id} className="bg-background">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{rule.countryName}</h4>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={getTierColor(rule.tier)}>
                      {rule.tier}
                    </Badge>
                    <Badge variant="outline">
                      {rule.currencySymbol} {rule.currency}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Region:</span>
                      <div className="font-medium">{rule.region}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Markup:</span>
                      <div className="font-medium">
                        {rule.markupType === 'percentage' 
                          ? `${rule.defaultMarkup}%` 
                          : `${rule.currencySymbol}${rule.defaultMarkup}`
                        }
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Conversion Margin:</span>
                      <div className="font-medium">{rule.conversionMargin}%</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium capitalize">{rule.markupType}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRuleStatus(rule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRule(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {settings.countryRules.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No country pricing rules configured</p>
          <p className="text-sm">Add your first country rule to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <CountryPricingEditDialog
        rule={editingRule}
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        onSave={handleUpdateRule}
      />
    </div>
  );
};

export default CountryPricingManager;
