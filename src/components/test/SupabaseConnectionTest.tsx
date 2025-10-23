import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/lib/supabaseClient';
import { CountriesService, type CountryRow } from '@/services/countriesService';
import { CheckCircle, XCircle, Loader2, Database, Globe, Plus, Edit, Trash2, RefreshCw, Play, Eye, RotateCcw } from 'lucide-react';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

interface CrudTest {
  operation: 'create' | 'read' | 'update' | 'delete';
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  duration?: number;
}

const SupabaseConnectionTest: React.FC = () => {
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: 'Supabase Client Connection', status: 'pending', message: 'Testing...' },
    { name: 'Countries Table Access', status: 'pending', message: 'Testing...' },
    { name: 'Countries Service', status: 'pending', message: 'Testing...' },
    { name: 'Database Schema Check', status: 'pending', message: 'Testing...' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  
  // CRUD Testing State
  const [crudTests, setCrudTests] = useState<CrudTest[]>([]);
  const [isCrudRunning, setIsCrudRunning] = useState(false);
  const [testCountryId, setTestCountryId] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  
  // Form data for CRUD operations
  const [formData, setFormData] = useState({
    name: 'Test Country',
    code: 'TC',
    status: 'active' as 'active' | 'inactive',
    description: 'Test country for CRUD operations'
  });

  const updateTest = (index: number, status: 'success' | 'error', message: string, data?: any) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, data } : test
    ));
  };

  const addCrudTest = (operation: CrudTest['operation'], status: CrudTest['status'], message: string, data?: any, duration?: number) => {
    setCrudTests(prev => [...prev, { operation, status, message, data, duration }]);
  };

  const clearCrudTests = () => {
    setCrudTests([]);
    setTestCountryId(null);
  };

  const loadCountries = async () => {
    try {
      const response = await CountriesService.getAllCountries();
      if (response.success && response.data) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', message: 'Testing...' })));

    try {
      // Test 1: Basic Supabase connection
      try {
        const { data, error } = await supabase.from('countries').select('count', { count: 'exact', head: true });
        if (error) throw error;
        updateTest(0, 'success', `Connected successfully. Found ${data?.length || 0} records.`);
      } catch (error) {
        updateTest(0, 'error', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 2: Direct table access
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('id, name, code, status')
          .limit(3);
        
        if (error) throw error;
        updateTest(1, 'success', `Retrieved ${data?.length || 0} countries`, data);
      } catch (error) {
        updateTest(1, 'error', `Table access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 3: Countries Service
      try {
        const response = await CountriesService.getAllCountries();
        if (response.success && response.data) {
          updateTest(2, 'success', `Service working. Retrieved ${response.data.length} countries`, response.data.slice(0, 3));
        } else {
          updateTest(2, 'error', `Service failed: ${response.error || 'Unknown error'}`);
        }
      } catch (error) {
        updateTest(2, 'error', `Service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 4: Schema check
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const sampleRecord = data[0];
          const idType = typeof sampleRecord.id;
          const hasRequiredFields = ['name', 'code', 'status'].every(field => field in sampleRecord);
          
          updateTest(3, 'success', 
            `Schema OK. ID type: ${idType}, Required fields: ${hasRequiredFields ? 'Present' : 'Missing'}`, 
            sampleRecord
          );
        } else {
          updateTest(3, 'error', 'No data found in countries table');
        }
      } catch (error) {
        updateTest(3, 'error', `Schema check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } finally {
      setIsRunning(false);
    }
  };

  const runCrudTests = async () => {
    setIsCrudRunning(true);
    clearCrudTests();
    
    try {
      // Test 1: CREATE - Create a new test country
      const createStart = Date.now();
      try {
        const createData = {
          name: formData.name,
          code: formData.code,
          status: formData.status,
          region: 'Test Region',
          continent: 'Test Continent',
          currency: 'USD',
          currency_symbol: '$',
          flag_url: 'https://example.com/flag.png',
          is_popular: false,
          visa_required: false,
          languages: ['English']
        };
        
        const createResponse = await CountriesService.createCountry(createData);
        const createDuration = Date.now() - createStart;
        
        if (createResponse.success && createResponse.data) {
          setTestCountryId(createResponse.data.id);
          addCrudTest('create', 'success', 
            `Created country with ID: ${createResponse.data.id}`, 
            createResponse.data, createDuration);
        } else {
          addCrudTest('create', 'error', 
            `Create failed: ${createResponse.error}`, null, createDuration);
        }
      } catch (error) {
        const createDuration = Date.now() - createStart;
        addCrudTest('create', 'error', 
          `Create error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          null, createDuration);
      }

      // Test 2: READ - Read the created country
      if (testCountryId) {
        const readStart = Date.now();
        try {
          const readResponse = await CountriesService.getCountryById(testCountryId);
          const readDuration = Date.now() - readStart;
          
          if (readResponse.success && readResponse.data) {
            addCrudTest('read', 'success', 
              `Successfully read country: ${readResponse.data.name}`, 
              readResponse.data, readDuration);
          } else {
            addCrudTest('read', 'error', 
              `Read failed: ${readResponse.error}`, null, readDuration);
          }
        } catch (error) {
          const readDuration = Date.now() - readStart;
          addCrudTest('read', 'error', 
            `Read error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            null, readDuration);
        }
      }

      // Test 3: UPDATE - Update the created country
      if (testCountryId) {
        const updateStart = Date.now();
        try {
          const updateData = {
            name: formData.name + ' (Updated)',
            status: formData.status === 'active' ? 'inactive' as const : 'active' as const
          };
          
          const updateResponse = await CountriesService.updateCountry(testCountryId, updateData);
          const updateDuration = Date.now() - updateStart;
          
          if (updateResponse.success && updateResponse.data) {
            addCrudTest('update', 'success', 
              `Updated country: ${updateResponse.data.name}, Status: ${updateResponse.data.status}`, 
              updateResponse.data, updateDuration);
          } else {
            addCrudTest('update', 'error', 
              `Update failed: ${updateResponse.error}`, null, updateDuration);
          }
        } catch (error) {
          const updateDuration = Date.now() - updateStart;
          addCrudTest('update', 'error', 
            `Update error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            null, updateDuration);
        }
      }

      // Test 4: DELETE - Delete the created country
      if (testCountryId) {
        const deleteStart = Date.now();
        try {
          const deleteResponse = await CountriesService.deleteCountry(testCountryId);
          const deleteDuration = Date.now() - deleteStart;
          
          if (deleteResponse.success) {
            addCrudTest('delete', 'success', 
              `Successfully deleted country with ID: ${testCountryId}`, 
              null, deleteDuration);
            setTestCountryId(null);
          } else {
            addCrudTest('delete', 'error', 
              `Delete failed: ${deleteResponse.error}`, null, deleteDuration);
          }
        } catch (error) {
          const deleteDuration = Date.now() - deleteStart;
          addCrudTest('delete', 'error', 
            `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            null, deleteDuration);
        }
      }

      // Refresh countries list
      await loadCountries();

    } finally {
      setIsCrudRunning(false);
    }
  };

  const runIndividualCrudOperation = async (operation: 'create' | 'read' | 'update' | 'delete') => {
    if (operation === 'create') {
      await runCrudTests();
      return;
    }

    if (!testCountryId) {
      addCrudTest(operation, 'error', 'No test country available. Please create one first.', null);
      return;
    }

    const start = Date.now();
    
    try {
      switch (operation) {
        case 'read':
          const readResponse = await CountriesService.getCountryById(testCountryId!);
          const readDuration = Date.now() - start;
          if (readResponse.success && readResponse.data) {
            addCrudTest('read', 'success', 
              `Read country: ${readResponse.data.name}`, 
              readResponse.data, readDuration);
          } else {
            addCrudTest('read', 'error', `Read failed: ${readResponse.error}`, null, readDuration);
          }
          break;

        case 'update':
          const updateData = {
            name: formData.name + ` (Updated ${Date.now()})`,
            status: formData.status === 'active' ? 'inactive' as const : 'active' as const
          };
          const updateResponse = await CountriesService.updateCountry(testCountryId!, updateData);
          const updateDuration = Date.now() - start;
          if (updateResponse.success && updateResponse.data) {
            addCrudTest('update', 'success', 
              `Updated: ${updateResponse.data.name}`, 
              updateResponse.data, updateDuration);
          } else {
            addCrudTest('update', 'error', `Update failed: ${updateResponse.error}`, null, updateDuration);
          }
          break;

        case 'delete':
          const deleteResponse = await CountriesService.deleteCountry(testCountryId!);
          const deleteDuration = Date.now() - start;
          if (deleteResponse.success) {
            addCrudTest('delete', 'success', 
              `Deleted country ID: ${testCountryId}`, 
              null, deleteDuration);
            setTestCountryId(null);
          } else {
            addCrudTest('delete', 'error', `Delete failed: ${deleteResponse.error}`, null, deleteDuration);
          }
          break;
      }
      
      await loadCountries();
    } catch (error) {
      const duration = Date.now() - start;
      addCrudTest(operation, 'error', 
        `${operation} error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        null, duration);
    }
  };

  useEffect(() => {
    runTests();
    loadCountries();
  }, []);

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Testing...</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Supabase Connection Test
          </CardTitle>
          <CardDescription>
            Testing connection to Supabase database and Countries table functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Run Connection Tests
                </>
              )}
            </Button>

            <div className="space-y-3">
              {tests.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <h3 className="font-medium">{test.name}</h3>
                    </div>
                    {getStatusBadge(test.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                  
                  {test.data && (
                    <div className="bg-gray-50 rounded p-3 mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Sample Data:</p>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRUD Operations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            CRUD Operations Test
          </CardTitle>
          <CardDescription>
            Test Create, Read, Update, and Delete operations on the Countries table
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form for CRUD operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="country-name">Country Name</Label>
              <Input
                id="country-name"
                type="text"
                placeholder="Enter country name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="country-code">Country Code</Label>
              <Input
                id="country-code"
                type="text"
                placeholder="Enter country code (e.g., US)"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="country-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'disabled') => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country-description">Description</Label>
              <Textarea
                id="country-description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* CRUD Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={() => runCrudTests()}
              disabled={isCrudRunning || !formData.name || !formData.code}
              variant="default"
            >
              {isCrudRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              Run Full CRUD Test
            </Button>
            
            <Button
              onClick={() => runIndividualCrudOperation('create')}
              disabled={isCrudRunning || !formData.name || !formData.code}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
            
            <Button
              onClick={() => runIndividualCrudOperation('read')}
              disabled={isCrudRunning || !testCountryId}
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              Read
            </Button>
            
            <Button
              onClick={() => runIndividualCrudOperation('update')}
              disabled={isCrudRunning || !testCountryId}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Update
            </Button>
            
            <Button
              onClick={() => runIndividualCrudOperation('delete')}
              disabled={isCrudRunning || !testCountryId}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            
            <Button
              onClick={clearCrudTests}
              variant="secondary"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Results
            </Button>
          </div>

          {/* Current Test Country Info */}
          {testCountryId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800">
                <strong>Current Test Country ID:</strong> {testCountryId}
              </p>
            </div>
          )}

          {/* CRUD Test Results */}
          {crudTests.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-medium">CRUD Test Results:</h3>
              {crudTests.map((test, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    test.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {test.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium capitalize">{test.operation}</span>
                      {test.duration && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({test.duration}ms)
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`mt-1 ${
                    test.status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {test.message}
                  </p>
                  {test.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        View Data
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator className="my-6" />

          {/* Countries List */}
          {countries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Current Countries ({countries.length}):</h3>
                <Button
                  onClick={loadCountries}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map((country) => (
                      <tr 
                        key={country.id} 
                        className={`border-t ${
                          country.id === testCountryId ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2">{country.id}</td>
                        <td className="px-3 py-2">{country.name}</td>
                        <td className="px-3 py-2">{country.code}</td>
                        <td className="px-3 py-2">
                          <Badge 
                            variant={country.status === 'active' ? 'default' : 'secondary'}
                            className={country.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {country.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConnectionTest;