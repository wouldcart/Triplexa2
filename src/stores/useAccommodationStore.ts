import { useState, useCallback, useEffect } from 'react';
import { AccommodationOption } from '@/types/enhancedMarkup';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';

interface AccommodationStore {
  accommodations: AccommodationOption[];
  selectedAccommodations: AccommodationOption[];
  loading: boolean;
  error: string | null;
}

export const useAccommodationStore = (queryId: string, draftType: 'daywise' | 'enhanced' = 'enhanced') => {
  const [store, setStore] = useState<AccommodationStore>({
    accommodations: [],
    selectedAccommodations: [],
    loading: false,
    error: null
  });

  const proposalPersistence = useProposalPersistence(queryId, draftType);

  const storageKey = `accommodations_${queryId}`;
  const selectedStorageKey = `selected_accommodations_${queryId}`;

  // Load accommodations from storage
  const loadAccommodations = useCallback(() => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      
      const storedAccommodations = localStorage.getItem(storageKey);
      const storedSelected = localStorage.getItem(selectedStorageKey);
      
      const accommodations = storedAccommodations ? JSON.parse(storedAccommodations) : [];
      const selectedAccommodations = storedSelected ? JSON.parse(storedSelected) : [];
      
      setStore(prev => ({
        ...prev,
        accommodations,
        selectedAccommodations,
        loading: false
      }));
      
      return { accommodations, selectedAccommodations };
    } catch (error) {
      console.error('Error loading accommodations:', error);
      setStore(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load accommodations'
      }));
      return { accommodations: [], selectedAccommodations: [] };
    }
  }, [storageKey, selectedStorageKey]);

  // Save accommodations to storage
  const saveAccommodations = useCallback((accommodations: AccommodationOption[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(accommodations));
      setStore(prev => ({ ...prev, accommodations, error: null }));
      
      // Trigger storage event for cross-component synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(accommodations)
      }));
      
      return true;
    } catch (error) {
      console.error('Error saving accommodations:', error);
      setStore(prev => ({ ...prev, error: 'Failed to save accommodations' }));
      return false;
    }
  }, [storageKey]);

  // Save selected accommodations (with persistence integration)
  const saveSelectedAccommodations = useCallback((selectedAccommodations: AccommodationOption[]) => {
    try {
      localStorage.setItem(selectedStorageKey, JSON.stringify(selectedAccommodations));
      setStore(prev => ({ ...prev, selectedAccommodations, error: null }));
      
      // Update proposal persistence as well
      proposalPersistence.updateAccommodationData({
        selectedAccommodations,
        markupData: proposalPersistence.data.accommodationData.markupData
      });
      
      // Trigger storage event for cross-component synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: selectedStorageKey,
        newValue: JSON.stringify(selectedAccommodations)
      }));
      
      return true;
    } catch (error) {
      console.error('Error saving selected accommodations:', error);
      setStore(prev => ({ ...prev, error: 'Failed to save selected accommodations' }));
      return false;
    }
  }, [selectedStorageKey, proposalPersistence]);

  // Add accommodation to available list
  const addAccommodation = useCallback((accommodation: AccommodationOption) => {
    const newAccommodations = [...store.accommodations, accommodation];
    return saveAccommodations(newAccommodations);
  }, [store.accommodations, saveAccommodations]);

  // Remove accommodation from available list
  const removeAccommodation = useCallback((accommodationId: string) => {
    const filtered = store.accommodations.filter(acc => acc.id !== accommodationId);
    return saveAccommodations(filtered);
  }, [store.accommodations, saveAccommodations]);

  // Select accommodation (move to selected list)
  const selectAccommodation = useCallback((accommodation: AccommodationOption) => {
    if (store.selectedAccommodations.some(acc => acc.id === accommodation.id)) {
      return false; // Already selected
    }
    
    const newSelected = [...store.selectedAccommodations, accommodation];
    return saveSelectedAccommodations(newSelected);
  }, [store.selectedAccommodations, saveSelectedAccommodations]);

  // Deselect accommodation (remove from selected list)
  const deselectAccommodation = useCallback((accommodationId: string) => {
    const filtered = store.selectedAccommodations.filter(acc => acc.id !== accommodationId);
    return saveSelectedAccommodations(filtered);
  }, [store.selectedAccommodations, saveSelectedAccommodations]);

  // Update accommodation in both lists
  const updateAccommodation = useCallback((accommodationId: string, updates: Partial<AccommodationOption>) => {
    // Update in accommodations list
    const updatedAccommodations = store.accommodations.map(acc =>
      acc.id === accommodationId ? { ...acc, ...updates } : acc
    );
    
    // Update in selected list if present
    const updatedSelected = store.selectedAccommodations.map(acc =>
      acc.id === accommodationId ? { ...acc, ...updates } : acc
    );
    
    const success1 = saveAccommodations(updatedAccommodations);
    const success2 = saveSelectedAccommodations(updatedSelected);
    
    return success1 && success2;
  }, [store.accommodations, store.selectedAccommodations, saveAccommodations, saveSelectedAccommodations]);

  // Clear all accommodations
  const clearAccommodations = useCallback(() => {
    const success1 = saveAccommodations([]);
    const success2 = saveSelectedAccommodations([]);
    return success1 && success2;
  }, [saveAccommodations, saveSelectedAccommodations]);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const accommodations = JSON.parse(e.newValue);
        setStore(prev => ({ ...prev, accommodations }));
      } else if (e.key === selectedStorageKey && e.newValue) {
        const selectedAccommodations = JSON.parse(e.newValue);
        setStore(prev => ({ ...prev, selectedAccommodations }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, selectedStorageKey]);

  // Load data on mount
  useEffect(() => {
    loadAccommodations();
  }, [loadAccommodations]);

  return {
    accommodations: store.accommodations,
    selectedAccommodations: store.selectedAccommodations,
    loading: store.loading,
    error: store.error,
    addAccommodation,
    removeAccommodation,
    selectAccommodation,
    deselectAccommodation,
    updateAccommodation,
    clearAccommodations,
    loadAccommodations,
    saveAccommodations,
    saveSelectedAccommodations
  };
};