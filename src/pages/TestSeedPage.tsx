import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { seedCountries } from '@/scripts/seedCountries';
import { CountriesService } from '@/services/countriesService';

export default function TestSeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);
    
    try {
      const seedResult = await seedCountries();
      setResult(seedResult);
      
      // Fetch countries after seeding
      const countriesResult = await CountriesService.getAllCountries();
      if (countriesResult.success) {
        setCountries(countriesResult.data || []);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleFetchCountries = async () => {
    try {
      const countriesResult = await CountriesService.getAllCountries();
      if (countriesResult.success) {
        setCountries(countriesResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Seeding Test</CardTitle>
          <CardDescription>
            Test the countries seeding functionality and check database contents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleSeed} 
              disabled={isSeeding}
              variant="default"
            >
              {isSeeding ? 'Seeding...' : 'Seed Countries'}
            </Button>
            
            <Button 
              onClick={handleFetchCountries} 
              variant="outline"
            >
              Fetch Countries
            </Button>
          </div>

          {result && (
            <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
              <CardHeader>
                <CardTitle className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.success ? '✅ Success' : '❌ Error'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{result.message}</p>
                {result.data && (
                  <p className="text-sm text-gray-600 mt-2">
                    Data count: {Array.isArray(result.data) ? result.data.length : 'N/A'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Current Countries in Database</CardTitle>
              <CardDescription>
                Total: {countries.length} countries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {countries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {countries.map((country, index) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      <div className="font-medium">{country.name}</div>
                      <div className="text-gray-600">{country.code} - {country.currency}</div>
                      <div className="text-xs text-gray-500">{country.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No countries found in database.</p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}