
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CentralItinerary, ItineraryDay } from '@/types/itinerary';
import { useToast } from '@/hooks/use-toast';

interface ItineraryContextType {
  itinerary: CentralItinerary | null;
  isLoading: boolean;
  error: string | null;
  updateItinerary: (updates: Partial<CentralItinerary>) => void;
  updateDay: (dayIndex: number, updates: Partial<ItineraryDay>) => void;
  addDay: () => void;
  removeDay: (dayIndex: number) => void;
  saveItinerary: () => Promise<void>;
  loadItinerary: (queryId: string) => Promise<void>;
  clearItinerary: () => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const useItineraryContext = () => {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItineraryContext must be used within an ItineraryProvider');
  }
  return context;
};

interface ItineraryProviderProps {
  children: React.ReactNode;
  queryId?: string;
}

export const ItineraryProvider: React.FC<ItineraryProviderProps> = ({
  children,
  queryId
}) => {
  const [itinerary, setItinerary] = useState<CentralItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    if (itinerary && queryId) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`itinerary_${queryId}`, JSON.stringify(itinerary));
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [itinerary, queryId]);

  const loadItinerary = useCallback(async (targetQueryId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const saved = localStorage.getItem(`itinerary_${targetQueryId}`);
      if (saved) {
        const parsedItinerary = JSON.parse(saved);
        setItinerary(parsedItinerary);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load itinerary';
      setError(errorMessage);
      console.error('Error loading itinerary:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateItinerary = useCallback((updates: Partial<CentralItinerary>) => {
    if (!itinerary) return;
    
    setItinerary(prev => prev ? {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    } : null);
  }, [itinerary]);

  const updateDay = useCallback((dayIndex: number, updates: Partial<ItineraryDay>) => {
    if (!itinerary || dayIndex < 0 || dayIndex >= itinerary.days.length) return;
    
    setItinerary(prev => {
      if (!prev) return null;
      
      const updatedDays = [...prev.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        ...updates,
      };
      
      // Recalculate pricing
      const totalCost = updatedDays.reduce((sum, day) => sum + day.totalCost, 0);
      
      return {
        ...prev,
        days: updatedDays,
        pricing: {
          ...prev.pricing,
          baseCost: totalCost,
          finalPrice: totalCost + (prev.pricing.markup || 0),
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [itinerary]);

  const addDay = useCallback(() => {
    if (!itinerary) return;
    
    const newDayNumber = itinerary.days.length + 1;
    const lastDay = itinerary.days[itinerary.days.length - 1];
    const newDate = new Date(lastDay?.date || itinerary.startDate);
    newDate.setDate(newDate.getDate() + 1);
    
    const newDay: ItineraryDay = {
      id: `day-${newDayNumber}`,
      day: newDayNumber,
      date: newDate.toISOString().split('T')[0],
      location: lastDay?.location || itinerary.destinations[0],
      activities: [],
      meals: [],
      totalCost: 0,
    };
    
    updateItinerary({
      days: [...itinerary.days, newDay],
      duration: {
        ...itinerary.duration,
        days: itinerary.duration.days + 1,
      },
    });
  }, [itinerary, updateItinerary]);

  const removeDay = useCallback((dayIndex: number) => {
    if (!itinerary || dayIndex < 0 || dayIndex >= itinerary.days.length) return;
    
    const updatedDays = itinerary.days.filter((_, index) => index !== dayIndex);
    // Renumber remaining days
    const renumberedDays = updatedDays.map((day, index) => ({
      ...day,
      day: index + 1,
    }));
    
    updateItinerary({
      days: renumberedDays,
      duration: {
        ...itinerary.duration,
        days: itinerary.duration.days - 1,
        nights: Math.max(0, itinerary.duration.nights - 1),
      },
    });
  }, [itinerary, updateItinerary]);

  const saveItinerary = useCallback(async () => {
    if (!itinerary || !queryId) return;
    
    try {
      setIsLoading(true);
      localStorage.setItem(`itinerary_${queryId}`, JSON.stringify(itinerary));
      
      toast({
        title: "Itinerary Saved",
        description: "Your itinerary has been saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Save Failed",
        description: "Failed to save itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [itinerary, queryId, toast]);

  const clearItinerary = useCallback(() => {
    setItinerary(null);
    setError(null);
  }, []);

  // Load itinerary on mount if queryId provided
  useEffect(() => {
    if (queryId) {
      loadItinerary(queryId);
    }
  }, [queryId, loadItinerary]);

  const value = {
    itinerary,
    isLoading,
    error,
    updateItinerary,
    updateDay,
    addDay,
    removeDay,
    saveItinerary,
    loadItinerary,
    clearItinerary,
  };

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
};
