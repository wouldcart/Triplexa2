
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '../../types/restaurantTypes';

export interface FormValidationProps {
  formData: Partial<Restaurant>;
}

export const useFormValidation = ({ formData }: FormValidationProps) => {
  const { toast } = useToast();

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.name) {
      toast({ title: "Error", description: "Restaurant name is required", variant: "destructive" });
      return false;
    }
    if (!formData.country) {
      toast({ title: "Error", description: "Country is required", variant: "destructive" });
      return false;
    }
    if (!formData.city) {
      toast({ title: "Error", description: "City is required", variant: "destructive" });
      return false;
    }
    if (!formData.address) {
      toast({ title: "Error", description: "Address is required", variant: "destructive" });
      return false;
    }
    if (!formData.cuisineTypes || formData.cuisineTypes.length === 0) {
      toast({ title: "Error", description: "At least one cuisine type is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  return { validateForm };
};
