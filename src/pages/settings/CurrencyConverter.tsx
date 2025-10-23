import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Info, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import CurrencyCalculator from '@/components/currency/CurrencyCalculator';
import ExchangeRateManager from '@/components/currency/ExchangeRateManager';
import CurrencyApiConfig from '@/components/currency/CurrencyApiConfig';
import { ExchangeRate, CurrencyService } from '@/services/currencyService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyApiService } from '@/services/currencyApiService';
import { CurrencyScheduler } from '@/services/currencyScheduler';
import { formatISTTime, getISTTime } from '@/utils/timezoneUtils';

interface CurrencyConverterSettings {
  baseCurrency: string;
  autoUpdateRates: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  customRates: ExchangeRate[];
  defaultMargin: number;
}

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' }
];

const CurrencyConverter: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CurrencyConverterSettings>({
    baseCurrency: 'USD',
    autoUpdateRates: true,
    updateFrequency: 'daily',
    customRates: CurrencyService.getDefaultRates(),
    defaultMargin: 2.0
  });

  const [newRate, setNewRate] = useState({
    fromCurrency: 'USD',
    toCurrency: '',
    rate: '',
    margin: '',
    additionalSurcharge: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiUsage, setApiUsage] = useState({ used: 0, limit: 300, remaining: 300 });
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState<string>('Not scheduled');
  const [currentISTTime, setCurrentISTTime] = useState<string>('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('currencyConverterSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        ...parsed,
        customRates: parsed.customRates || CurrencyService.getDefaultRates()
      });
    }

    // Check if API key is configured
    const apiKey = CurrencyApiService.getApiKey();
    setIsApiKeyConfigured(!!apiKey);

    // Update API usage stats
    const usage = CurrencyService.getApiUsage();
    setApiUsage({
      used: usage.used,
      limit: usage.limit,
      remaining: Math.max(0, usage.limit - usage.used)
    });

    // Update current IST time every minute
    const updateTime = () => {
      setCurrentISTTime(formatISTTime(getISTTime()));
      setNextRefreshTime(CurrencyScheduler.getNextRefreshTime());
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 60000); // Update every minute

    // Initialize scheduler if auto-update is enabled
    if (settings.autoUpdateRates) {
      CurrencyScheduler.scheduleDaily9AM(() => {
        handleRefreshRates();
      });
    }

    return () => {
      clearInterval(timeInterval);
    };
  }, [settings.autoUpdateRates]);

  const handleAddCustomRate = () => {
    if (!newRate.rate || !newRate.margin) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const additionalSurcharge = parseFloat(newRate.additionalSurcharge) || 0;

    const customRate: ExchangeRate = {
      id: Date.now().toString(),
      from: newRate.fromCurrency,
      to: newRate.toCurrency,
      fromCurrency: newRate.fromCurrency,
      toCurrency: newRate.toCurrency,
      rate: parseFloat(newRate.rate),
      margin: parseFloat(newRate.margin),
      additionalSurcharge: additionalSurcharge > 0 ? additionalSurcharge : undefined,
      isCustom: true,
      isRealTime: false,
      lastUpdated: new Date().toISOString()
    };

    setSettings(prev => ({
      ...prev,
      customRates: [...prev.customRates, customRate]
    }));

    setNewRate({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: '',
      margin: '',
      additionalSurcharge: ''
    });

    toast({ title: 'Custom rate added successfully', variant: 'default' });
  };

  const handleUpdateRates = (updatedRates: ExchangeRate[]) => {
    setSettings(prev => ({
      ...prev,
      customRates: updatedRates
    }));
  };

  const handleRefreshRates = async () => {
    if (apiUsage.remaining < 5) {
      toast({ 
        title: 'API limit nearly reached', 
        description: 'Cannot refresh rates to preserve remaining API requests',
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);
    try {
      // Try to fetch all rates at once to minimize API calls
      const { rates: allRates, isRealTime } = await CurrencyService.fetchAllRealTimeRates();
      
      const updatedRates = settings.customRates.map((rate) => {
        if (!rate.isFixed) {
          const rateKey = `${rate.fromCurrency}_${rate.toCurrency}`;
          const newRate = allRates[rateKey] || rate.rate;
          
          return {
            ...rate,
            rate: newRate,
            isRealTime,
            lastUpdated: new Date().toISOString()
          };
        }
        return {
          ...rate,
          lastUpdated: new Date().toISOString()
        };
      });
      
      setSettings(prev => ({
        ...prev,
        customRates: updatedRates
      }));

      // Update usage stats
      const newUsage = CurrencyService.getApiUsage();
      setApiUsage({
        used: newUsage.used,
        limit: newUsage.limit,
        remaining: Math.max(0, newUsage.limit - newUsage.used)
      });
      
      const realTimeCount = updatedRates.filter(r => r.isRealTime).length;
      const mockCount = updatedRates.length - realTimeCount;
      
      toast({ 
        title: 'Exchange rates updated successfully', 
        description: `${realTimeCount} live rates, ${mockCount} mock/fixed rates. ${apiUsage.remaining - 1} API requests remaining.`,
        variant: 'default' 
      });
    } catch (error) {
      toast({ 
        title: 'Failed to update exchange rates', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('currencyConverterSettings', JSON.stringify(settings));
    
    // Update scheduler based on auto-update setting
    if (settings.autoUpdateRates) {
      CurrencyScheduler.scheduleDaily9AM(() => {
        handleRefreshRates();
      });
      toast({ 
        title: 'Settings saved successfully', 
        description: `Auto-refresh scheduled for 9:00 AM IST daily. Next refresh: ${CurrencyScheduler.getNextRefreshTime()}`,
        variant: 'default' 
      });
    } else {
      CurrencyScheduler.clearSchedule();
      toast({ title: 'Settings saved successfully', variant: 'default' });
    }
  };

  const isThbToInr = newRate.fromCurrency === 'THB' && newRate.toCurrency === 'INR';

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Currency Converter</h1>
          <p className="text-muted-foreground">
            Manage exchange rates and conversion settings. Configure your API key below for real-time rates.
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium">Current IST Time:</span> {currentISTTime}
          </div>
        </div>

        {/* API Configuration Status */}
        {!isApiKeyConfigured && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Key Required:</strong> Configure your CurrencyAPI.com API key below to get real-time exchange rates. 
              Without it, you'll only have access to mock rates with simulated fluctuations.
            </AlertDescription>
          </Alert>
        )}

        {isApiKeyConfigured && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Connected:</strong> Real-time rates are enabled. 
              {apiUsage.remaining < 50 && ` Warning: Only ${apiUsage.remaining} API requests remaining this month.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-refresh Schedule Status */}
        {settings.autoUpdateRates && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Auto-refresh Active:</strong> Exchange rates will automatically refresh daily at 9:00 AM IST.
              <br />
              <span className="text-sm">Next scheduled refresh: {nextRefreshTime}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* API Configuration */}
        <CurrencyApiConfig />

        {/* API Usage Alert */}
        {apiUsage.remaining < 50 && isApiKeyConfigured && (
          <Alert variant={apiUsage.remaining < 10 ? "destructive" : "warning"}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              API Usage: {apiUsage.used}/{apiUsage.limit} requests used. {apiUsage.remaining} requests remaining this month.
              {apiUsage.remaining < 10 && " System will use cached rates to preserve remaining requests."}
            </AlertDescription>
          </Alert>
        )}

        {/* Currency Calculator */}
        <CurrencyCalculator 
          rates={settings.customRates}
          currencies={currencies}
        />

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure base currency and automatic update preferences. Auto-refresh runs daily at 9:00 AM IST.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseCurrency">Base Currency</Label>
                <Select
                  value={settings.baseCurrency}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, baseCurrency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMargin">Default Margin (%)</Label>
                <Input
                  id="defaultMargin"
                  type="number"
                  step="0.1"
                  value={settings.defaultMargin}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultMargin: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-update Rates</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh exchange rates daily at 9:00 AM IST using live APIs
                </p>
              </div>
              <Switch
                checked={settings.autoUpdateRates}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoUpdateRates: checked }))}
              />
            </div>

            {settings.autoUpdateRates && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-green-600">✓ Scheduled Refresh Active</p>
                  <p className="text-muted-foreground mt-1">
                    Daily automatic refresh at 9:00 AM IST (India Standard Time)
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Next refresh: {nextRefreshTime}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Rate Manager */}
        <ExchangeRateManager
          rates={settings.customRates}
          onUpdateRates={handleUpdateRates}
          isLoading={isLoading}
          onRefreshRates={handleRefreshRates}
        />

        {/* Add Custom Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Add Custom Rate</CardTitle>
            <CardDescription>
              Add a custom exchange rate with your preferred margin and optional surcharge. Custom rates can be updated to real-time later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isThbToInr && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  For THB to INR conversion, you can add an additional surcharge (e.g., 0.18 Paise per THB) on top of the margin.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>From Currency</Label>
                <Select
                  value={newRate.fromCurrency}
                  onValueChange={(value) => setNewRate(prev => ({ ...prev, fromCurrency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Currency</Label>
                <Select
                  value={newRate.toCurrency}
                  onValueChange={(value) => setNewRate(prev => ({ ...prev, toCurrency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exchange Rate</Label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="1.2345"
                  value={newRate.rate}
                  onChange={(e) => setNewRate(prev => ({ ...prev, rate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Margin (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="2.5"
                  value={newRate.margin}
                  onChange={(e) => setNewRate(prev => ({ ...prev, margin: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Surcharge (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.18"
                  value={newRate.additionalSurcharge}
                  onChange={(e) => setNewRate(prev => ({ ...prev, additionalSurcharge: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Fixed amount added per unit (e.g., 0.18 Paise per THB)
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleAddCustomRate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default CurrencyConverter;
