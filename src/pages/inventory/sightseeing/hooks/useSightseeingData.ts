
import { useState, useEffect } from 'react';
import { Sightseeing } from '@/types/sightseeing';
import { useToast } from '@/hooks/use-toast';
import { listSightseeings, createSightseeing, updateSightseeing as updateSightseeingDb, deleteSightseeing as deleteSightseeingDb } from '../services/sightseeingService';

export const useSightseeingData = () => {
  const [sightseeings, setSightseeings] = useState<Sightseeing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Ensure all sightseeing IDs are unique to avoid UI key collisions
  const ensureUniqueIds = (items: Sightseeing[]): Sightseeing[] => {
    const seen = new Set<number>();
    let maxId = items.reduce((max, s) => (typeof s.id === 'number' ? Math.max(max, s.id) : max), 0);
    return items.map((s) => {
      if (typeof s.id !== 'number') {
        maxId += 1;
        return { ...s, id: maxId };
      }
      if (!seen.has(s.id)) {
        seen.add(s.id);
        return s;
      }
      // Duplicate ID found; assign a new unique ID
      maxId += 1;
      return { ...s, id: maxId };
    });
  };

  // Load from Supabase only (no local/dummy fallback)
  const loadSightseeingsFromRemote = async () => {
    try {
      const data = await listSightseeings();
      console.log('Loaded sightseeings from Supabase:', data?.length || 0, 'items');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading sightseeings from Supabase:', error);
      return [];
    }
  };

  // Load initial data
  useEffect(() => {
    const loadSightseeings = async () => {
      setLoading(true);
      const data = await loadSightseeingsFromRemote();
      const deduped = ensureUniqueIds(data);
      setSightseeings(deduped);
      setLoading(false);
    };

    loadSightseeings();
  }, []);

  // Listen for storage changes to sync across tabs/components
  useEffect(() => {
    const handleStorageChange = () => {
      // For compatibility, refresh from remote on any storage change
      console.log('Storage changed, reloading sightseeings from remote');
      refreshSightseeings();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Custom event listener for same-tab updates
  useEffect(() => {
    const handleSightseeingUpdate = () => {
      console.log('Sightseeing update event received, reloading data from remote');
      refreshSightseeings();
    };

    window.addEventListener('sightseeingUpdated', handleSightseeingUpdate);
    return () => window.removeEventListener('sightseeingUpdated', handleSightseeingUpdate);
  }, []);

  // No longer persist to localStorage; Supabase is the source of truth

  const addSightseeing = async (newSightseeing: Omit<Sightseeing, 'id' | 'createdAt' | 'lastUpdated'>) => {
    try {
      const payload: Sightseeing = {
        ...newSightseeing,
        id: 0, // ignored by DB on insert (bigserial)
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      } as Sightseeing;

      const created = await createSightseeing(payload);
      setSightseeings(prev => {
        const updated = ensureUniqueIds([...prev, created]);
        window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
        return updated;
      });
      toast({
        title: "Sightseeing added",
        description: `"${created.name}" has been added successfully.`,
      });
    } catch (error) {
      console.error('Error creating sightseeing:', error);
      toast({
        title: 'Create failed',
        description: 'An error occurred while creating the sightseeing.',
        variant: 'destructive'
      });
    }
  };

  const updateSightseeing = async (id: number, updates: Partial<Sightseeing>) => {
    try {
      const existing = sightseeings.find(s => s.id === id);
      if (!existing) return;
      const updatedPayload: Sightseeing = {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      const updated = await updateSightseeingDb(updatedPayload);
      setSightseeings(prev => {
        const next = ensureUniqueIds(prev.map(s => (s.id === id ? updated : s)));
        window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
        return next;
      });
      toast({
        title: 'Sightseeing updated',
        description: 'The sightseeing has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating sightseeing:', error);
      toast({
        title: 'Update failed',
        description: 'An error occurred while updating the sightseeing.',
        variant: 'destructive'
      });
    }
  };

  const deleteSightseeing = async (id: number) => {
    try {
      const sightseeing = sightseeings.find(s => s.id === id);
      await deleteSightseeingDb(id);
      setSightseeings(prev => {
        const updated = ensureUniqueIds(prev.filter(s => s.id !== id));
        window.dispatchEvent(new CustomEvent('sightseeingUpdated'));
        return updated;
      });
      toast({
        title: 'Sightseeing deleted',
        description: `"${sightseeing?.name}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting sightseeing:', error);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the sightseeing.',
        variant: 'destructive'
      });
    }
  };

  // Import/Export removed for remote-only data policy

  // Function to refresh data manually
  const refreshSightseeings = async () => {
    console.log('Manually refreshing sightseeings from Supabase');
    const data = await loadSightseeingsFromRemote();
    const deduped = ensureUniqueIds(data);
    setSightseeings(deduped);
  };

  return {
    sightseeings,
    setSightseeings,
    loading,
    addSightseeing,
    updateSightseeing,
    deleteSightseeing,
    refreshSightseeings
  };
};
