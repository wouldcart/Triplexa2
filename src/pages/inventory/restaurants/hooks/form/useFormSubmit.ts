
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '../../types/restaurantTypes';

interface FormSubmitProps {
  formData: Partial<Restaurant>;
  validateForm: () => boolean;
  saveRestaurant: (data: Partial<Restaurant>) => Promise<Restaurant>;
}

export const useFormSubmit = ({ formData, validateForm, saveRestaurant }: FormSubmitProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      console.log('Submitting restaurant data:', formData);
      
      // Ensure formData has correct types before saving
      const restaurantData: Partial<Restaurant> = {
        ...formData,
        // If id exists, ensure it's a string
        ...(formData.id ? { id: formData.id.toString() } : {})
      };
      
      // Use the saveRestaurant function from useRestaurantsData hook
      const savedRestaurant = await saveRestaurant(restaurantData);
      
      if (savedRestaurant) {
        // Toast notification is handled by saveRestaurant function
        navigate('/inventory/restaurants');
      }
    } catch (error) {
      console.error("Error saving restaurant:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving. Please try again.",
        variant: "destructive"
      });
    }
  };

  return { handleSubmit };
};
