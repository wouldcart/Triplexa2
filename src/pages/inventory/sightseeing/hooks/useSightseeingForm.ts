
import { useFormState } from './form/useFormState';
import { useFormHandlers } from './form/useFormHandlers';
import { useFormValidation } from './form/useFormValidation';
import { useFormSubmit } from './form/useFormSubmit';
import { useEditModeEffect } from './form/useEditModeEffect';
import { useCurrencyUpdate } from './form/useCurrencyUpdate';

export const useSightseeingForm = (sightseeingId?: number) => {
  // Get form state
  const { formData, setFormData } = useFormState();
  
  // Form handlers
  const { handleFormChange } = useFormHandlers({ setFormData });
  
  // Form validation
  const { isFormValid } = useFormValidation({ formData });
  
  // Form submission
  const { handleSubmit } = useFormSubmit({ 
    formData, 
    isFormValid, 
    sightseeingId 
  });
  
  // Handle edit mode
  useEditModeEffect({
    sightseeingId,
    setFormData
  });

  // Update currency when country changes
  useCurrencyUpdate({ formData, setFormData });
  
  return {
    formData,
    handleFormChange,
    handleSubmit,
    isFormValid
  };
};
