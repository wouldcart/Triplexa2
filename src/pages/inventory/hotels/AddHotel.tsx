
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import HotelForm from '@/components/inventory/hotels/forms/HotelForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { hotelService } from '@/integrations/supabase/services/hotelService';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { convertLegacyHotelToSupabase } from '@/components/inventory/hotels/types/supabaseHotel';

const AddHotel: React.FC = () => {
  const navigate = useNavigate();
  const [externalId, setExternalId] = useState<number | null>(null);
  const [isGeneratingExternalId, setIsGeneratingExternalId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Setup form with react-hook-form
  const form = useForm();

  // Generate external_id on component mount
  useEffect(() => {
    generateExternalId();
  }, []);

  const generateExternalId = async () => {
    setIsGeneratingExternalId(true);
    try {
      const nextId = await hotelService.generateNextExternalId();
      setExternalId(nextId);
    } catch (error) {
      console.error('Error generating external_id:', error);
      toast.error('Failed to generate External ID. Please try again.');
    } finally {
      setIsGeneratingExternalId(false);
    }
  };

  // Regenerate external ID function
  const handleRegenerateExternalId = async () => {
    setIsGeneratingExternalId(true);
    try {
      const nextId = await hotelService.generateNextExternalId();
      setExternalId(nextId);
      toast.success("New external ID generated successfully.");
    } catch (error) {
      console.error('Failed to regenerate external ID:', error);
      toast.error("Failed to regenerate external ID. Please try again.");
    } finally {
      setIsGeneratingExternalId(false);
    }
  };
  
  const handleSubmit = async (data: any) => {
    if (!externalId) {
      toast.error('External ID is required. Please regenerate it.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map legacy form data (camelCase) to Supabase schema (snake_case)
      const supabaseHotelData = convertLegacyHotelToSupabase({
        ...data,
        externalId: externalId,
      });

      // Create hotel with external_id validation and retry logic
      const newHotel = await hotelService.createHotelWithExternalId(supabaseHotelData);
      
      // Show success message
      toast.success(`✅ ${data.name} has been added successfully! Redirecting to add room types...`);
      
      // Redirect to add room types page with hotel_id and external_id
      navigate(`/inventory/hotels/${newHotel.id}/add-room-type?external_id=${newHotel.external_id}`);
    } catch (error) {
      console.error('Error adding hotel:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Failed to create hotel after')) {
          toast.error('⚠️ Unable to generate unique External ID after multiple attempts. Please try again.');
          // Regenerate external_id for next attempt
          generateExternalId();
        } else {
          toast.error('⚠️ Error saving hotel, please try again.');
        }
      } else {
        toast.error('⚠️ Error saving hotel, please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/inventory/hotels');
  };
  
  return (
    <PageLayout>
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/inventory/hotels">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hotels
            </Link>
          </Button>
          <h1 className="text-2xl font-bold ml-2">Add New Hotel</h1>
        </div>
        
        <Form {...form}>
          <HotelForm 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
            externalId={externalId}
            isGeneratingExternalId={isGeneratingExternalId}
            onRegenerateExternalId={handleRegenerateExternalId}
            isSubmitting={isSubmitting}
          />
        </Form>
      </div>
    </PageLayout>
  );
};

export default AddHotel;
