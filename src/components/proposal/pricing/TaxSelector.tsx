import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Shield, Info } from 'lucide-react';
import { TaxCalculationService } from '@/services/taxCalculationService';

interface TaxResult {
  baseAmount: number;
  taxAmount: number;
  tdsAmount?: number;
  totalAmount: number;
  taxType: string;
  taxRate: number;
  isInclusive: boolean;
}

interface TaxSelectorProps {
  baseAmount: number;
  countryCode: string;
  onTaxChange: (taxResult: TaxResult) => void;
  formatCurrency: (amount: number) => string;
}

export const TaxSelector: React.FC<TaxSelectorProps> = ({
  baseAmount,
  countryCode,
  onTaxChange,
  formatCurrency
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [serviceType, setServiceType] = useState('all');
  const [isInclusive, setIsInclusive] = useState(false);

  const taxConfigs = TaxCalculationService.getTaxConfigurations();
  const currentConfig = taxConfigs.find(config => 
    config.countryCode === countryCode && config.isActive
  );

  const calculateTax = () => {
    if (!isEnabled || !currentConfig) {
      onTaxChange({
        baseAmount,
        taxAmount: 0,
        totalAmount: baseAmount,
        taxType: 'None',
        taxRate: 0,
        isInclusive: false
      });
      return;
    }

    const calculation = TaxCalculationService.calculateTax(
      baseAmount,
      countryCode,
      serviceType,
      isInclusive
    );

    const taxBreakdown = calculation.taxBreakdown[0];
    if (taxBreakdown) {
      onTaxChange({
        baseAmount: calculation.baseAmount,
        taxAmount: calculation.taxAmount,
        tdsAmount: calculation.tdsAmount,
        totalAmount: calculation.totalAmount,
        taxType: taxBreakdown.type,
        taxRate: taxBreakdown.rate,
        isInclusive
      });
    }
  };

  useEffect(() => {
    calculateTax();
  }, [baseAmount, isEnabled, serviceType, isInclusive, countryCode]);

  if (!currentConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Tax Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              No tax configuration available for {countryCode}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableServiceTypes = currentConfig.taxRates.map(rate => ({
    value: rate.serviceType,
    label: rate.description
  }));

  const currentTaxRate = currentConfig.taxRates.find(
    rate => rate.serviceType === serviceType || rate.serviceType === 'all'
  );

  const taxCalculation = isEnabled && currentTaxRate ? 
    TaxCalculationService.calculateTax(baseAmount, countryCode, serviceType, isInclusive) :
    null;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-medium mb-2">Tax Configuration</h4>
        <p className="text-sm text-muted-foreground">
          Configure tax settings based on country-specific regulations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {currentConfig.taxType} Settings - {countryCode}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable Tax */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tax-enabled">Enable Tax Calculation</Label>
              <p className="text-sm text-muted-foreground">
                Apply {currentConfig.taxType} to the base amount
              </p>
            </div>
            <Switch
              id="tax-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {isEnabled && (
            <>
              {/* Service Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServiceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tax Inclusive/Exclusive */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tax-inclusive">Tax Inclusive</Label>
                  <p className="text-sm text-muted-foreground">
                    Calculate tax as included in the amount
                  </p>
                </div>
                <Switch
                  id="tax-inclusive"
                  checked={isInclusive}
                  onCheckedChange={setIsInclusive}
                />
              </div>

              {/* Tax Rate Display */}
              {currentTaxRate && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Tax Rate</span>
                    <Badge variant="outline">
                      {currentTaxRate.rate}% {currentConfig.taxType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentTaxRate.description}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Tax Calculation Summary */}
      {taxCalculation && isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Tax Calculation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">
                  {isInclusive ? 'Amount (Tax Inclusive)' : 'Base Amount'}:
                </span>
                <span className="font-medium">
                  {formatCurrency(isInclusive ? baseAmount : taxCalculation.baseAmount)}
                </span>
              </div>
              
              {!isInclusive && (
                <div className="flex justify-between">
                  <span className="text-sm">Taxable Amount:</span>
                  <span className="font-medium">{formatCurrency(taxCalculation.baseAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm">
                  {currentConfig.taxType} ({currentTaxRate?.rate}%):
                </span>
                <span className="font-medium text-primary">
                  {formatCurrency(taxCalculation.taxAmount)}
                </span>
              </div>

              {taxCalculation.tdsAmount && (
                <div className="flex justify-between">
                  <span className="text-sm">TDS (2%):</span>
                  <span className="font-medium text-orange-600">
                    -{formatCurrency(taxCalculation.tdsAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex justify-between font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    {formatCurrency(taxCalculation.totalAmount)}
                  </span>
                </div>
              </div>

              {currentConfig.tdsConfiguration?.isApplicable && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>TDS Note:</strong> Tax Deducted at Source applies to amounts above{' '}
                    {formatCurrency(currentConfig.tdsConfiguration.threshold)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};