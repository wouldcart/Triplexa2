import { useState } from 'react';
import { Country } from '../types/country';
import { CountriesService } from '@/services/countriesService';
import { mapDbCountryToFrontend, mapFrontendCountryToDbInsert, mapFrontendCountryToDbUpdate } from '@/services/countryMapper';

type CountryActionProps = {
  countries: Country[];
  setSelectedCountry: React.Dispatch<React.SetStateAction<Country | null>>;
  setEditFormData: React.Dispatch<React.SetStateAction<Country | null>>;
  setViewDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCountry: Country | null;
  editFormData: Country | null;
  newCountryData: Omit<Country, 'id' | 'created_at' | 'updated_at'>;
  setAddDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setImportDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resetNewCountryForm: () => void;
  setNewCountryData: React.Dispatch<React.SetStateAction<Omit<Country, 'id' | 'created_at' | 'updated_at'>>>;
  refreshCountries: () => Promise<void>;
  toast: any;
};

export const useCountryActions = ({
  countries,
  setSelectedCountry,
  setEditFormData,
  setViewDrawerOpen,
  setEditDrawerOpen,
  setDeleteDrawerOpen,
  selectedCountry,
  editFormData,
  newCountryData,
  setAddDrawerOpen,
  setImportDrawerOpen,
  resetNewCountryForm,
  setNewCountryData,
  refreshCountries,
  toast
}: CountryActionProps) => {
  
  // Handle view country
  const handleViewCountry = (country: Country) => {
    setSelectedCountry(country);
    setViewDrawerOpen(true);
  };

  // Handle edit country
  const handleEditCountry = (country: Country) => {
    setSelectedCountry(country);
    setEditFormData({ 
      ...country,
      // Ensure pricing_currency_override is properly initialized
      pricing_currency_override: Boolean(country.pricing_currency_override)
    });
    setEditDrawerOpen(true);
  };

  // Handle edit from view
  const handleEditFromView = () => {
    if (selectedCountry) {
      setEditFormData({ 
        ...selectedCountry,
        // Ensure pricing_currency_override is properly initialized
        pricing_currency_override: Boolean(selectedCountry.pricing_currency_override)
      });
      setViewDrawerOpen(false);
      setEditDrawerOpen(true);
    }
  };

  // Handle delete country
  const handleDeleteCountry = (country: Country) => {
    setSelectedCountry(country);
    setDeleteDrawerOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editFormData) return;
    
    try {
      // Validation checks
      if (!editFormData.name || !editFormData.code) {
        toast({
          title: "Validation Error",
          description: "Country name and code are required fields.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for duplicate country codes
      const isDuplicateCode = countries.some(
        country => country.id !== editFormData.id && country.code === editFormData.code
      );
      
      if (isDuplicateCode) {
        toast({
          title: "Validation Error",
          description: `Country code "${editFormData.code}" is already in use.`,
          variant: "destructive"
        });
        return;
      }
      
      // Update country in database
      const updateData = mapFrontendCountryToDbUpdate(editFormData);
      const response = await CountriesService.updateCountry(editFormData.id.toString(), updateData);
      
      if (response.success && response.data) {
        const updatedCountry = mapDbCountryToFrontend(response.data);
        
        // Refresh the countries list to reflect the changes
        await refreshCountries();
        
        setEditDrawerOpen(false);
        toast({
          title: "Country Updated",
          description: `${updatedCountry.name} has been successfully updated.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update country in database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating country:", error);
      toast({
        title: "Error",
        description: "Failed to update country. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedCountry) return;
    
    try {
      const response = await CountriesService.deleteCountry(selectedCountry.id.toString());
      
      if (response.success) {
        // Refresh the countries list to reflect the changes
        await refreshCountries();
        
        setDeleteDrawerOpen(false);
        toast({
          title: "Country Deleted",
          description: `${selectedCountry.name} has been removed from the system.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete country from database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting country:", error);
      toast({
        title: "Error",
        description: "Failed to delete country. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle add new country
  const handleAddCountry = () => {
    setAddDrawerOpen(true);
  };

  // Handle save new country
  const handleSaveNewCountry = async () => {
    try {
      // Validate required fields
      if (!newCountryData.name || !newCountryData.code) {
        toast({
          title: "Validation Error",
          description: "Country name and code are required fields.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for duplicate country codes
      const isDuplicateCode = countries.some(country => country.code === newCountryData.code);
      
      if (isDuplicateCode) {
        toast({
          title: "Validation Error",
          description: `Country code "${newCountryData.code}" is already in use.`,
          variant: "destructive"
        });
        return;
      }
      
      // Create country in database
      const insertData = mapFrontendCountryToDbInsert(newCountryData);
      const response = await CountriesService.createCountry(insertData);
      
      if (response.success && response.data) {
        const newCountry = mapDbCountryToFrontend(response.data);
        
        // Refresh the countries list to reflect the changes
        await refreshCountries();
        
        setAddDrawerOpen(false);
        
        toast({
          title: "Country Added",
          description: `${newCountry.name} has been successfully added.`,
        });
        
        // Reset the form data
        resetNewCountryForm();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create country in database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding country:", error);
      toast({
        title: "Error",
        description: "Failed to add country. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: string) => {
    try {
      const country = countries.find(c => c.id === id);
      if (!country) return;
      
      const newStatus = country.status === 'active' ? 'inactive' : 'active';
      const updateData = mapFrontendCountryToDbUpdate({ status: newStatus });
      
      const response = await CountriesService.updateCountry(id, updateData);
      
      if (response.success && response.data) {
        const updatedCountry = mapDbCountryToFrontend(response.data);
        const statusText = newStatus === 'active' ? 'Active' : 'Inactive';
        
        // Real-time hook will automatically update the state
        toast({
          title: "Country Status Updated",
          description: `${updatedCountry.name} status updated to ${statusText}.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update country status in database.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error toggling country status:", error);
      toast({
        title: "Error",
        description: "Failed to update country status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle form input change for editing
  const handleFormInputChange = (field: keyof Country, value: any) => {
    if (editFormData) {
      // Special handling for pricing currency override toggle
      if (field === 'pricing_currency_override') {
        if (value === false) {
          // When turning off the override, clear the pricing currency fields
          setEditFormData({
            ...editFormData,
            pricing_currency_override: false,
            pricing_currency: '',
            pricing_currency_symbol: ''
          });
        } else {
          // When turning on the override, just set the flag
          setEditFormData({
            ...editFormData,
            pricing_currency_override: true
          });
        }
      } else {
        // Normal field update
        setEditFormData({
          ...editFormData,
          [field]: value
        });
      }
    }
  };

  // Handle flag URL change specifically
  const handleFlagUrlChange = (url: string) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        flag_url: url
      });
    }
  };

  // Handle form input change for new country
  const handleNewCountryInputChange = (field: keyof Omit<Country, 'id' | 'created_at' | 'updated_at'>, value: any) => {
    setNewCountryData({
      ...newCountryData,
      [field]: value
    });
  };

  // Handle flag URL change for new country
  const handleNewCountryFlagUrlChange = (url: string) => {
    setNewCountryData({
      ...newCountryData,
      flag_url: url
    });
  };

  // Return both state values and handlers
  return {
    selectedCountry,
    editFormData,
    newCountryData,
    setNewCountryData,
    isViewSheetOpen: setViewDrawerOpen,
    setIsViewSheetOpen: setViewDrawerOpen,
    isEditSheetOpen: setEditDrawerOpen,
    setIsEditSheetOpen: setEditDrawerOpen,
    isDeleteDialogOpen: setDeleteDrawerOpen,
    setIsDeleteDialogOpen: setDeleteDrawerOpen,
    isAddSheetOpen: setAddDrawerOpen,
    setIsAddSheetOpen: setAddDrawerOpen,
    handleViewCountry,
    handleEditCountry,
    handleDeleteCountry,
    handleSaveEdit,
    handleConfirmDelete,
    handleAddCountry,
    handleSaveNewCountry,
    handleToggleStatus,
    handleFormInputChange,
    handleFlagUrlChange,
    handleNewCountryInputChange,
    handleNewCityInputChange: handleNewCountryInputChange, // Alias for compatibility
    handleNewCountryFlagUrlChange,
    handleEditFromView
  };
};
