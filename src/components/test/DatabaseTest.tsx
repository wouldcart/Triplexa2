import React, { useState, useEffect } from 'react';
import { CountriesService } from '@/services/countriesService';
import { seedCountries } from '@/scripts/seedCountries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const DatabaseTest: React.FC = () => {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const { toast } = useToast();

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await CountriesService.getAllCountries();
      if (result.success) {
        setConnectionStatus('connected');
        setCountries(result.data || []);
        toast({
          title: "Database Connected",
          description: `Successfully loaded ${result.data?.length || 0} countries from database`,
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Database Error",
          description: result.error || "Failed to connect to database",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Failed to test database connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const result = await seedCountries();
      if (result.success) {
        toast({
          title: "Seeding Successful",
          description: result.message,
        });
        // Refresh the countries list
        await testConnection();
      } else {
        toast({
          title: "Seeding Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Seeding Error",
        description: "Failed to seed database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testCreateCountry = async () => {
    setLoading(true);
    try {
      const testCountry = {
        name: "Test Country",
        code: "TC",
        region: "Test Region",
        continent: "Test Continent",
        currency: "TTC",
        currency_symbol: "T$",
        status: "active" as const,
        flag_url: null,
        is_popular: false,
        visa_required: false,
        languages: ["Test Language"],
        pricing_currency_override: false,
        pricing_currency: null,
        pricing_currency_symbol: null,
      };

      const result = await CountriesService.createCountry(testCountry);
      if (result.success) {
        toast({
          title: "Create Test Successful",
          description: "Test country created successfully",
        });
        await testConnection(); // Refresh list
      } else {
        toast({
          title: "Create Test Failed",
          description: result.error || "Failed to create test country",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Create Test Error",
        description: "Failed to test country creation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <CardDescription>
            Test Supabase database connectivity and CRUD operations for countries table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span>Connection Status:</span>
            <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Unknown'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button onClick={handleSeedData} disabled={loading} variant="outline">
              Seed Sample Data
            </Button>
            <Button onClick={testCreateCountry} disabled={loading} variant="outline">
              Test Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Countries Data ({countries.length})</CardTitle>
          <CardDescription>
            Data loaded from Supabase countries table
          </CardDescription>
        </CardHeader>
        <CardContent>
          {countries.length === 0 ? (
            <p className="text-muted-foreground">No countries found in database</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countries.slice(0, 9).map((country) => (
                <div key={country.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{country.name}</span>
                    <Badge variant={country.status === 'active' ? 'default' : 'secondary'}>
                      {country.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Code: {country.code}</div>
                    <div>Region: {country.region}</div>
                    <div>Currency: {country.currency} ({country.currency_symbol})</div>
                  </div>
                </div>
              ))}
              {countries.length > 9 && (
                <div className="border rounded-lg p-3 flex items-center justify-center text-muted-foreground">
                  +{countries.length - 9} more countries...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;