import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Sightseeing } from '@/types/sightseeing';
import { updateSightseeing as updateSightseeingDb, createSightseeing } from '../../services/sightseeingService';

export interface FormSubmitProps {
  formData: Sightseeing;
  isFormValid: boolean;
  sightseeingId?: number;
}

export const useFormSubmit = ({ formData, isFormValid, sightseeingId }: FormSubmitProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill required fields: Name, Country, City, Activities, Pick-up Time, and ensure pricing is valid.",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure imageUrl is synced with primary image
    let updatedFormData = { ...formData };
    if (formData.images && formData.images.length > 0) {
      const primaryImage = formData.images.find(img => img.isPrimary) || formData.images[0];
      updatedFormData = {
        ...updatedFormData,
        imageUrl: primaryImage.url
      };
    }

    // Ensure transferTypes is updated based on the transfer options
    const transferTypes = new Set<string>();
    if (updatedFormData.transferOptions) {
      updatedFormData.transferOptions.forEach(option => {
        if (option.isEnabled && option.type) {
          transferTypes.add(option.type);
        }
      });
    }
    updatedFormData.transferTypes = Array.from(transferTypes);

    // Normalize arrays and strings for Supabase
    updatedFormData.activities = Array.isArray(updatedFormData.activities) ? updatedFormData.activities : [];
    updatedFormData.daysOfWeek = Array.isArray(updatedFormData.daysOfWeek) ? updatedFormData.daysOfWeek : [];
    updatedFormData.pickupTime = (updatedFormData.pickupTime || '').trim() || updatedFormData.pickupTime;

    // Ensure all pricing data is properly structured before saving
    if (updatedFormData.pricingOptions) {
      updatedFormData.pricingOptions = updatedFormData.pricingOptions.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        type: option.type || 'Standard',
        name: option.name || option.type || 'Standard',
        adultPrice: Number(option.adultPrice) || 0,
        childPrice: Number(option.childPrice) || 0,
        isEnabled: option.isEnabled !== undefined ? option.isEnabled : true,
        description: option.description || ''
      }));
    }

    if (updatedFormData.packageOptions) {
      updatedFormData.packageOptions = updatedFormData.packageOptions.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        adultPrice: Number(option.adultPrice) || 0,
        childPrice: Number(option.childPrice) || 0,
        isEnabled: option.isEnabled !== undefined ? option.isEnabled : true
      }));
    }

    if (updatedFormData.groupSizeOptions) {
      updatedFormData.groupSizeOptions = updatedFormData.groupSizeOptions.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        adultPrice: Number(option.adultPrice) || 0,
        childPrice: Number(option.childPrice) || 0
      }));
    }

    // Structure policies JSONB object with all 8 required fields
    const currentPolicies = updatedFormData.policies || ({} as any);
    const inclusionsFromText = (updatedFormData.otherInclusions || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    updatedFormData.policies = {
      // Arrays: ensure they are always arrays
      highlights: Array.isArray(currentPolicies.highlights) ? currentPolicies.highlights : [],
      exclusions: Array.isArray(currentPolicies.exclusions) ? currentPolicies.exclusions : [],
      inclusions: inclusionsFromText.length > 0
        ? inclusionsFromText
        : (Array.isArray(currentPolicies.inclusions) ? currentPolicies.inclusions : []),
      // Strings: ensure all 5 text fields are included
      advisory: (currentPolicies.advisory || '').toString().trim(),
      refundPolicy: (currentPolicies.refundPolicy || '').toString().trim(),
      confirmationPolicy: (currentPolicies.confirmationPolicy || '').toString().trim(),
      termsConditions: (currentPolicies.termsConditions || '').toString().trim(),
      cancellationPolicy: (currentPolicies.cancellationPolicy || '').toString().trim()
    } as any;
    
    try {
      if (sightseeingId) {
        // Update existing record in Supabase
        await updateSightseeingDb(updatedFormData);
      } else {
        // Create new record in Supabase
        await createSightseeing(updatedFormData);
      }

      toast({
        title: sightseeingId ? "Sightseeing Updated" : "New Sightseeing Created",
        description: `"${formData.name}" has been ${sightseeingId ? "updated" : "added"} successfully.`,
        variant: "default"
      });

      // Notify other components and return to list
      window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
      navigate('/inventory/sightseeing');
    } catch (error) {
      console.error('Error saving sightseeing:', error);
      toast({
        title: "Error",
        description: "There was an error saving the sightseeing data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return { handleSubmit };
};