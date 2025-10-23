import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { TaxConfiguration, TaxRate } from '@/types/taxManagement';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { FileText, Calculator, Globe, Percent, Plus, Trash2, Settings } from 'lucide-react';

// Service types from inventory sections
const SERVICE_TYPES = [
  { value: 'all', label: 'All Services' },
  { value: 'transport', label: 'Transport' },
  { value: 'hotel', label: 'Hotel & Accommodation' },
  { value: 'restaurant', label: 'Restaurant & Dining' },
  { value: 'sightseeing', label: 'Sightseeing & Tours' },
  { value: 'activity', label: 'Activities & Entertainment' }
] as const;

interface TaxManagementProps {
  onTaxUpdate?: (taxSettings: any) => void;
}

const TaxManagement: React.FC<TaxManagementProps> = ({ onTaxUpdate }) => {
  const [taxConfigurations, setTaxConfigurations] = useState<TaxConfiguration[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(TaxCalculationService.getDefaultCountry());
  const [isLoading, setIsLoading] = useState(false);
  const [autoDetectCountry, setAutoDetectCountry] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize default configurations and load existing ones
    TaxCalculationService.initializeDefaultConfigurations();
    loadTaxConfigurations();
  }, []);

  const loadTaxConfigurations = () => {
    const configs = TaxCalculationService.getTaxConfigurations();
    setTaxConfigurations(configs);
  };

  const updateTaxConfiguration = (config: TaxConfiguration) => {
    TaxCalculationService.updateTaxConfiguration(config);
    loadTaxConfigurations();
    onTaxUpdate?.(config);
    
    toast({
      title: "Tax Configuration Updated",
      description: `Tax settings for ${config.countryCode} have been saved.`
    });
  };

  const getSelectedConfig = () => {
    return taxConfigurations.find(c => c.countryCode === selectedCountry);
  };

  const handleTaxRateUpdate = (rateIndex: number, field: keyof TaxRate, value: any) => {
    const config = getSelectedConfig();
    if (!config) return;

    const updatedRates = [...config.taxRates];
    updatedRates[rateIndex] = { ...updatedRates[rateIndex], [field]: value };

    const updatedConfig = {
      ...config,
      taxRates: updatedRates,
      updatedAt: new Date().toISOString()
    };

    updateTaxConfiguration(updatedConfig);
  };

  const addNewTaxRate = () => {
    const config = getSelectedConfig();
    if (!config) return;

    const newRate: TaxRate = {
      id: Date.now().toString(),
      serviceType: 'all',
      rate: 0,
      description: 'New Tax Rate',
      isDefault: false
    };

    const updatedConfig = {
      ...config,
      taxRates: [...config.taxRates, newRate],
      updatedAt: new Date().toISOString()
    };

    updateTaxConfiguration(updatedConfig);
  };

  const removeTaxRate = (rateIndex: number) => {
    const config = getSelectedConfig();
    if (!config) return;

    const updatedRates = config.taxRates.filter((_, index) => index !== rateIndex);
    
    const updatedConfig = {
      ...config,
      taxRates: updatedRates,
      updatedAt: new Date().toISOString()
    };

    updateTaxConfiguration(updatedConfig);
  };

  const updateTDSConfiguration = (field: string, value: any) => {
    const config = getSelectedConfig();
    if (!config) return;

    const updatedConfig = {
      ...config,
      tdsConfiguration: {
        ...config.tdsConfiguration,
        [field]: value
      },
      updatedAt: new Date().toISOString()
    };

    updateTaxConfiguration(updatedConfig);
  };

  const selectedConfig = getSelectedConfig();

  return (
    <div className="space-y-6">
      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Tax Configuration Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-detection and Default Country Info */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Default: India (IN)</Badge>
                <Badge variant="outline">{TaxCalculationService.getAvailableCountries().length} Countries Configured</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={autoDetectCountry} 
                  onCheckedChange={setAutoDetectCountry}
                />
                <span className="text-sm">Auto-detect</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {autoDetectCountry 
                ? "Tax configuration will be automatically detected based on currency and location."
                : "Manual country selection is enabled. Auto-detection is disabled."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {TaxCalculationService.getAvailableCountries().map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} - {country.taxType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConfig && (
              <div className="space-y-2">
                <Label>Tax Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedConfig.isActive}
                    onCheckedChange={(checked) => 
                      updateTaxConfiguration({
                        ...selectedConfig,
                        isActive: checked,
                        updatedAt: new Date().toISOString()
                      })
                    }
                  />
                  <Badge variant={selectedConfig.isActive ? "default" : "secondary"}>
                    {selectedConfig.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedConfig && (
        <>
          {/* Tax Rates Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  {selectedConfig.taxType} Rates Configuration
                </span>
                <Button onClick={addNewTaxRate} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {selectedConfig.taxRates.map((rate, index) => (
                  <div key={rate.id} className="p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Service Type</Label>
                        <Select
                          value={rate.serviceType}
                          onValueChange={(value) => handleTaxRateUpdate(index, 'serviceType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map(serviceType => (
                              <SelectItem key={serviceType.value} value={serviceType.value}>
                                {serviceType.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={rate.rate}
                          onChange={(e) => handleTaxRateUpdate(index, 'rate', Number(e.target.value))}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={rate.description}
                          onChange={(e) => handleTaxRateUpdate(index, 'description', e.target.value)}
                          placeholder="Tax description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Actions</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rate.isDefault}
                            onCheckedChange={(checked) => handleTaxRateUpdate(index, 'isDefault', checked)}
                          />
                          <span className="text-xs">Default</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTaxRate(index)}
                            className="ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedConfig.taxRates.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No tax rates configured. Click "Add Rate" to create one.
                </div>
              )}
            </CardContent>
          </Card>

          {/* TDS Configuration for India */}
          {selectedCountry === 'IN' && selectedConfig.tdsConfiguration && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  TDS (Tax Deducted at Source) Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>TDS Applicable</Label>
                    <Switch
                      checked={selectedConfig.tdsConfiguration.isApplicable}
                      onCheckedChange={(checked) => updateTDSConfiguration('isApplicable', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>TDS Rate (%)</Label>
                    <Input
                      type="number"
                      value={selectedConfig.tdsConfiguration.rate}
                      onChange={(e) => updateTDSConfiguration('rate', Number(e.target.value))}
                      min="0"
                      max="30"
                      step="0.1"
                      disabled={!selectedConfig.tdsConfiguration.isApplicable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Threshold Amount (₹)</Label>
                    <Input
                      type="number"
                      value={selectedConfig.tdsConfiguration.threshold}
                      onChange={(e) => updateTDSConfiguration('threshold', Number(e.target.value))}
                      min="0"
                      disabled={!selectedConfig.tdsConfiguration.isApplicable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Exemption Limit (₹)</Label>
                    <Input
                      type="number"
                      value={selectedConfig.tdsConfiguration.exemptionLimit}
                      onChange={(e) => updateTDSConfiguration('exemptionLimit', Number(e.target.value))}
                      min="0"
                      disabled={!selectedConfig.tdsConfiguration.isApplicable}
                    />
                  </div>
                </div>

                <Separator />

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>TDS Information:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>TDS is deducted only when amount exceeds threshold (₹{selectedConfig.tdsConfiguration.threshold?.toLocaleString()})</li>
                      <li>Current TDS rate: {selectedConfig.tdsConfiguration.rate}%</li>
                      <li>TDS is calculated on total amount after GST</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax Preview Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tax Calculation Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaxPreviewCalculator 
                taxConfig={selectedConfig}
                countryCode={selectedCountry}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Tax Preview Calculator Component
interface TaxPreviewCalculatorProps {
  taxConfig: TaxConfiguration;
  countryCode: string;
}

const TaxPreviewCalculator: React.FC<TaxPreviewCalculatorProps> = ({ taxConfig, countryCode }) => {
  const [baseAmount, setBaseAmount] = useState<number>(10000);
  const [serviceType, setServiceType] = useState<string>('all');
  const [isInclusive, setIsInclusive] = useState<boolean>(false);

  const calculation = TaxCalculationService.calculateTax(
    baseAmount,
    countryCode,
    serviceType,
    isInclusive
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Base Amount</Label>
          <Input
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(Number(e.target.value))}
            min="0"
            step="100"
          />
        </div>

        <div className="space-y-2">
          <Label>Service Type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((serviceType) => (
                <SelectItem key={serviceType.value} value={serviceType.value}>
                  {serviceType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tax Inclusive</Label>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={isInclusive} onCheckedChange={setIsInclusive} />
            <span className="text-sm">{isInclusive ? 'Inclusive' : 'Exclusive'}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="font-medium">Calculation Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Amount:</span>
              <span className="font-medium">₹{calculation.baseAmount.toLocaleString()}</span>
            </div>
            
            {calculation.taxBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.type} ({item.rate}%):</span>
                <span className="font-medium">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            
            <Separator />
            <div className="flex justify-between font-medium text-base">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{calculation.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Applied Tax Rules</h4>
          <div className="space-y-2 text-sm">
            {calculation.taxBreakdown.map((item, index) => (
              <div key={index} className="p-2 bg-muted/50 rounded">
                <div className="font-medium">{item.description}</div>
                <div className="text-muted-foreground">{item.type}: {item.rate}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxManagement;