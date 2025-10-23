
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import OptimizedSightseeingForm from './components/OptimizedSightseeingForm';
import { useSightseeingForm } from './hooks/useSightseeingForm';

const OptimizedAddSightseeing: React.FC = () => {
  const navigate = useNavigate();
  const { formData, handleFormChange, handleSubmit, isFormValid } = useSightseeingForm();

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
          <h1 className="text-2xl font-bold flex-grow">Add New Sightseeing</h1>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>

        <OptimizedSightseeingForm
          formData={formData}
          handleFormChange={handleFormChange}
          isEditMode={false}
        />
      </div>
    </PageLayout>
  );
};

export default OptimizedAddSightseeing;
