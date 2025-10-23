import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sightseeing, TransferOption } from '@/types/sightseeing';
import { packageTypes } from '../../data/initialData';
import { useTransportData } from '../../../transport/hooks/useTransportData';
import PricingPreview from './PricingPreview';
import { getCurrencyByCountry } from '../../utils/currency';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PricingModuleProps {
  formData: Sightseeing;
  handleFormChange: (field: string, value: any) => void;
}

// PricingModule component
const PricingModule: React.FC<PricingModuleProps> = ({ formData, handleFormChange }) => {
  const [activeTab, setActiveTab] = useState('standard');
  const [showCustomTypeInput, setShowCustomTypeInput] = useState<{[key: number]: boolean}>({});
  const [showCustomPackageType, setShowCustomPackageType] = useState<{[key: number]: boolean}>({});
  const { transport: transportTypes } = useTransportData();

  // Get currency symbol based on selected country
  const currency = getCurrencyByCountry(formData.country || '');
  const currencySymbol = currency.symbol;
  const currencyCode = currency.code;

  // Predefined pricing types with new additions
  const pricingTypes = [
    'Ticket Only',
    'Entry Fee', 
    'National Park Fee',
    'Guide Fee',
    'Activity Fee',
    'Equipment Rental',
    'Custom' // This will trigger custom input
  ];

  // Handle standard price changes
  const handleStandardPriceChange = (type: 'adult' | 'child', value: string) => {
    const price = parseFloat(value) || 0;
    handleFormChange('price', {
      ...formData.price,
      [type]: price
    });
  };

  // Handle SIC availability toggle
  const handleSicAvailableToggle = (checked: boolean) => {
    handleFormChange('sicAvailable', checked);
    
    // If SIC is enabled, ensure SIC pricing is initialized
    if (checked && !formData.sicPricing) {
      handleFormChange('sicPricing', { adult: 0, child: 0 });
    }
    
    // If SIC is disabled, clear SIC pricing
    if (!checked) {
      handleFormChange('sicPricing', { adult: 0, child: 0 });
    }
  };

  // Handle SIC pricing changes
  const handleSicPriceChange = (type: 'adult' | 'child', value: string) => {
    const price = parseFloat(value) || 0;
    handleFormChange('sicPricing', {
      ...formData.sicPricing,
      [type]: price
    });
  };

  // Handle mandatory transfer toggle
  const handleMandatoryTransferToggle = (checked: boolean) => {
    handleFormChange('requiresMandatoryTransfer', checked);
    handleFormChange('transferMandatory', checked);
  };

  // Handle free toggle
  const handleFreeToggle = (checked: boolean) => {
    handleFormChange('isFree', checked);
    
    // If free is toggled on, reset prices
    if (checked) {
      handleFormChange('price', { adult: 0, child: 0 });
      handleFormChange('sicPricing', { adult: 0, child: 0 });
      
      // Also disable any pricing options
      if (formData.pricingOptions) {
        const updatedOptions = formData.pricingOptions.map(option => ({
          ...option,
          isEnabled: false
        }));
        handleFormChange('pricingOptions', updatedOptions);
      }
      
      // And disable any package options
      if (formData.packageOptions) {
        const updatedPackages = formData.packageOptions.map(pkg => ({
          ...pkg,
          isEnabled: false
        }));
        handleFormChange('packageOptions', updatedPackages);
      }

      // And disable any transfer options
      if (formData.transferOptions) {
        const updatedTransfers = formData.transferOptions.map(transfer => ({
          ...transfer,
          isEnabled: false
        }));
        handleFormChange('transferOptions', updatedTransfers);
      }
    }
  };

  // Pricing Option handlers
  const handleAddPricingOption = () => {
    const newOption = {
      id: Date.now(),
      type: 'Ticket Only',
      adultPrice: 0,
      childPrice: 0,
      isEnabled: true
    };
    
    const updatedOptions = formData.pricingOptions ? 
      [...formData.pricingOptions, newOption] : 
      [newOption];
    
    handleFormChange('pricingOptions', updatedOptions);
  };

  const handlePricingOptionChange = (index: number, field: string, value: any) => {
    if (!formData.pricingOptions) return;
    
    const updatedOptions = [...formData.pricingOptions];
    
    // Handle custom type selection
    if (field === 'type') {
      if (value === 'Custom') {
        setShowCustomTypeInput(prev => ({ ...prev, [index]: true }));
        updatedOptions[index] = {
          ...updatedOptions[index],
          [field]: value,
          customType: ''
        };
      } else {
        setShowCustomTypeInput(prev => ({ ...prev, [index]: false }));
        updatedOptions[index] = {
          ...updatedOptions[index],
          [field]: value,
          customType: undefined
        };
      }
    } else {
      updatedOptions[index] = {
        ...updatedOptions[index],
        [field]: value
      };
    }
    
    handleFormChange('pricingOptions', updatedOptions);
  };

  const handleRemovePricingOption = (index: number) => {
    if (!formData.pricingOptions) return;
    
    const updatedOptions = formData.pricingOptions.filter((_, i) => i !== index);
    handleFormChange('pricingOptions', updatedOptions);
  };

  // Package Option handlers
  const handleAddPackageOption = () => {
    const newPackage = {
      id: Date.now(),
      name: 'Standard Package',
      type: 'Group',
      description: '',
      adultPrice: 0,
      childPrice: 0,
      isEnabled: true
    };
    
    const updatedPackages = formData.packageOptions ? 
      [...formData.packageOptions, newPackage] : 
      [newPackage];
    
    handleFormChange('packageOptions', updatedPackages);
  };

  const handlePackageOptionChange = (index: number, field: string, value: any) => {
    if (!formData.packageOptions) return;
    
    const updatedPackages = [...formData.packageOptions];
    
    // Handle custom type selection
    if (field === 'type') {
      if (value === 'Custom') {
        setShowCustomPackageType(prev => ({ ...prev, [index]: true }));
        updatedPackages[index] = {
          ...updatedPackages[index],
          [field]: value,
          customType: ''
        };
      } else {
        setShowCustomPackageType(prev => ({ ...prev, [index]: false }));
        updatedPackages[index] = {
          ...updatedPackages[index],
          [field]: value,
          customType: undefined
        };
      }
    } else {
      updatedPackages[index] = {
        ...updatedPackages[index],
        [field]: value
      };
    }
    
    handleFormChange('packageOptions', updatedPackages);
  };

  const handleRemovePackageOption = (index: number) => {
    if (!formData.packageOptions) return;
    
    const updatedPackages = formData.packageOptions.filter((_, i) => i !== index);
    handleFormChange('packageOptions', updatedPackages);
  };

  // Transfer Option handlers
  const handleAddTransferOption = () => {
    const newTransfer: TransferOption = {
      id: Date.now(),
      vehicleType: transportTypes?.length > 0 ? transportTypes[0].name : 'Standard Vehicle',
      capacity: getSeatingCapacityForVehicle(transportTypes?.length > 0 ? transportTypes[0].name : 'Standard Vehicle'),
      price: 0,
      priceUnit: 'Per Person',
      isEnabled: true
    };
    
    const updatedTransfers = formData.transferOptions ?
      [...formData.transferOptions, newTransfer] :
      [newTransfer];
    
    handleFormChange('transferOptions', updatedTransfers);
  };

  const handleTransferOptionChange = (index: number, field: string, value: any) => {
    if (!formData.transferOptions) return;
    
    const updatedTransfers = [...formData.transferOptions];
    
    // If vehicle type is changed, update capacity automatically
    if (field === 'vehicleType') {
      updatedTransfers[index] = {
        ...updatedTransfers[index],
        [field]: value,
        capacity: getSeatingCapacityForVehicle(value)
      };
    } else {
      updatedTransfers[index] = {
        ...updatedTransfers[index],
        [field]: value
      };
    }
    
    handleFormChange('transferOptions', updatedTransfers);
  };

  const handleRemoveTransferOption = (index: number) => {
    if (!formData.transferOptions) return;
    
    const updatedTransfers = formData.transferOptions.filter((_, i) => i !== index);
    handleFormChange('transferOptions', updatedTransfers);
  };

  // Group Size Option handlers
  const handleAddGroupSizeOption = () => {
    const newOption = {
      id: Date.now(),
      minPeople: 1,
      maxPeople: 4,
      adultPrice: 0,
      childPrice: 0,
    };

    const updated = formData.groupSizeOptions
      ? [...formData.groupSizeOptions, newOption]
      : [newOption];

    handleFormChange('groupSizeOptions', updated);
  };

  const handleGroupSizeOptionChange = (index: number, field: string, value: any) => {
    if (!formData.groupSizeOptions) return;

    const updated = [...formData.groupSizeOptions];

    if (field === 'minPeople' || field === 'maxPeople') {
      updated[index] = { ...updated[index], [field]: parseInt(value as string, 10) || 0 };
    } else if (field === 'adultPrice' || field === 'childPrice') {
      updated[index] = { ...updated[index], [field]: parseFloat(value as string) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    handleFormChange('groupSizeOptions', updated);
  };

  const handleRemoveGroupSizeOption = (index: number) => {
    if (!formData.groupSizeOptions) return;
    const updated = formData.groupSizeOptions.filter((_, i) => i !== index);
    handleFormChange('groupSizeOptions', updated);
  };

  // Helper function to get seating capacity for a vehicle type
  const getSeatingCapacityForVehicle = (vehicleTypeName: string): string => {
    if (!transportTypes || transportTypes.length === 0) {
      return '1-4'; // Default fallback
    }
    
    const vehicleType = transportTypes.find(type => type.name === vehicleTypeName);
    if (vehicleType && vehicleType.seatingCapacity) {
      return vehicleType.seatingCapacity.toString();
    }
    
    // Fallback based on vehicle type name patterns
    const lowerName = vehicleTypeName.toLowerCase();
    if (lowerName.includes('bus')) return '20-50';
    if (lowerName.includes('van') || lowerName.includes('minibus')) return '8-15';
    if (lowerName.includes('suv')) return '6-8';
    if (lowerName.includes('sedan') || lowerName.includes('car')) return '1-4';
    
    return '1-4'; // Default fallback
  };

  // Initialize with at least one transfer option if none exists
  useEffect(() => {
    if (!formData.transferOptions || formData.transferOptions.length === 0) {
      handleAddTransferOption();
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Pricing Information {formData.country && `(${currencyCode})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* SIC Availability Management */}
          <div className="mb-6 p-4 bg-secondary/10 rounded-lg space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={!!formData.sicAvailable}
                onCheckedChange={handleSicAvailableToggle}
                id="sic-available-toggle"
              />
              <Label htmlFor="sic-available-toggle" className="font-medium">
                SIC (Seat-in-Coach) Available
              </Label>
            </div>
            
            {formData.sicAvailable && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sic-adult-price" className="font-medium">
                      SIC Price - Adult ({currencySymbol})
                    </Label>
                    <Input
                      id="sic-adult-price"
                      type="number"
                      placeholder={`Enter SIC adult price in ${currencyCode}`}
                      value={formData.sicPricing?.adult || 0}
                      onChange={(e) => handleSicPriceChange('adult', e.target.value)}
                      disabled={!!formData.isFree}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sic-child-price" className="font-medium">
                      SIC Price - Child ({currencySymbol})
                    </Label>
                    <Input
                      id="sic-child-price"
                      type="number"
                      placeholder={`Enter SIC child price in ${currencyCode}`}
                      value={formData.sicPricing?.child || 0}
                      onChange={(e) => handleSicPriceChange('child', e.target.value)}
                      disabled={!!formData.isFree}
                    />
                  </div>
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    When SIC is available, it will be shown in Standard Pricing. Private transfer options will be available separately in Transfer Options.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          {/* Transfer Requirements */}
          <div className="mb-6 p-4 bg-accent/10 rounded-lg space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={!!formData.requiresMandatoryTransfer}
                onCheckedChange={handleMandatoryTransferToggle}
                id="mandatory-transfer-toggle"
              />
              <Label htmlFor="mandatory-transfer-toggle" className="font-medium">
                Requires Mandatory Transfer
              </Label>
            </div>
            
            {formData.requiresMandatoryTransfer && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This sightseeing requires mandatory transfer selection. Customers must choose between SIC (if available) or Private transfer options.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="mb-6 flex items-center space-x-2">
            <Switch 
              checked={!!formData.isFree}
              onCheckedChange={handleFreeToggle}
              id="free-toggle"
            />
            <Label htmlFor="free-toggle" className="font-medium">
              This is a free sightseeing activity
            </Label>
          </div>

          {!formData.isFree && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="standard">Standard Pricing</TabsTrigger>
                <TabsTrigger value="options">Pricing Options</TabsTrigger>
                <TabsTrigger value="transfers">Transfer Options</TabsTrigger>
                <TabsTrigger value="packages">Package Options</TabsTrigger>
                <TabsTrigger value="group">Group Size Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard">
                <div className="space-y-6">
                  {/* Regular Standard Pricing */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Standard Pricing</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="adult-price" className="font-medium">
                          Standard Price - Adult ({currencySymbol})
                        </Label>
                        <Input
                          id="adult-price"
                          type="number"
                          placeholder={`Enter adult price in ${currencyCode}`}
                          value={formData.price?.adult || 0}
                          onChange={(e) => handleStandardPriceChange('adult', e.target.value)}
                          disabled={!!formData.isFree}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="child-price" className="font-medium">
                          Standard Price - Child ({currencySymbol})
                        </Label>
                        <Input
                          id="child-price"
                          type="number"
                          placeholder={`Enter child price in ${currencyCode}`}
                          value={formData.price?.child || 0}
                          onChange={(e) => handleStandardPriceChange('child', e.target.value)}
                          disabled={!!formData.isFree}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SIC Pricing Display */}
                  {formData.sicAvailable && (
                    <div>
                      <Separator className="my-4" />
                      <h3 className="text-lg font-medium mb-4">SIC (Seat-in-Coach) Pricing</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="font-medium">
                            SIC Price - Adult ({currencySymbol})
                          </Label>
                          <div className="p-3 bg-muted rounded-md">
                            {currencySymbol}{formData.sicPricing?.adult || 0}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">
                            SIC Price - Child ({currencySymbol})
                          </Label>
                          <div className="p-3 bg-muted rounded-md">
                            {currencySymbol}{formData.sicPricing?.child || 0}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        SIC pricing is managed in the main settings above. This is displayed here for reference.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="options">
                <div className="space-y-4">
                  {formData.pricingOptions?.map((option, index) => (
                    <Card key={option.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={option.isEnabled !== false}
                              onCheckedChange={(checked) => handlePricingOptionChange(index, 'isEnabled', checked)}
                              disabled={!!formData.isFree}
                            />
                            <Label className="font-medium">Enabled</Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemovePricingOption(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Type</Label>
                            <Select
                              value={option.type}
                              onValueChange={(value) => handlePricingOptionChange(index, 'type', value)}
                              disabled={!option.isEnabled || !!formData.isFree}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {pricingTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Custom Type Input */}
                            {option.type === 'Custom' && showCustomTypeInput[index] && (
                              <Input
                                placeholder="Enter custom type"
                                value={option.customType || ''}
                                onChange={(e) => handlePricingOptionChange(index, 'customType', e.target.value)}
                                disabled={!option.isEnabled || !!formData.isFree}
                                className="mt-2"
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Adult Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter adult price in ${currencyCode}`}
                              value={option.adultPrice || 0}
                              onChange={(e) => handlePricingOptionChange(index, 'adultPrice', parseFloat(e.target.value) || 0)}
                              disabled={!option.isEnabled || !!formData.isFree}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Child Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter child price in ${currencyCode}`}
                              value={option.childPrice || 0}
                              onChange={(e) => handlePricingOptionChange(index, 'childPrice', parseFloat(e.target.value) || 0)}
                              disabled={!option.isEnabled || !!formData.isFree}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddPricingOption}
                    disabled={!!formData.isFree}
                    className="w-full flex items-center justify-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Pricing Option
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="transfers">
                <div className="space-y-4">
                  {/* Transfer Requirements Info */}
                  {formData.requiresMandatoryTransfer && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This sightseeing requires mandatory transfer. Configure transfer options below.
                        {formData.sicAvailable && " SIC transfer pricing is managed above, these are for private transfers."}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {formData.transferOptions?.map((transfer, index) => (
                    <Card key={transfer.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={transfer.isEnabled !== false}
                              onCheckedChange={(checked) => handleTransferOptionChange(index, 'isEnabled', checked)}
                              disabled={!!formData.isFree}
                            />
                            <Label className="font-medium">Enabled</Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveTransferOption(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm">Vehicle Type</Label>
                            <Select
                              value={transfer.vehicleType}
                              onValueChange={(value) => handleTransferOptionChange(index, 'vehicleType', value)}
                              disabled={!transfer.isEnabled || !!formData.isFree}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                              <SelectContent>
                                {transportTypes && transportTypes.length > 0 ? (
                                  transportTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.name}>
                                      {type.name} ({type.category}) - {type.seatingCapacity || 'N/A'} seats
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="Standard Vehicle">Standard Vehicle</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Seating Capacity</Label>
                            <Input
                              placeholder="Enter capacity or auto-filled from vehicle type"
                              value={transfer.capacity || ''}
                              onChange={(e) => handleTransferOptionChange(index, 'capacity', e.target.value)}
                              disabled={!transfer.isEnabled || !!formData.isFree}
                            />
                            <p className="text-xs text-muted-foreground">
                              Capacity is automatically set based on selected vehicle type from Transport Management
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 mt-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter price in ${currencyCode}`}
                              value={transfer.price || 0}
                              onChange={(e) => handleTransferOptionChange(index, 'price', parseFloat(e.target.value) || 0)}
                              disabled={!transfer.isEnabled || !!formData.isFree}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Price Unit</Label>
                            <Select
                              value={transfer.priceUnit}
                              onValueChange={(value) => handleTransferOptionChange(index, 'priceUnit', value)}
                              disabled={!transfer.isEnabled || !!formData.isFree}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select price unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Per Person">Per Person</SelectItem>
                                <SelectItem value="Per Vehicle">Per Vehicle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <Label className="text-sm">Transfer Type</Label>
                          <Select
                            value={transfer.type || 'SIC'}
                            onValueChange={(value) => handleTransferOptionChange(index, 'type', value)}
                            disabled={!transfer.isEnabled || !!formData.isFree}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select transfer type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SIC">SIC (Shared)</SelectItem>
                              <SelectItem value="Private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Transfer logic info */}
                        {formData.sicAvailable && transfer.type === 'SIC' && (
                          <Alert className="mt-4">
                            <AlertDescription>
                              SIC transfer pricing is managed above in the SIC pricing section. This option indicates SIC availability.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddTransferOption}
                    disabled={!!formData.isFree}
                    className="w-full flex items-center justify-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Transfer Option
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="packages">
                <div className="space-y-4">
                  {formData.packageOptions?.map((pkg, index) => (
                    <Card key={pkg.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={pkg.isEnabled !== false}
                              onCheckedChange={(checked) => handlePackageOptionChange(index, 'isEnabled', checked)}
                              disabled={!!formData.isFree}
                            />
                            <Label className="font-medium">Enabled</Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemovePackageOption(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2 mb-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Package Name</Label>
                            <Input
                              placeholder="Enter package name"
                              value={pkg.name || ''}
                              onChange={(e) => handlePackageOptionChange(index, 'name', e.target.value)}
                              disabled={!pkg.isEnabled || !!formData.isFree}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Package Type</Label>
                            <Select
                              value={pkg.type}
                              onValueChange={(value) => handlePackageOptionChange(index, 'type', value)}
                              disabled={!pkg.isEnabled || !!formData.isFree}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {packageTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Custom Type Input */}
                            {pkg.type === 'Custom' && showCustomPackageType[index] && (
                              <Input
                                placeholder="Enter custom package type"
                                value={pkg.customType || ''}
                                onChange={(e) => handlePackageOptionChange(index, 'customType', e.target.value)}
                                disabled={!pkg.isEnabled || !!formData.isFree}
                                className="mt-2"
                              />
                            )}
                          </div>
                        </div>
                        
                        {/* Transfer Options for Package */}
                        <div className="grid gap-4 sm:grid-cols-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={!!pkg.transferIncluded}
                              onCheckedChange={(checked) => handlePackageOptionChange(index, 'transferIncluded', checked)}
                              disabled={!pkg.isEnabled || !!formData.isFree}
                            />
                            <Label className="text-sm">Transfer Included</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={!!pkg.requiresPrivateTransfer}
                              onCheckedChange={(checked) => handlePackageOptionChange(index, 'requiresPrivateTransfer', checked)}
                              disabled={!pkg.isEnabled || !!formData.isFree}
                            />
                            <Label className="text-sm">Requires Private Transfer</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <Label className="text-sm">Description</Label>
                          <Input
                            placeholder="Enter package description"
                            value={pkg.description || ''}
                            onChange={(e) => handlePackageOptionChange(index, 'description', e.target.value)}
                            disabled={!pkg.isEnabled || !!formData.isFree}
                          />
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm">Adult Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter adult price in ${currencyCode}`}
                              value={pkg.adultPrice || 0}
                              onChange={(e) => handlePackageOptionChange(index, 'adultPrice', parseFloat(e.target.value) || 0)}
                              disabled={!pkg.isEnabled || !!formData.isFree}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Child Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter child price in ${currencyCode}`}
                              value={pkg.childPrice || 0}
                              onChange={(e) => handlePackageOptionChange(index, 'childPrice', parseFloat(e.target.value) || 0)}
                              disabled={!pkg.isEnabled || !!formData.isFree}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddPackageOption}
                    disabled={!!formData.isFree}
                    className="w-full flex items-center justify-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Package Option
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="group">
                <div className="space-y-4">
                  {formData.groupSizeOptions?.map((option, index) => (
                    <Card key={option.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm">Min People</Label>
                            <Input
                              type="number"
                              min={1}
                              value={option.minPeople ?? 1}
                              onChange={(e) =>
                                handleGroupSizeOptionChange(index, 'minPeople', e.target.value)
                              }
                              disabled={!!formData.isFree}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Max People</Label>
                            <Input
                              type="number"
                              min={option.minPeople ?? 1}
                              value={option.maxPeople ?? (option.minPeople ?? 1)}
                              onChange={(e) =>
                                handleGroupSizeOptionChange(index, 'maxPeople', e.target.value)
                              }
                              disabled={!!formData.isFree}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm">Adult Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter adult price in ${currencyCode}`}
                              value={option.adultPrice || 0}
                              onChange={(e) =>
                                handleGroupSizeOptionChange(index, 'adultPrice', e.target.value)
                              }
                              disabled={!!formData.isFree}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Child Price ({currencySymbol})</Label>
                            <Input
                              type="number"
                              placeholder={`Enter child price in ${currencyCode}`}
                              value={option.childPrice || 0}
                              onChange={(e) =>
                                handleGroupSizeOptionChange(index, 'childPrice', e.target.value)
                              }
                              disabled={!!formData.isFree}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGroupSizeOption(index)}
                            disabled={!!formData.isFree}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button 
                    variant="outline" 
                    onClick={handleAddGroupSizeOption}
                    disabled={!!formData.isFree}
                    className="w-full flex items-center justify-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Group Size Option
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add the pricing preview */}
      <PricingPreview formData={formData} />
    </div>
  );
};

export default PricingModule;
