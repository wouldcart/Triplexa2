
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { CountryPricingRule } from '@/types/countryPricing';
import { Edit, Save, X, Calculator, Globe, Percent, DollarSign } from 'lucide-react';

interface EnhancedPricingTableProps {
  onUpdate?: () => void;
}

const EnhancedPricingTable: React.FC<EnhancedPricingTableProps> = ({ onUpdate }) => {
  const [settings, setSettings] = useState(EnhancedPricingService.getEnhancedSettings());
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CountryPricingRule>>({});
  const [testAmount, setTestAmount] = useState<number>(10000);
  const [testPax, setTestPax] = useState<number>(2);
  const { toast } = useToast();

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const taxConfigs = TaxCalculationService.getTaxConfigurations();

  const handleRefresh = () => {
    setSettings(EnhancedPricingService.getEnhancedSettings());
    onUpdate?.();
  };

  const startEdit = (rule: CountryPricingRule) => {
    setEditingRule(rule.id);
    setEditValues(rule);
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (editingRule && editValues) {
      EnhancedPricingService.updateCountryRule(editingRule, editValues);
      handleRefresh();
      setEditingRule(null);
      setEditValues({});
      
      toast({
        title: "Rule Updated",
        description: "Country pricing rule has been updated successfully."
      });
    }
  };

  const toggleRuleStatus = (ruleId: string) => {
    const rule = settings.countryRules.find(r => r.id === ruleId);
    if (rule) {
      EnhancedPricingService.updateCountryRule(ruleId, { isActive: !rule.isActive });
      handleRefresh();
    }
  };

  const calculatePreview = (rule: CountryPricingRule) => {
    const pricing = EnhancedPricingService.calculateCountryBasedPricing(
      testAmount, 
      testPax, 
      rule.countryCode
    );
    
    const taxResult = TaxCalculationService.calculateTax(
      pricing.finalPrice,
      rule.countryCode,
      'hotel'
    );

    return { pricing, taxResult };
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

  const getCountryData = (countryCode: string) => {
    return availableCountries.find(c => c.code === countryCode);
  };

  const getTaxConfig = (countryCode: string) => {
    return taxConfigs.find(c => c.countryCode === countryCode && c.isActive);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            Enhanced Country Pricing
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage markup rules with tax calculations for each country
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium min-w-fit">Test Amount:</label>
            <Input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value))}
              className="w-24 sm:w-28"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium min-w-fit">Pax:</label>
            <Input
              type="number"
              value={testPax}
              onChange={(e) => setTestPax(Number(e.target.value))}
              className="w-16 sm:w-20"
            />
          </div>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Country Pricing Rules with Tax Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Country</TableHead>
                  <TableHead className="min-w-[100px]">Markup</TableHead>
                  <TableHead className="min-w-[80px]">Tier</TableHead>
                  <TableHead className="min-w-[80px]">Tax Type</TableHead>
                  <TableHead className="min-w-[160px]">Preview (Base: {testAmount.toLocaleString()})</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {settings.countryRules.map((rule) => {
                const countryData = getCountryData(rule.countryCode);
                const taxConfig = getTaxConfig(rule.countryCode);
                const isEditing = editingRule === rule.id;
                const { pricing, taxResult } = calculatePreview(rule);
                
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{rule.countryName}</div>
                          <div className="text-xs text-muted-foreground">
                            {rule.currencySymbol} {rule.currency}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editValues.defaultMarkup || 0}
                            onChange={(e) => setEditValues(prev => ({ 
                              ...prev, 
                              defaultMarkup: Number(e.target.value) 
                            }))}
                            className="w-16"
                          />
                          <Select
                            value={editValues.markupType}
                            onValueChange={(value) => setEditValues(prev => ({ 
                              ...prev, 
                              markupType: value as 'percentage' | 'fixed' 
                            }))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          <span>
                            {rule.markupType === 'percentage' 
                              ? `${rule.defaultMarkup}%` 
                              : `${rule.currencySymbol}${rule.defaultMarkup}`
                            }
                          </span>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editValues.tier}
                          onValueChange={(value) => setEditValues(prev => ({ 
                            ...prev, 
                            tier: value as any 
                          }))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="budget">Budget</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getTierColor(rule.tier)}>
                          {rule.tier}
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {taxConfig ? (
                        <Badge variant="outline">
                          {taxConfig.taxType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">No Tax</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Final: </span>
                          <span className="font-medium">
                            {rule.currencySymbol}{taxResult.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        {taxResult.taxAmount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{rule.currencySymbol}{taxResult.taxAmount.toLocaleString()} tax
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRuleStatus(rule.id)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveEdit}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </div>

          {settings.countryRules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground px-4">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-base font-medium">No country pricing rules found</p>
              <p className="text-sm">Add your first country rule to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPricingTable;
