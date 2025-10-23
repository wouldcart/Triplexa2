
import React, { useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import HotelForm from '@/components/inventory/hotels/forms/HotelForm';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const EditHotel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hotels, loading, updateHotel } = useSupabaseHotelsData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Setup form with react-hook-form
  const form = useForm();
  
  console.log('EditHotel component loaded with ID:', id);
  console.log('Hotels data:', hotels);
  console.log('Loading state:', loading);
  
  // Find the hotel being edited
  const hotel = hotels.find(h => h.id === id);
  
  console.log('Found hotel:', hotel);
  
  const handleSubmit = async (data: any) => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Hotel ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Submitting hotel update for ID:', id, 'with data:', data);
      
      // Update the hotel using the useHotelsData hook
      const updatedHotel = updateHotel(id, data);
      
      if (updatedHotel) {
        toast({
          title: 'Success',
          description: `${data.name || 'Hotel'} has been updated successfully!`,
        });
        
        // Navigate back to hotel details page
        navigate(`/inventory/hotels/${id}`);
      }
    } catch (error) {
      console.error('Error updating hotel:', error);
      toast({
        title: 'Error',
        description: 'Failed to update hotel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    navigate(`/inventory/hotels/${id}`);
  };

  // Check if hotel exists when loading is complete
  useEffect(() => {
    if (!loading && hotels.length > 0 && !hotel) {
      toast({
        title: 'Error',
        description: 'Hotel not found.',
        variant: 'destructive',
      });
      navigate('/inventory/hotels');
    }
  }, [loading, hotels, hotel, navigate, toast]);
  
  if (loading) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading hotel data...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!hotel) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-2xl font-bold mb-4">Hotel Not Found</h1>
            <p className="text-gray-500 mb-6">The hotel you are trying to edit could not be found.</p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/inventory/hotels">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Hotels
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/inventory/hotels/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hotel Details
            </Link>
          </Button>
          <h1 className="text-2xl font-bold ml-4">Edit Hotel: {hotel.name}</h1>
        </div>
        
        <Form {...form}>
          <HotelForm hotel={hotel} onSubmit={handleSubmit} onCancel={handleCancel} />
        </Form>
      </div>
    </PageLayout>
  );
};

export default EditHotel;
