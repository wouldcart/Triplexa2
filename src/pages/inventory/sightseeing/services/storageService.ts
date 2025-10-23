
import { Sightseeing } from "@/types/sightseeing";
import { sampleSightseeingData as sightseeingData } from "../data/initialData";

const STORAGE_KEY = 'sightseeingData';

// Load data from localStorage or use initial data if not found
export const loadSightseeingData = (): Sightseeing[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log('Loaded sightseeing data from localStorage:', parsedData.length, 'items');
      return parsedData;
    }
    
    // If no data in localStorage yet, store the initial data
    console.log('No data in localStorage, using initial data');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sightseeingData));
    return sightseeingData;
  } catch (error) {
    console.error('Failed to load sightseeing data:', error);
    return sightseeingData;
  }
};

// Save data to localStorage and dispatch update event
export const saveSightseeingData = (data: Sightseeing[]): void => {
  try {
    const dataToSave = data.map(item => ({
      ...item,
      // Ensure all pricing data is properly structured
      pricingOptions: item.pricingOptions?.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        type: option.type || 'Standard',
        name: option.name || option.type || 'Standard',
        adultPrice: Number(option.adultPrice) || 0,
        childPrice: Number(option.childPrice) || 0,
        isEnabled: option.isEnabled !== undefined ? option.isEnabled : true,
        description: option.description || ''
      })) || [],
      packageOptions: item.packageOptions?.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        adultPrice: Number(option.adultPrice) || 0,
        childPrice: Number(option.childPrice) || 0,
        isEnabled: option.isEnabled !== undefined ? option.isEnabled : true
      })) || [],
      groupSizeOptions: item.groupSizeOptions?.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        adultPrice: Number(option.adultPrice) || 0,
        childPrice: Number(option.childPrice) || 0
      })) || [],
      transferOptions: item.transferOptions?.map(option => ({
        ...option,
        id: option.id || Date.now() + Math.random(),
        price: Number(option.price) || 0,
        isEnabled: option.isEnabled !== undefined ? option.isEnabled : true
      })) || [],
      price: item.price ? {
        adult: Number(item.price.adult) || 0,
        child: Number(item.price.child) || 0
      } : { adult: 0, child: 0 },
      policies: item.policies || {
        highlights: [],
        inclusions: [],
        exclusions: [],
        cancellationPolicy: ''
      }
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    localStorage.setItem('sightseeings', JSON.stringify(dataToSave)); // Also save to alternative key for compatibility
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
    
    console.log('Saved sightseeing data to localStorage:', dataToSave.length, 'items');
  } catch (error) {
    console.error('Failed to save sightseeing data:', error);
  }
};

// Get a single sightseeing by ID
export const getSightseeingById = (id: number): Sightseeing | undefined => {
  const data = loadSightseeingData();
  const item = data.find(item => item.id === id);
  console.log('Retrieved sightseeing by ID:', id, item ? 'found' : 'not found');
  return item;
};

// Update a single sightseeing
export const updateSightseeing = (updatedItem: Sightseeing): void => {
  const data = loadSightseeingData();
  const updatedData = data.map(item => 
    item.id === updatedItem.id ? {
      ...updatedItem,
      lastUpdated: new Date().toISOString()
    } : item
  );
  saveSightseeingData(updatedData);
  console.log('Updated sightseeing:', updatedItem.name);
};

// Add a new sightseeing
export const addSightseeing = (newItem: Sightseeing): void => {
  const data = loadSightseeingData();
  const itemToAdd = {
    ...newItem,
    id: newItem.id || getNextId(),
    createdAt: newItem.createdAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  const updatedData = [...data, itemToAdd];
  saveSightseeingData(updatedData);
  console.log('Added new sightseeing:', itemToAdd.name, 'with pricing options:', itemToAdd.pricingOptions?.length || 0);
};

// Delete a sightseeing by ID
export const deleteSightseeingById = (id: number): void => {
  const data = loadSightseeingData();
  const updatedData = data.filter(item => item.id !== id);
  saveSightseeingData(updatedData);
  console.log('Deleted sightseeing with ID:', id);
};

// Get the next available ID
export const getNextId = (): number => {
  const data = loadSightseeingData();
  const maxId = Math.max(0, ...data.map(item => item.id));
  return maxId + 1;
};

// Search sightseeings by query
export const searchSightseeings = (query: string): Sightseeing[] => {
  const data = loadSightseeingData();
  const searchTerm = query.toLowerCase();
  
  return data.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.city.toLowerCase().includes(searchTerm) ||
    item.country.toLowerCase().includes(searchTerm) ||
    (item.description && item.description.toLowerCase().includes(searchTerm)) ||
    (item.category && item.category.toLowerCase().includes(searchTerm))
  );
};

// Validate sightseeing data
export const validateSightseeing = (data: Partial<Sightseeing>): string[] => {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Name is required');
  }
  
  if (!data.country?.trim()) {
    errors.push('Country is required');
  }
  
  if (!data.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!data.status) {
    errors.push('Status is required');
  }

  // Validate pricing if not free
  if (!data.isFree) {
    const hasPricing = 
      (data.price && (data.price.adult > 0 || data.price.child > 0)) ||
      (data.pricingOptions && data.pricingOptions.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0))) ||
      (data.packageOptions && data.packageOptions.some(o => o.isEnabled && (o.adultPrice > 0 || o.childPrice > 0))) ||
      (data.groupSizeOptions && data.groupSizeOptions.some(g => g.adultPrice > 0 || g.childPrice > 0)) ||
      (data.transferOptions && data.transferOptions.some(t => t.isEnabled && t.price > 0));
    
    if (!hasPricing) {
      errors.push('At least one pricing option with a price greater than zero is required');
    }
  }
  
  return errors;
};
