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
import { getActiveTable as getActiveTaxTable } from '@/integrations/supabase/services/taxConfigurationService';
// Countries are loaded indirectly via TaxCalculationService using Supabase; no local list import
import { FileText, Calculator, Globe, Percent, Plus, Trash2, Settings } from 'lucide-react';
import CountriesCrudSection from '@/components/pricing/CountriesCrudSection';
import { CountriesService } from '@/services/countriesService';

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
  const [activeTaxTable, setActiveTaxTable] = useState<string>('');
  const [activityLog, setActivityLog] = useState<Array<{ ts: string; msg: string }>>([]);
  const { toast } = useToast();
  const [supabaseCountriesCount, setSupabaseCountriesCount] = useState<number>(0);
  const [supabaseInitOk, setSupabaseInitOk] = useState<boolean>(false);
  const [supabaseInitTs, setSupabaseInitTs] = useState<string | null>(null);

  useEffect(() => {
    // Initialize configurations from Supabase (fallbacks handled internally)
    (async () => {
      TaxCalculationService.initializeDefaultConfigurations();
      await TaxCalculationService.initializeFromSupabase();
      setSupabaseInitOk(TaxCalculationService.isInitializedFromSupabase());
      setSupabaseInitTs(new Date().toLocaleTimeString());
      setSelectedCountry(TaxCalculationService.getDefaultCountry());
      loadTaxConfigurations();
      try {
        const tbl = await getActiveTaxTable();
        setActiveTaxTable(tbl);
      } catch {
        setActiveTaxTable('tax_configurations');
      }
      try {
        const res = await CountriesService.getAllCountries();
        setSupabaseCountriesCount((res.data ?? []).length);
      } catch {
        setSupabaseCountriesCount(0);
      }
      logActivity(
        `Initialized: ${TaxCalculationService.isInitializedFromSupabase() ? 'Supabase' : 'Defaults'}; Table: ${activeTaxTable || 'detecting...'}; TS: ${supabaseInitTs || ''}`
      );
    })();
  }, []);

  const loadTaxConfigurations = () => {
    const configs = TaxCalculationService.getTaxConfigurations();
    setTaxConfigurations(configs);
  };

  const updateTaxConfiguration = async (config: TaxConfiguration) => {
    setIsLoading(true);
    await TaxCalculationService.updateTaxConfiguration(config);
    loadTaxConfigurations();
    setIsLoading(false);
    onTaxUpdate?.(config);
    toast({
      title: "Tax Configuration Updated",
      description: `Tax settings for ${config.countryCode} have been saved.`
    });
    logActivity(`Saved configuration for ${config.countryCode} (${config.taxRates.length} rates)`);
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
    const r = updatedRates[rateIndex];
    logActivity(`Updated rate [${r.serviceType}] field '${String(field)}' → ${value}`);
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
    logActivity('Added new tax rate');
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
    logActivity(`Removed tax rate at index ${rateIndex}`);
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
    logActivity(`TDS updated: '${field}' → ${value}`);
  };

  const selectedConfig = getSelectedConfig();

  const logActivity = (msg: string) => {
    setActivityLog(prev => {
      const next = [{ ts: new Date().toLocaleTimeString(), msg }, ...prev];
      return next.slice(0, 4);
    });
  };

  const updateTaxType = (newType: TaxConfiguration['taxType']) => {
    const config = getSelectedConfig();
    if (!config) return;
    const updatedConfig: TaxConfiguration = {
      ...config,
      taxType: newType,
      updatedAt: new Date().toISOString()
    };
    updateTaxConfiguration(updatedConfig);
    logActivity(`Tax type set to ${newType}`);
  };

  const getDefaultRate = (): number => {
    const config = getSelectedConfig();
    if (!config) return 0;
    const def = config.taxRates.find(r => r.isDefault || r.serviceType === 'all');
    return def ? Number(def.rate) : 0;
  };

  const updateDefaultRate = (value: number) => {
    const config = getSelectedConfig();
    if (!config) return;
    const index = config.taxRates.findIndex(r => r.isDefault || r.serviceType === 'all');
    let updatedRates = [...config.taxRates];
    if (index !== -1) {
      updatedRates[index] = { ...updatedRates[index], rate: value, isDefault: true, serviceType: updatedRates[index].serviceType };
    } else {
      updatedRates.push({
        id: `default-${Date.now()}`,
        serviceType: 'all',
        rate: value,
        description: `${config.taxType} Default`,
        isDefault: true
      });
    }
    const updatedConfig: TaxConfiguration = {
      ...config,
      taxRates: updatedRates,
      updatedAt: new Date().toISOString()
    };
    updateTaxConfiguration(updatedConfig);
    logActivity(`Default tax rate set to ${value}%`);
  };

  const toggleTDSAvailability = (checked: boolean) => {
    const config = getSelectedConfig();
    if (!config) return;
    const nextTds = {
      isApplicable: checked,
      rate: config.tdsConfiguration?.rate ?? 0,
      threshold: config.tdsConfiguration?.threshold ?? 0,
      exemptionLimit: config.tdsConfiguration?.exemptionLimit ?? 0,
      companyRegistration: config.tdsConfiguration?.companyRegistration
    };
    const updatedConfig: TaxConfiguration = {
      ...config,
      tdsConfiguration: nextTds,
      updatedAt: new Date().toISOString()
    };
    updateTaxConfiguration(updatedConfig);
    logActivity(`TDS ${checked ? 'enabled' : 'disabled'}`);
  };

  const refreshCountriesCount = async () => {
    const res = await CountriesService.getAllCountries();
    setSupabaseCountriesCount((res.data ?? []).length);
    // Refresh country name map inside tax service so dropdown labels stay accurate
    try {
      await TaxCalculationService.initializeFromSupabase();
      loadTaxConfigurations();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Tax Configuration Management
            <Badge variant={supabaseInitOk ? 'success' : 'secondary'} className="ml-2 text-xs">
              {supabaseInitOk ? `Supabase OK ${supabaseInitTs ?? ''}` : 'Supabase Fallback'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-detection and Default Country Info */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  {(() => {
                    const code = TaxCalculationService.getDefaultCountry();
                    const name = TaxCalculationService.getAvailableCountries().find(c => c.code === code)?.name || code;
                    return `Default: ${name} (${code})`;
                  })()}
                </Badge>
                <Badge variant="outline">{supabaseCountriesCount} Countries Configured</Badge>
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
              <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); logActivity(`Country selected: ${val}`); }}>
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
                    onCheckedChange={(checked) => {
                      updateTaxConfiguration({
                        ...selectedConfig,
                        isActive: checked,
                        updatedAt: new Date().toISOString()
                      });
                      logActivity(`Tax status: ${checked ? 'Active' : 'Inactive'}`);
                    }}
                  />
                  <Badge variant={selectedConfig.isActive ? "default" : "secondary"}>
                    {selectedConfig.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Selection Tracker */}
          {selectedConfig && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Selection</div>
                  <div className="text-muted-foreground">{selectedCountry}</div>
                </div>
                <div>
                  <div className="font-medium">Source</div>
                  <div className="text-muted-foreground">Supabase</div>
                </div>
                <div>
                  <div className="font-medium">Active Table</div>
                  <div className="text-muted-foreground">{`public.${activeTaxTable || 'tax_configurations'}`}</div>
                </div>
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-muted-foreground">src/integrations/supabase/services/taxConfigurationService.ts</div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Rates</div>
                  <div className="text-muted-foreground">{selectedConfig.taxRates.length}</div>
                </div>
                <div>
                  <div className="font-medium">TDS Applicable</div>
                  <div className="text-muted-foreground">{selectedConfig.tdsConfiguration?.isApplicable ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Recent activity logs */}
              <Separator className="my-3" />
              <div>
                <div className="font-medium">Recent Changes</div>
                {activityLog.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No recent changes.</div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {activityLog.map((l, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{l.msg}</span>
                        <span className="text-muted-foreground">{l.ts}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Countries CRUD (Supabase-backed) */}
      <CountriesCrudSection onDataChanged={refreshCountriesCount} />

      {selectedConfig && (
        <>
          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tax Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tax Type</Label>
                  <Select value={selectedConfig.taxType} onValueChange={(val) => updateTaxType(val as TaxConfiguration['taxType'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="VAT">VAT</SelectItem>
                      <SelectItem value="SALES_TAX">Sales Tax</SelectItem>
                      <SelectItem value="NONE">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Rate (%)</Label>
                  <Input
                    type="number"
                    value={getDefaultRate()}
                    onChange={(e) => updateDefaultRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable TDS</Label>
                  <Switch
                    checked={!!selectedConfig.tdsConfiguration?.isApplicable}
                    onCheckedChange={toggleTDSAvailability}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* TDS Configuration */}
          {selectedConfig.tdsConfiguration && (
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