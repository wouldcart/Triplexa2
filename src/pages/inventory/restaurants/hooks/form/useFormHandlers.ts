
import { useState, useEffect } from 'react';
import { CuisineType, Restaurant } from '../../types/restaurantTypes';

export interface FormHandlersProps {
  setFormData: React.Dispatch<React.SetStateAction<Partial<Restaurant>>>;
}

export const useFormHandlers = ({ setFormData }: FormHandlersProps) => {
  // Track if we're in edit mode with a city already selected
  const [isEditingWithCity, setIsEditingWithCity] = useState<boolean>(false);
  const [previousCountry, setPreviousCountry] = useState<string | null>(null);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`Select changed: ${name} = ${value}`);
    
    if (name === 'country') {
      // When country changes, check if we should preserve city
      setFormData(prev => {
        // Store previous country for comparison
        setPreviousCountry(prev.country || null);
        
        // When editing a restaurant and city already exists, mark that we're editing with a city
        if (prev.city && !isEditingWithCity) {
          console.log('Detected editing with existing city:', prev.city);
          setIsEditingWithCity(true);
        }
        
        // If country is changing and we're not in edit mode with city, reset city
        if (prev.country && prev.country !== value && !isEditingWithCity) {
          console.log('Country changed, resetting city selection');
          const next = { ...prev, [name]: value, city: '' };
          const computedLocation = [next.city || '', value || ''].filter(Boolean).join(', ');
          return { ...next, location: computedLocation };
        }
        
        // Return updated form data with new country
        const next = { ...prev, [name]: value };
        const computedLocation = [next.city || '', value || ''].filter(Boolean).join(', ');
        return { ...next, location: computedLocation };
      });
    } else if (name === 'city') {
      // For city changes, reset the flag if clearing the city
      if (value === '') {
        setIsEditingWithCity(false);
      }
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        const computedLocation = [value || '', next.country || ''].filter(Boolean).join(', ');
        return { ...next, location: computedLocation };
      });
    } else {
      // For all other fields, just update normally
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle checkbox changes including nested objects
  const handleCheckboxChange = (name: string, checked: boolean) => {
    const nameParts = name.split('.');
    
    if (nameParts.length === 1) {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const [category, field] = nameParts;
      setFormData(prev => {
        if (!prev) return {};
        
        // Check if the category exists in prev and is an object
        const categoryData = prev[category as keyof typeof prev];
        const updatedCategory = typeof categoryData === 'object' && categoryData !== null
          ? { ...categoryData as object, [field]: checked }
          : { [field]: checked };
        
        return {
          ...prev,
          [category]: updatedCategory
        };
      });
    }
  };

  const handleCuisineTypeChange = (cuisine: CuisineType, checked: boolean) => {
    setFormData(prev => {
      const currentCuisines = prev.cuisineTypes || [];
      if (checked) {
        return { ...prev, cuisineTypes: [...currentCuisines, cuisine] };
      } else {
        return { ...prev, cuisineTypes: currentCuisines.filter(c => c !== cuisine) };
      }
    });
  };

  const handleTimeChange = (name: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value } as Partial<Restaurant>;
      const opening = name === 'openingTime' ? value : next.openingTime || '09:00';
      const closing = name === 'closingTime' ? value : next.closingTime || '22:00';
      const openingHours = `${opening} - ${closing}`;
      return { ...next, openingHours };
    });
  };
  
  // Reset edit mode when component mounts or when form data changes drastically
  useEffect(() => {
    return () => {
      // Clean up on unmount
      setIsEditingWithCity(false);
      setPreviousCountry(null);
    };
  }, []);

  return {
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleCuisineTypeChange,
    handleTimeChange,
    isEditingWithCity
  };
};
