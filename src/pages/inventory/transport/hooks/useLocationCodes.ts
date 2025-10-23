
import { useState, useEffect } from 'react';
import { LocationCode } from '../types/transportTypes';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

export const useLocationCodes = () => {
  const [locationCodes, setLocationCodes] = useState<LocationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load location codes from localStorage on component mount
  useEffect(() => {
    const loadLocationCodes = () => {
      try {
        const savedLocationCodes = localStorage.getItem('locationCodes');
        if (savedLocationCodes) {
          setLocationCodes(JSON.parse(savedLocationCodes));
        }
      } catch (error) {
        console.error('Error loading location codes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load location codes',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLocationCodes();
  }, [toast]);

  // Add a new location code
  const addLocationCode = (locationCode: Omit<LocationCode, 'id'>) => {
    const newLocationCode = { ...locationCode, id: uuidv4() };
    const updatedLocationCodes = [...locationCodes, newLocationCode];
    
    setLocationCodes(updatedLocationCodes);
    saveLocationCodes(updatedLocationCodes);
    
    return newLocationCode;
  };

  // Update an existing location code
  const updateLocationCode = (updatedLocationCode: LocationCode) => {
    const updatedLocationCodes = locationCodes.map(code => 
      code.id === updatedLocationCode.id ? updatedLocationCode : code
    );
    
    setLocationCodes(updatedLocationCodes);
    saveLocationCodes(updatedLocationCodes);
  };

  // Delete a location code
  const deleteLocationCode = (id: string) => {
    const updatedLocationCodes = locationCodes.filter(code => code.id !== id);
    
    setLocationCodes(updatedLocationCodes);
    saveLocationCodes(updatedLocationCodes);
  };

  // Save location codes to localStorage
  const saveLocationCodes = (codes: LocationCode[]) => {
    try {
      localStorage.setItem('locationCodes', JSON.stringify(codes));
    } catch (error) {
      console.error('Error saving location codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save location codes',
        variant: 'destructive',
      });
    }
  };

  return {
    locationCodes,
    setLocationCodes,
    addLocationCode,
    updateLocationCode,
    deleteLocationCode,
    isLoading,
  };
};
