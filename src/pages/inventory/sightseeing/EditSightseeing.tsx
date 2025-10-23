
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import SightseeingForm from './components/SightseeingForm';
import { useSightseeingForm } from './hooks/useSightseeingForm';

const EditSightseeing: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const sightseeingId = id ? parseInt(id) : undefined;
  const { formData, handleFormChange, handleSubmit, isFormValid } = useSightseeingForm(sightseeingId);

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
            disabled={!isFormValid}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

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
