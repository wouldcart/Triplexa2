import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CountryPricingRule } from '@/types/countryPricing';
import { Plus, Edit, Trash2, Globe, DollarSign } from 'lucide-react';
import CountryPricingEditDialog from './CountryPricingEditDialog';
import { PricingConfigurationService } from '@/integrations/supabase/services/pricingConfigurationService';
import { CountriesService, CountryListItem } from '@/integrations/supabase/services/countriesService';
import { CountryPricingRulesSupabase, toUI } from '@/integrations/supabase/services/countryPricingRulesService';

interface CountryPricingManagerProps {
  onUpdate?: () => void;
}

const CountryPricingManager: React.FC<CountryPricingManagerProps> = ({ onUpdate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<CountryPricingRule | null>(null);
  const [rules, setRules] = useState<CountryPricingRule[]>([]);
  const [availableCountries, setAvailableCountries] = useState<CountryListItem[]>([]);
  const [isCountryPricingEnabled, setIsCountryPricingEnabled] = useState<boolean>(false);
  const [configId, setConfigId] = useState<string | null>(null);
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
    conversionMargin: 2,
  });

  const unConfiguredCountries = availableCountries.filter(
    (country) => !rules.some((rule) => rule.countryCode === country.code)
  );

  // Hydrate from Supabase: configuration, countries, and rules
  useEffect(() => {
    (async () => {
      try {
        const countries = await CountriesService.listActiveCountries();
        setAvailableCountries(countries);

        const config = await PricingConfigurationService.getDefaultConfiguration();
        if (!config?.id) {
          console.warn('Default pricing configuration not found. Country pricing manager will be disabled.');
          setIsCountryPricingEnabled(false);
          setConfigId(null);
          setRules([]);
          return;
        }
        setConfigId(config.id);
        setIsCountryPricingEnabled(!!config.enable_country_based_pricing);

        const rows = await CountryPricingRulesSupabase.listByConfig(config.id);
        setRules(rows.map(toUI));
      } catch (err) {
        console.warn('Failed to hydrate country pricing rules from Supabase', err);
      }
    })();
  }, []);

  const handleCountrySelect = (countryCode: string) => {
    const country = availableCountries.find((c) => c.code === countryCode);
    if (country) {
      setNewRule((prev) => ({
        ...prev,
        countryCode: country.code,
        countryName: country.name,
        currency: country.currency,
        currencySymbol: country.currency_symbol,
        region: country.region,
      }));
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.countryCode || !newRule.defaultMarkup) {
      toast({
        title: 'Validation Error',
        description: 'Please select a country and set markup value.',
        variant: 'destructive',
      });
      return;
    }
    if (!configId) {
      toast({
        title: 'Configuration Missing',
        description: 'No default pricing configuration found. Please seed configuration first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const row = await CountryPricingRulesSupabase.create(configId, newRule);
      setRules((prev) => [...prev, toUI(row)]);
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
        conversionMargin: 2,
      });
      toast({
        title: 'Country Rule Created',
        description: `Pricing rule for ${newRule.countryName} has been created.`,
      });
      onUpdate?.();
    } catch (err) {
      console.warn('Failed to persist country pricing rule to Supabase.', err);
      toast({
        title: 'Create Failed',
        description: 'Unable to create country pricing rule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<CountryPricingRule>) => {
    try {
      const updated = await CountryPricingRulesSupabase.update(ruleId, updates);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? toUI(updated) : r)));
      setEditingRule(null);
      toast({
        title: 'Rule Updated',
        description: 'Country pricing rule has been updated successfully.',
      });
      onUpdate?.();
    } catch (err) {
      console.warn('Failed updating country rule in Supabase', err);
      toast({
        title: 'Update Failed',
        description: 'Unable to update country rule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await CountryPricingRulesSupabase.delete(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast({
        title: 'Rule Deleted',
        description: 'Country pricing rule has been deleted.',
      });
      onUpdate?.();
    } catch (err) {
      console.warn('Supabase delete failed for country rule', err);
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete country rule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    try {
      const updated = await CountryPricingRulesSupabase.toggleStatus(ruleId, !rule.isActive);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? toUI(updated) : r)));
    } catch (err) {
      console.warn('Failed to toggle rule status', err);
      toast({
        title: 'Toggle Failed',
        description: 'Unable to toggle rule status. Please try again.',
        variant: 'destructive',
      });
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
              checked={isCountryPricingEnabled}
              onCheckedChange={async (checked) => {
                try {
                  const updated = await PricingConfigurationService.upsertConfiguration({
                    country_code: 'US',
                    enable_country_based_pricing: checked,
                  });
                  setIsCountryPricingEnabled(!!updated.enable_country_based_pricing);
                  onUpdate?.();
                } catch (err) {
                  console.warn('Failed to update enable_country_based_pricing', err);
                  toast({
                    title: 'Update Failed',
                    description: 'Unable to update country-based pricing setting.',
                    variant: 'destructive',
                  });
                }
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

      {!isCountryPricingEnabled && (
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
        {rules.map((rule) => (
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

      {rules.length === 0 && (
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
