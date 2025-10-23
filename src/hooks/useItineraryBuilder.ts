
import { useState, useCallback } from 'react';
import { CentralItinerary, ItineraryGenerationRequest, ItineraryDay } from '@/types/itinerary';
import { ItineraryService } from '@/services/itineraryService';
import { useToast } from '@/hooks/use-toast';

export interface UseItineraryBuilderReturn {
  itinerary: CentralItinerary | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateItinerary: (request: ItineraryGenerationRequest) => Promise<void>;
  updateItinerary: (updates: Partial<CentralItinerary>) => void;
  updateDay: (dayIndex: number, updates: Partial<ItineraryDay>) => void;
  addDay: () => void;
  removeDay: (dayIndex: number) => void;
  clearItinerary: () => void;
  saveItinerary: () => Promise<void>;
  exportItinerary: (format: 'pdf' | 'excel') => void;
}

export const useItineraryBuilder = (initialItinerary?: CentralItinerary): UseItineraryBuilderReturn => {
  const [itinerary, setItinerary] = useState<CentralItinerary | null>(initialItinerary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateItinerary = useCallback(async (request: ItineraryGenerationRequest) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const newItinerary = await ItineraryService.generateItinerary(request);
      setItinerary(newItinerary);
      
      toast({
        title: "Itinerary Generated",
        description: "AI has successfully created your travel itinerary.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate itinerary';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

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
      
      return {
        ...prev,
        days: updatedDays,
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

  const clearItinerary = useCallback(() => {
    setItinerary(null);
    setError(null);
  }, []);

  const saveItinerary = useCallback(async () => {
    if (!itinerary) return;
    
    try {
      setIsLoading(true);
      // In a real app, this would save to a backend
      console.log('Saving itinerary:', itinerary);
      
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
  }, [itinerary, toast]);

  const exportItinerary = useCallback((format: 'pdf' | 'excel') => {
    if (!itinerary) return;
    
    // In a real app, this would generate and download the file
    console.log(`Exporting itinerary as ${format}:`, itinerary);
    
    toast({
      title: "Export Started",
      description: `Your itinerary is being exported as ${format.toUpperCase()}.`,
    });
  }, [itinerary, toast]);

  return {
    itinerary,
    isLoading,
    isGenerating,
    error,
    generateItinerary,
    updateItinerary,
    updateDay,
    addDay,
    removeDay,
    clearItinerary,
    saveItinerary,
    exportItinerary,
  };
};
