
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useRestaurantsData } from './useRestaurantsData';
import { useFormState } from './form/useFormState';
import { useLocationOptions } from './form/useLocationOptions';
import { useCuisineOptions } from './form/useCuisineOptions';
import { useFormHandlers } from './form/useFormHandlers';
import { useFormValidation } from './form/useFormValidation';
import { useFormSubmit } from './form/useFormSubmit';
import { useEditModeEffect } from './form/useEditModeEffect';
import { useCurrencyUpdate } from './form/useCurrencyUpdate';
import { useCountryCityEffect } from './form/useCountryCityEffect';

export const useRestaurantForm = () => {
  const { id } = useParams<{ id: string }>();
  const { restaurants, saveRestaurant } = useRestaurantsData();
  
  const isEditMode = !!id;
  
  // Get form state
  const { formData, setFormData } = useFormState();
  
  // Get location options
  const { 
    countryOptions, 
    cityOptions, 
    filteredCityOptions, 
    setFilteredCityOptions,
    filterCitiesByCountry
  } = useLocationOptions();
  
  // Get cuisine options
  const { cuisineOptions } = useCuisineOptions();
  
  // Form handlers
  const { 
    handleInputChange, 
    handleSelectChange, 
    handleCheckboxChange,
    handleCuisineTypeChange,
    handleTimeChange 
  } = useFormHandlers({ setFormData });
  
  // Form validation
  const { validateForm } = useFormValidation({ formData });
  
  // Form submission
  const { handleSubmit } = useFormSubmit({ 
    formData, 
    validateForm, 
    saveRestaurant 
  });
  
  // Handle edit mode
  useEditModeEffect({
    isEditMode,
    restaurants,
    countryOptions,
    cityOptions,
    setFilteredCityOptions,
    setFormData
  });
  
  // Update currency when country changes
  useCurrencyUpdate({ formData, countryOptions, setFormData });
  
  // Filter cities when country changes
  useCountryCityEffect({ 
    formData, 
    cityOptions,
    filterCitiesByCountry 
  });

  return {
    formData,
    isEditMode,
    countryOptions,
    filteredCityOptions,
    cuisineOptions,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleCuisineTypeChange,
    handleTimeChange,
    handleSubmit,
    validateForm
  };
};

export default useRestaurantForm;
