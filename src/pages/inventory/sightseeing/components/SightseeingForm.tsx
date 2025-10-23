
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicInformation from './form-sections/BasicInformation';
import OperationalDetails from './form-sections/OperationalDetails';
import PricingModule from './form-sections/PricingModule';
import PoliciesInfo from './form-sections/PoliciesInfo';
import { Sightseeing } from '@/types/sightseeing';
import { useRealTimeCountriesData } from '@/hooks/useRealTimeCountriesData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SightseeingFormProps {
  formData: Sightseeing;
  handleFormChange: (field: string, value: any) => void;
  isEditMode: boolean;
}

const SightseeingForm: React.FC<SightseeingFormProps> = ({
  formData,
  handleFormChange,
  isEditMode
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { activeCountries } = useRealTimeCountriesData();
  const [validationStatus, setValidationStatus] = useState({
    basic: false,
    operational: true, // Optional section
    pricing: false,
    policies: true, // Optional section
  });

  // Validate form sections
  useEffect(() => {
    // Basic information validation
    const isBasicValid = !!formData.name && !!formData.country && !!formData.city;
    
    // Pricing validation
    const isPricingValid = 
      formData.isFree || 
      (formData.price && (formData.price.adult > 0 || formData.price.child > 0)) || 
      formData.pricingOptions?.some(o => o.isEnabled) || 
      formData.transferOptions?.some(o => o.isEnabled && o.price > 0) ||
      formData.packageOptions?.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0)) ||
      formData.groupSizeOptions?.some(o => (o.adultPrice > 0 || o.childPrice > 0));
    
    setValidationStatus({
      basic: isBasicValid,
      operational: true, // Optional section
      pricing: isPricingValid,
      policies: true, // Optional section
    });
  }, [formData]);

  // Helper to get validation status icon for tab
  const getTabStatusIcon = (tabKey: string) => {
    if (validationStatus[tabKey as keyof typeof validationStatus]) {
      return <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-500 ml-2" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit' : 'Add'} Sightseeing</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basic" className="flex items-center">
              Basic Information
              {getTabStatusIcon('basic')}
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center">
              Operational Details
              {getTabStatusIcon('operational')}
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center">
              Pricing
              {getTabStatusIcon('pricing')}
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center">
              Policies & Info
              {getTabStatusIcon('policies')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            {!validationStatus.basic && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fill in all required fields: Country, City, and Sightseeing Name.
                </AlertDescription>
              </Alert>
            )}
            
            <BasicInformation
              formData={formData}
              handleFormChange={handleFormChange}
              countries={activeCountries.map(c => c.name)}
              cities={[]} // This will be handled internally in the BasicInformation component
            />
          </TabsContent>
          
          <TabsContent value="operational">
            <OperationalDetails
              formData={formData}
              handleFormChange={handleFormChange}
            />
          </TabsContent>
          
          <TabsContent value="pricing">
            {!validationStatus.pricing && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please either mark the sightseeing as free or add at least one pricing option with a price greater than zero.
                </AlertDescription>
              </Alert>
            )}
            
            <PricingModule
              formData={formData}
              handleFormChange={handleFormChange}
            />
          </TabsContent>
          
          <TabsContent value="policies">
            <PoliciesInfo
              formData={formData}
              handleFormChange={handleFormChange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SightseeingForm;
