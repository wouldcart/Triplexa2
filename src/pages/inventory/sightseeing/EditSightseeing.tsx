
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import SightseeingForm from './components/SightseeingForm';
import { useSightseeingForm } from './hooks/useSightseeingForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EditSightseeing: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const sightseeingId = id ? parseInt(id) : undefined;
  const { formData, handleFormChange, handleSubmit, isFormValid } = useSightseeingForm(sightseeingId);

  // Minimal validation and pricing presence for Edit behavior (match Add page)
  const isBasicValid = !!formData.name && !!formData.country && !!formData.city;
  const hasPricing =
    (formData.isFree) ||
    (formData.price && (formData.price.adult > 0 || formData.price.child > 0)) ||
    (formData.sicAvailable && formData.sicPricing && (formData.sicPricing.adult > 0 || formData.sicPricing.child > 0)) ||
    (formData.pricingOptions && formData.pricingOptions.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0))) ||
    (formData.transferOptions && formData.transferOptions.some(o => o.isEnabled && o.price > 0)) ||
    (formData.packageOptions && formData.packageOptions.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0))) ||
    (formData.groupSizeOptions && formData.groupSizeOptions.some(o => (o.adultPrice > 0 || o.childPrice > 0)));

  return (
    <PageLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory/sightseeing')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex-grow">Edit Sightseeing</h1>
          <Button 
            onClick={handleSubmit} 
            disabled={!isBasicValid}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* Validation summary before Save controls (allow minimal save) */}
        {!isFormValid && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can save with minimum information, but the following items need attention:
              {(!formData.activities || formData.activities.length === 0) && ' Activities'}
              {(!formData.pickupTime || !formData.pickupTime.trim()) && ', Pick-up Time'}
              {!hasPricing && ', Pricing'}
            </AlertDescription>
          </Alert>
        )}

        <SightseeingForm
          formData={formData}
          handleFormChange={handleFormChange}
          isEditMode={true}
        />
      </div>
    </PageLayout>
  );
};

export default EditSightseeing;
