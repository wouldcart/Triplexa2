
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EyeIcon, EyeOffIcon, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiUsage {
  used: number;
  limit: number;
  resetDate: string;
}

const CurrencyApiConfig: React.FC = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [usage, setUsage] = useState<ApiUsage>({ used: 0, limit: 300, resetDate: '' });

  useEffect(() => {
    // Load saved API key and usage stats
    const savedApiKey = localStorage.getItem('currencyapi_key');
    const savedUsage = localStorage.getItem('currencyapi_usage');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConnected(true);
    }
    
    if (savedUsage) {
      setUsage(JSON.parse(savedUsage));
    } else {
      // Initialize usage tracking
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setUsage({
        used: 0,
        limit: 300,
        resetDate: nextMonth.toISOString()
      });
    }
  }, []);

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Please enter an API key', variant: 'destructive' });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&currencies=THB,INR,AED&base_currency=USD`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setIsConnected(true);
          localStorage.setItem('currencyapi_key', apiKey);
          toast({ 
            title: 'Connection successful!', 
            description: 'CurrencyAPI.com is now connected and ready to use.',
            variant: 'default' 
          });
        } else {
          throw new Error('Invalid response format');
        }
      } else if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('API limit exceeded');
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      setIsConnected(false);
      toast({ 
        title: 'Connection failed', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({ title: 'Please enter an API key', variant: 'destructive' });
      return;
    }
    
    localStorage.setItem('currencyapi_key', apiKey);
    toast({ title: 'API key saved successfully', variant: 'default' });
  };

  const disconnectApi = () => {
    localStorage.removeItem('currencyapi_key');
    setApiKey('');
    setIsConnected(false);
    toast({ title: 'CurrencyAPI disconnected', variant: 'default' });
  };

  const resetUsageStats = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const newUsage = {
      used: 0,
      limit: 300,
      resetDate: nextMonth.toISOString()
    };
    setUsage(newUsage);
    localStorage.setItem('currencyapi_usage', JSON.stringify(newUsage));
    toast({ title: 'Usage statistics reset', variant: 'default' });
  };

  const usagePercentage = (usage.used / usage.limit) * 100;
  const resetDate = new Date(usage.resetDate).toLocaleDateString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              CurrencyAPI.com Integration
              {isConnected ? (
                <Badge variant="default" className="ml-2">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure your CurrencyAPI.com API key for real-time exchange rates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency-api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="currency-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your CurrencyAPI.com API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOffIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
              <Button onClick={testConnection} disabled={isTestingConnection}>
                {isTestingConnection ? 'Testing...' : 'Test'}
              </Button>
              <Button onClick={saveApiKey} variant="outline">
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Get your free API key from <a href="https://currencyapi.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">currencyapi.com</a>
            </p>
          </div>

          {isConnected && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected to CurrencyAPI.com. Real-time rates will be fetched for USD, THB, INR, and AED.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">API Usage Statistics</h3>
            <Button onClick={resetUsageStats} variant="outline" size="sm">
              Reset Stats
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Usage</span>
              <span>{usage.used} / {usage.limit} requests</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Resets on: {resetDate}</span>
              <span className={usagePercentage > 80 ? 'text-red-600' : usagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'}>
                {Math.round(100 - usagePercentage)}% remaining
              </span>
            </div>
          </div>

          {usagePercentage > 80 && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're approaching your monthly API limit. The system will automatically use cached rates to preserve requests.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Supported Currencies */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Supported Currencies</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['USD', 'THB', 'INR', 'AED'].map(currency => (
              <Badge key={currency} variant="outline" className="justify-center">
                {currency}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time rates will be fetched daily for these currencies to optimize API usage.
          </p>
        </div>

        {/* Actions */}
        {isConnected && (
          <div className="flex justify-end">
            <Button onClick={disconnectApi} variant="destructive">
              Disconnect API
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrencyApiConfig;
