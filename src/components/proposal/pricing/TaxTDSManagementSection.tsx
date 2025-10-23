
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, Receipt, AlertCircle } from 'lucide-react';

interface TaxConfiguration {
  countryCode: string;
  taxType: 'GST' | 'VAT' | 'SALES_TAX';
  serviceRates: {
    transport: number;
    hotel: number;
    sightseeing: number;
    restaurant: number;
    activity: number;
  };
  tdsConfig: {
    isApplicable: boolean;
    rate: number;
    threshold: number;
    exemptionLimit: number;
  };
}

interface TaxBreakdown {
  baseAmount: number;
  taxType: string;
  taxRate: number;
  taxAmount: number;
  tdsAmount: number;
  totalWithTax: number;
  serviceBreakdown: Array<{
    service: string;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }>;
}

interface TaxTDSManagementSectionProps {
  baseAmount: number;
  currency: string;
  countryCode: string;
  serviceBreakdown?: Array<{ service: string; amount: number }>;
  onTaxUpdate: (taxBreakdown: TaxBreakdown) => void;
}

export const TaxTDSManagementSection: React.FC<TaxTDSManagementSectionProps> = ({
  baseAmount,
  currency,
  countryCode,
  serviceBreakdown = [],
  onTaxUpdate
}) => {
  const [taxConfig, setTaxConfig] = useState<TaxConfiguration>({
    countryCode,
    taxType: countryCode === 'IN' ? 'GST' : 'VAT',
    serviceRates: {
      transport: countryCode === 'IN' ? 5 : 5,
      hotel: countryCode === 'IN' ? 12 : 5,
      sightseeing: countryCode === 'IN' ? 18 : 5,
      restaurant: countryCode === 'IN' ? 18 : 5,
      activity: countryCode === 'IN' ? 18 : 5
    },
    tdsConfig: {
      isApplicable: countryCode === 'IN',
      rate: 2,
      threshold: 50000,
      exemptionLimit: 10000
    }
  });

  const [isInclusive, setIsInclusive] = useState(false);
  const [customTaxRate, setCustomTaxRate] = useState(0);
  const [useCustomRate, setUseCustomRate] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTaxBreakdown = (): TaxBreakdown => {
    let totalTaxAmount = 0;
    const serviceBreakdownWithTax = [];

    if (serviceBreakdown.length > 0) {
      // Calculate tax for each service
      for (const service of serviceBreakdown) {
        const serviceType = service.service.toLowerCase() as keyof typeof taxConfig.serviceRates;
        const taxRate = useCustomRate ? customTaxRate : (taxConfig.serviceRates[serviceType] || taxConfig.serviceRates.activity);
        
        let taxableAmount = service.amount;
        let taxAmount = 0;

        if (isInclusive) {
          taxableAmount = service.amount / (1 + taxRate / 100);
          taxAmount = service.amount - taxableAmount;
        } else {
          taxAmount = (service.amount * taxRate) / 100;
        }

        totalTaxAmount += taxAmount;
        serviceBreakdownWithTax.push({
          service: service.service,
          amount: service.amount,
          taxRate,
          taxAmount
        });
      }
    } else {
      // Calculate tax on total amount
      const effectiveRate = useCustomRate ? customTaxRate : 12; // Default rate
      let taxableAmount = baseAmount;
      let taxAmount = 0;

      if (isInclusive) {
        taxableAmount = baseAmount / (1 + effectiveRate / 100);
        taxAmount = baseAmount - taxableAmount;
      } else {
        taxAmount = (baseAmount * effectiveRate) / 100;
      }

      totalTaxAmount = taxAmount;
      serviceBreakdownWithTax.push({
        service: 'Total Package',
        amount: baseAmount,
        taxRate: effectiveRate,
        taxAmount
      });
    }

    // Calculate TDS
    let tdsAmount = 0;
    if (taxConfig.tdsConfig.isApplicable && baseAmount >= taxConfig.tdsConfig.threshold) {
      tdsAmount = (baseAmount * taxConfig.tdsConfig.rate) / 100;
    }

    const totalWithTax = isInclusive ? baseAmount : baseAmount + totalTaxAmount;

    const breakdown: TaxBreakdown = {
      baseAmount: isInclusive ? baseAmount - totalTaxAmount : baseAmount,
      taxType: taxConfig.taxType,
      taxRate: useCustomRate ? customTaxRate : 0,
      taxAmount: totalTaxAmount,
      tdsAmount,
      totalWithTax,
      serviceBreakdown: serviceBreakdownWithTax
    };

    return breakdown;
  };

  const taxBreakdown = calculateTaxBreakdown();

  React.useEffect(() => {
    onTaxUpdate(taxBreakdown);
  }, [taxConfig, isInclusive, customTaxRate, useCustomRate, baseAmount]);

  const updateServiceRate = (service: keyof typeof taxConfig.serviceRates, rate: number) => {
    setTaxConfig(prev => ({
      ...prev,
      serviceRates: {
        ...prev.serviceRates,
        [service]: rate
      }
    }));
  };

  const updateTDSConfig = (updates: Partial<typeof taxConfig.tdsConfig>) => {
    setTaxConfig(prev => ({
      ...prev,
      tdsConfig: {
        ...prev.tdsConfig,
        ...updates
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Tax & TDS Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="tax-config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tax-config">Tax Configuration</TabsTrigger>
            <TabsTrigger value="tds-config">TDS Settings</TabsTrigger>
            <TabsTrigger value="summary">Tax Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="tax-config" className="space-y-4">
            {/* Tax Type and Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tax Type</Label>
                <Select
                  value={taxConfig.taxType}
                  onValueChange={(value: 'GST' | 'VAT' | 'SALES_TAX') => 
                    setTaxConfig(prev => ({ ...prev, taxType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GST">GST (India)</SelectItem>
                    <SelectItem value="VAT">VAT (UAE/Singapore)</SelectItem>
                    <SelectItem value="SALES_TAX">Sales Tax (Thailand)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Tax Inclusive Pricing</Label>
                  <p className="text-xs text-muted-foreground">
                    Prices include tax
                  </p>
                </div>
                <Switch
                  checked={isInclusive}
                  onCheckedChange={setIsInclusive}
                />
              </div>
            </div>

            {/* Custom Tax Rate Option */}
            <div className="p-3 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Use Custom Tax Rate</Label>
                <Switch
                  checked={useCustomRate}
                  onCheckedChange={setUseCustomRate}
                />
              </div>
              
              {useCustomRate && (
                <div>
                  <Label htmlFor="custom-rate">Custom Rate (%)</Label>
                  <Input
                    id="custom-rate"
                    type="number"
                    value={customTaxRate}
                    onChange={(e) => setCustomTaxRate(Number(e.target.value))}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
              )}
            </div>

            {/* Service-wise Tax Rates */}
            {!useCustomRate && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Service-wise Tax Rates (%)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(taxConfig.serviceRates).map(([service, rate]) => (
                    <div key={service} className="flex items-center justify-between p-2 border rounded">
                      <span className="capitalize text-sm">{service}</span>
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => updateServiceRate(service as keyof typeof taxConfig.serviceRates, Number(e.target.value))}
                        className="w-20 h-8"
                        min="0"
                        max="50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tds-config" className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Enable TDS (Tax Deducted at Source)</Label>
                <p className="text-xs text-muted-foreground">
                  Applicable for Indian transactions above threshold
                </p>
              </div>
              <Switch
                checked={taxConfig.tdsConfig.isApplicable}
                onCheckedChange={(checked) => updateTDSConfig({ isApplicable: checked })}
              />
            </div>

            {taxConfig.tdsConfig.isApplicable && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tds-rate">TDS Rate (%)</Label>
                    <Input
                      id="tds-rate"
                      type="number"
                      value={taxConfig.tdsConfig.rate}
                      onChange={(e) => updateTDSConfig({ rate: Number(e.target.value) })}
                      min="0"
                      max="10"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tds-threshold">Threshold Amount</Label>
                    <Input
                      id="tds-threshold"
                      type="number"
                      value={taxConfig.tdsConfig.threshold}
                      onChange={(e) => updateTDSConfig({ threshold: Number(e.target.value) })}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tds-exemption">Exemption Limit</Label>
                    <Input
                      id="tds-exemption"
                      type="number"
                      value={taxConfig.tdsConfig.exemptionLimit}
                      onChange={(e) => updateTDSConfig({ exemptionLimit: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>

                {baseAmount >= taxConfig.tdsConfig.threshold && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">TDS Applicable</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Amount exceeds threshold. TDS will be calculated at {taxConfig.tdsConfig.rate}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {/* Tax Calculation Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Tax Calculation Summary</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Amount:</span>
                    <span className="font-medium">{formatCurrency(taxBreakdown.baseAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>{taxConfig.taxType} ({isInclusive ? 'Inclusive' : 'Exclusive'}):</span>
                    <span className="font-medium text-blue-600">
                      {isInclusive ? 'Included' : `+${formatCurrency(taxBreakdown.taxAmount)}`}
                    </span>
                  </div>
                  
                  {taxBreakdown.tdsAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>TDS ({taxConfig.tdsConfig.rate}%):</span>
                      <span className="font-medium text-orange-600">-{formatCurrency(taxBreakdown.tdsAmount)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-lg">{formatCurrency(taxBreakdown.totalWithTax)}</span>
                  </div>
                  
                  {taxBreakdown.tdsAmount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Amount After TDS:</span>
                      <span>{formatCurrency(taxBreakdown.totalWithTax - taxBreakdown.tdsAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service-wise Breakdown */}
              {taxBreakdown.serviceBreakdown.length > 1 && (
                <div>
                  <Label className="text-base font-medium">Service-wise Tax Breakdown</Label>
                  <div className="mt-2 space-y-2">
                    {taxBreakdown.serviceBreakdown.map((service, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                        <div>
                          <span className="font-medium">{service.service}</span>
                          <span className="text-muted-foreground ml-2">({service.taxRate}%)</span>
                        </div>
                        <div className="text-right">
                          <div>{formatCurrency(service.amount)}</div>
                          <div className="text-xs text-blue-600">+{formatCurrency(service.taxAmount)} tax</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
