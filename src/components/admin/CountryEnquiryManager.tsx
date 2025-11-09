import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Settings, Eye, AlertCircle, Save } from "lucide-react";
import { CountryEnquirySettings } from "../../types/enquiry";
import { useToast } from "@/hooks/use-toast";
import { useCountriesEnquiryIntegration } from "../../hooks/useCountriesEnquiryIntegration";
import { useApplicationSettings } from "../../contexts/ApplicationSettingsContext";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription as AlertDialogText,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const CountryEnquiryManager: React.FC = () => {
  const { toast } = useToast();
  const {
    activeCountries,
    availableCountries,
    configuredCountries,
    getCountryDetailsForConfig,
    addCountryWithDetails,
    updateCountry,
    removeCountry,
    setDefaultCountry,
    syncEnquiryWithActiveCountries,
    enquirySettings
  } = useCountriesEnquiryIntegration();
  const { updateEnquirySettings, hydrated } = useApplicationSettings();
  const [editMode, setEditMode] = useState<boolean>(false);

  const [isAddingCountry, setIsAddingCountry] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [newCountry, setNewCountry] = useState<Partial<CountryEnquirySettings>>({});

  // Sync enquiry configs only after hydration and active countries are available
  useEffect(() => {
    if (hydrated && activeCountries.length > 0) {
      syncEnquiryWithActiveCountries();
    }
  }, [hydrated, activeCountries, syncEnquiryWithActiveCountries]);

  const generateSampleId = (country: CountryEnquirySettings): string => {
    const year = country.yearFormat === 'YYYY' ? '2025' : 
                 country.yearFormat === 'YY' ? '25' : '';
    
    let sampleId = country.prefix;
    if (year) {
      sampleId += (country.yearSeparator === 'none' ? '' : country.yearSeparator) + year;
    }
    const startingNum = country.startingNumber || 1;
    const paddedStarting = startingNum.toString().padStart(country.numberLength, '0');
    sampleId += (country.numberSeparator === 'none' ? '' : country.numberSeparator) + paddedStarting;
    
    return sampleId;
  };

  const handleCountrySelect = (countryCode: string) => {
    const countryDetails = getCountryDetailsForConfig(countryCode);
    if (countryDetails) {
      setSelectedCountryCode(countryCode);
      setNewCountry(countryDetails);
    }
  };

  const handleAddCountry = () => {
    if (!selectedCountryCode || !newCountry.prefix) {
      toast({
        title: "Missing Information",
        description: "Please select a country and fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      addCountryWithDetails(selectedCountryCode, newCountry);
      setIsAddingCountry(false);
      setSelectedCountryCode('');
      setNewCountry({});

      toast({
        title: "Country Added",
        description: `${newCountry.countryName} configuration added successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add country configuration",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCountry = (countryCode: string, field: keyof CountryEnquirySettings, value: any) => {
    updateCountry(countryCode, { [field]: value });

    // Provide feedback to indicate persistence via AppSettingsHelpers (Supabase)
    if (field === 'isActive') {
      toast({
        title: 'Active Status Saved',
        description: `Enquiry configuration for ${countryCode} is now ${value ? 'active' : 'inactive'}.`,
      });
    } else {
      toast({
        title: 'Configuration Updated',
        description: `Saved ${String(field)} for ${countryCode}.`,
      });
    }
  };

  const handleSetDefault = (countryCode: string) => {
    setDefaultCountry(countryCode);
    toast({
      title: "Default Country Updated",
      description: "Default country has been changed successfully"
    });
  };

  const handleRemoveCountry = (countryCode: string, countryName: string) => {
    if (configuredCountries.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one country must be configured",
        variant: "destructive"
      });
      return;
    }

    removeCountry(countryCode);
    toast({
      title: "Country Removed",
      description: `${countryName} configuration removed successfully`
    });
  };

  const handleSaveAll = () => {
    try {
      // Force a persist of the current enquiry settings snapshot
      updateEnquirySettings({ ...enquirySettings });
      toast({
        title: "Changes Saved",
        description: "All enquiry configuration changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save enquiry settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Country Enquiry Configuration</h2>
          <p className="text-muted-foreground">Manage enquiry ID formats for different countries (synced with Countries Management)</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={editMode ? 'default' : 'secondary'}>{editMode ? 'Edit mode' : 'Preview mode'}</Badge>
          <Button onClick={() => setEditMode(!editMode)} variant="secondary" className="flex items-center gap-2">
            {editMode ? <Eye className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            {editMode ? 'Exit edit' : 'Edit'}
          </Button>
          {editMode && (
            <>
              <Button 
                onClick={handleSaveAll}
                className="flex items-center gap-2"
                disabled={!hydrated}
              >
                <Save className="h-4 w-4" />
                Save all changes
              </Button>
              <Button 
                onClick={() => setIsAddingCountry(true)} 
                className="flex items-center gap-2"
                disabled={availableCountries.length === 0 || !hydrated}
              >
                <Plus className="h-4 w-4" />
                Add Country
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Countries are automatically synced from the Countries Management module. Only active countries can be configured.
          {availableCountries.length === 0 && " All active countries have been configured."}
        </AlertDescription>
      </Alert>

      {/* Active Configurations Summary */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Configurations</h3>
        {configuredCountries.some(c => c.isActive) ? (
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Sample</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configuredCountries.filter(c => c.isActive).map(c => (
                <TableRow key={c.countryCode}>
                  <TableCell className="font-medium">{c.countryName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.countryCode}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{c.prefix}</TableCell>
                  <TableCell className="font-mono">
                    {c.yearFormat === 'none' ? '-' : c.yearFormat}
                    {c.yearFormat !== 'none' && c.yearSeparator !== 'none' ? ` (${c.yearSeparator})` : ''}
                  </TableCell>
                  <TableCell className="font-mono">
                    {c.numberLength}
                    {c.numberSeparator !== 'none' ? ` (${c.numberSeparator})` : ''}
                  </TableCell>
                  <TableCell>
                    {c.isDefault ? <Badge variant="default">Default</Badge> : '-'}
                  </TableCell>
                  <TableCell className="font-mono">{generateSampleId(c)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Shows currently active enquiry configurations</TableCaption>
          </Table>
        ) : (
          <Alert>
            <AlertDescription>No active enquiry configurations found.</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Existing Countries */}
      <div className="grid gap-4">
        {configuredCountries.map((country) => (
          <Card key={country.countryCode} className={country.isDefault ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    {country.countryName}
                    <Badge variant="secondary">{country.countryCode}</Badge>
                    {country.isDefault && <Badge variant="default">Default</Badge>}
                    {!country.isActive && <Badge variant="destructive">Inactive</Badge>}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={configuredCountries.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {country.countryName}?</AlertDialogTitle>
                        <AlertDialogText>
                          This will remove the enquiry ID configuration for {country.countryName}. You can re-add it later from active countries.
                        </AlertDialogText>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveCountry(country.countryCode, country.countryName)}>
                          Confirm Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardDescription>
                Sample ID: <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {generateSampleId(country)}
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`prefix-${country.countryCode}`}>Prefix</Label>
                  <Input
                    id={`prefix-${country.countryCode}`}
                    value={country.prefix}
                    onChange={(e) => handleUpdateCountry(country.countryCode, 'prefix', e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label htmlFor={`year-format-${country.countryCode}`}>Year Format</Label>
                  <Select
                    value={country.yearFormat}
                    onValueChange={(value) => handleUpdateCountry(country.countryCode, 'yearFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY">Full Year (YYYY)</SelectItem>
                      <SelectItem value="YY">Short Year (YY)</SelectItem>
                      <SelectItem value="none">No Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`year-sep-${country.countryCode}`}>Year Separator</Label>
                  <Select
                    value={country.yearSeparator}
                    onValueChange={(value) => handleUpdateCountry(country.countryCode, 'yearSeparator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="none">None</SelectItem>
                       <SelectItem value="/">/</SelectItem>
                       <SelectItem value="-">-</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`number-sep-${country.countryCode}`}>Number Separator</Label>
                  <Select
                    value={country.numberSeparator}
                    onValueChange={(value) => handleUpdateCountry(country.countryCode, 'numberSeparator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="none">None</SelectItem>
                       <SelectItem value="/">/</SelectItem>
                       <SelectItem value="-">-</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`number-length-${country.countryCode}`}>Number Length</Label>
                  <Select
                    value={country.numberLength.toString()}
                    onValueChange={(value) => handleUpdateCountry(country.countryCode, 'numberLength', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 digits</SelectItem>
                      <SelectItem value="4">4 digits</SelectItem>
                      <SelectItem value="5">5 digits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`starting-number-${country.countryCode}`}>Starting Number</Label>
                  <Input
                    id={`starting-number-${country.countryCode}`}
                    type="number"
                    min="1"
                    value={country.startingNumber || 1}
                    onChange={(e) => handleUpdateCountry(country.countryCode, 'startingNumber', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`active-${country.countryCode}`}
                    checked={country.isActive}
                    disabled={!hydrated || !editMode}
                    onCheckedChange={(checked) => handleUpdateCountry(country.countryCode, 'isActive', checked)}
                  />
                  <Label htmlFor={`active-${country.countryCode}`}>Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`default-${country.countryCode}`}
                    checked={country.isDefault}
                    disabled={!hydrated || !editMode}
                    onCheckedChange={(checked) => handleSetDefault(country.countryCode)}
                  />
                  <Label htmlFor={`default-${country.countryCode}`}>Default</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Country Modal */}
      {isAddingCountry && editMode && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Country</CardTitle>
            <CardDescription>Configure enquiry ID format for a country from your active countries list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="country-select">Select Country</Label>
                <Select 
                  value={selectedCountryCode} 
                  onValueChange={handleCountrySelect}
                >
                  <SelectTrigger id="country-select">
                    <SelectValue placeholder="Choose from available countries" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountries.length > 0 ? (
                      availableCountries.map(country => (
                        <SelectItem key={country.id} value={country.code}>
                          {country.name} ({country.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-countries" disabled>
                        No countries available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCountryCode && (
                <Alert>
                  <AlertDescription>
                    Selected: <strong>{newCountry.countryName}</strong> - Country details are auto-populated from your Countries Management module.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {selectedCountryCode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-prefix">Prefix</Label>
                    <Input
                      id="new-prefix"
                      placeholder="e.g., SGQ, INQ"
                      value={newCountry.prefix || ''}
                      onChange={(e) => setNewCountry(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-year-format">Year Format</Label>
                    <Select
                      value={newCountry.yearFormat || 'YYYY'}
                      onValueChange={(value) => setNewCountry(prev => ({ ...prev, yearFormat: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YYYY">Full Year (YYYY)</SelectItem>
                        <SelectItem value="YY">Short Year (YY)</SelectItem>
                        <SelectItem value="none">No Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Year Separator</Label>
                    <Select
                      value={newCountry.yearSeparator || 'none'}
                      onValueChange={(value) => setNewCountry(prev => ({ ...prev, yearSeparator: value as 'none' | '/' | '-' }))}
                    >
                      <SelectTrigger disabled={!hydrated}>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="/">/</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Number Separator</Label>
                    <Select
                      value={newCountry.numberSeparator || 'none'}
                      onValueChange={(value) => setNewCountry(prev => ({ ...prev, numberSeparator: value as 'none' | '/' | '-' }))}
                    >
                      <SelectTrigger disabled={!hydrated}>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="/">/</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Number Length</Label>
                    <Select
                      value={newCountry.numberLength?.toString() || '4'}
                      onValueChange={(value) => setNewCountry(prev => ({ ...prev, numberLength: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 digits</SelectItem>
                        <SelectItem value="4">4 digits</SelectItem>
                        <SelectItem value="5">5 digits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Starting Number</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={newCountry.startingNumber || 1}
                      onChange={(e) => setNewCountry(prev => ({ ...prev, startingNumber: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="bg-muted p-3 rounded">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <div className="font-mono text-sm mt-1">
                    {generateSampleId(newCountry as CountryEnquirySettings)}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setIsAddingCountry(false);
                setSelectedCountryCode('');
                setNewCountry({});
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCountry}
                disabled={!selectedCountryCode || !newCountry.prefix || !hydrated}
              >
                Add Country
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CountryEnquiryManager;
