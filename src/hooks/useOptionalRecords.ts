import { useState, useEffect, useCallback, useRef } from 'react';

// UUID validation regex - shared across the hook
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENQUIRY_REGEX = /^ENQ\d{8,}$/i;
const DEQ_ENQUIRY_REGEX = /^DEQ\/\d{4}\/\d{3,}$/i;
const DRAFT_REGEX = /^DRAFT-ENQ\d{8,}.*$/i;
import { supabase } from '@/lib/supabaseClient';
import { 
  OptionalRecords, 
  UseOptionalRecordsReturn,
  OptionalRecordsConfig,
  DEFAULT_OPTIONAL_RECORDS_CONFIG,
  ComponentOptionalRecord
} from '@/types/optionalRecords';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Direct Supabase functions for optional records
 */

/**
 * Get optional records for a specific proposal directly from Supabase
 */
async function getOptionalRecordsDirect(proposalId: string): Promise<OptionalRecords> {
  try {
    console.log(`📋 Fetching optional records for proposal: ${proposalId}`);
    
    // Validate proposalId format - accept UUIDs, ENQ format, DEQ format, and draft format
    if (!UUID_REGEX.test(proposalId) && !ENQUIRY_REGEX.test(proposalId) && !DEQ_ENQUIRY_REGEX.test(proposalId) && !DRAFT_REGEX.test(proposalId)) {
      console.warn(`⚠️ Invalid format for proposalId: ${proposalId}. Using empty records.`);
      return {};
    }
    
    // Determine which field to query by
    let query = supabase.from('proposals').select('optional_records');
    
    if (UUID_REGEX.test(proposalId)) {
      // If it's a UUID, query by the 'id' field
      query = query.eq('id', proposalId);
    } else {
      // If it's an enquiry ID or draft format, query by the 'proposal_id' field
      query = query.eq('proposal_id', proposalId);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('❌ Error fetching optional records:', error);
      throw new Error(`Failed to fetch optional records: ${error.message}`);
    }

    // Handle case where no record is found
    if (!data) {
      console.log('ℹ️ No proposal record found, returning empty optional records');
      return {};
    }

    const optionalRecords = data?.optional_records || {};
    console.log('✅ Optional records fetched successfully:', optionalRecords);
    return optionalRecords;
    
  } catch (error) {
    console.error('❌ Exception in getOptionalRecordsDirect:', error);
    throw error;
  }
}

/**
 * Update optional status for a specific item directly in Supabase
 */
async function updateOptionalItemDirect(
  proposalId: string,
  itemType: 'activity' | 'transport' | 'sightseeing',
  itemId: string,
  isOptional: boolean,
  userId: string
): Promise<boolean> {
  try {
    console.log(`🔄 Updating optional status: ${itemType} ${itemId} -> ${isOptional ? 'optional' : 'included'}`);
    
    // Get current optional records
    const currentRecords = await getOptionalRecordsDirect(proposalId);
    
    // Determine the record type mapping
    const recordType = mapItemTypeToRecordType(itemType);
    
    // Initialize structure if needed
    if (!currentRecords[recordType]) {
      currentRecords[recordType] = [];
    }

    // Find existing record or create new one
    const records = currentRecords[recordType] as ComponentOptionalRecord[];
    const existingIndex = records.findIndex((record: ComponentOptionalRecord) => 
      record.optionId === itemId
    );

    const updatedRecord: ComponentOptionalRecord = {
      optionId: itemId,
      isOptional,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      ...(existingIndex >= 0 ? records[existingIndex] : {})
    };

    if (existingIndex >= 0) {
      records[existingIndex] = updatedRecord;
    } else {
      records.push(updatedRecord);
    }

    // Determine which field to update by
    let updateQuery = supabase
      .from('proposals')
      .update({
        optional_records: currentRecords,
        last_saved: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (UUID_REGEX.test(proposalId)) {
      // If it's a UUID, update by the 'id' field
      updateQuery = updateQuery.eq('id', proposalId);
    } else {
      // If it's an enquiry ID or draft format, update by the 'proposal_id' field
      updateQuery = updateQuery.eq('proposal_id', proposalId);
    }

    const { error } = await updateQuery;

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log('✅ Optional item updated successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error updating optional item:', error);
    throw error;
  }
}

/**
 * Map item type to record type
 */
function mapItemTypeToRecordType(itemType: string): keyof OptionalRecords {
  switch (itemType) {
    case 'activity':
    case 'sightseeing':
      return 'sightseeing';
    case 'transport':
      return 'transport';
    default:
      return 'sightseeing';
  }
}

/**
 * useOptionalRecords Hook - Direct Supabase Implementation
 */
export const useOptionalRecords = (
  proposalId: string | null,
  config: Partial<OptionalRecordsConfig> = {}
): UseOptionalRecordsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_OPTIONAL_RECORDS_CONFIG, ...config };
  
  // State management
  const [optionalRecords, setOptionalRecords] = useState<OptionalRecords>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Refs for internal state
  const pendingUpdates = useRef<Map<string, boolean>>(new Map());
  const subscriptionRef = useRef<(() => void) | null>(null);
  const isMounted = useRef(true);

  /**
   * Initialize optional records and setup real-time subscription
   */
  useEffect(() => {
    if (!proposalId || !user) {
      console.log('⚠️ Skipping optional records initialization - missing proposalId or user');
      return;
    }

    // Validate proposalId format - accept UUIDs, ENQ format, DEQ format, and draft format
    if (!UUID_REGEX.test(proposalId) && !ENQUIRY_REGEX.test(proposalId) && !DEQ_ENQUIRY_REGEX.test(proposalId) && !DRAFT_REGEX.test(proposalId)) {
      console.warn(`⚠️ Invalid format for proposalId: ${proposalId}. Skipping optional records initialization.`);
      return;
    }

    const initializeOptionalRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`🔄 Initializing optional records for proposal: ${proposalId}`);
        
        // Fetch initial data
        const records = await getOptionalRecordsDirect(proposalId);
        
        if (isMounted.current) {
          setOptionalRecords(records);
          console.log('✅ Optional records initialized successfully');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load optional records';
        console.error('❌ Error initializing optional records:', error);
        
        if (isMounted.current) {
          setError(errorMessage);
          toast({
            title: "Error Loading Optional Records",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Setup real-time subscription
    const setupSubscription = () => {
      if (!finalConfig.enableRealTimeSync) return;
      
      console.log(`🔔 Setting up real-time subscription for proposal: ${proposalId}`);
      
      try {
        // Determine which field to filter by
        const filter = UUID_REGEX.test(proposalId) ? `id=eq.${proposalId}` : `proposal_id=eq.${proposalId}`;
        
        const unsubscribe = supabase
          .channel(`proposal-${proposalId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'proposals',
              filter: filter
            },
            (payload) => {
              console.log('📡 Real-time update received:', payload);
              const newOptionalRecords = payload.new.optional_records || {};
              if (isMounted.current) {
                setOptionalRecords(newOptionalRecords);
              }
            }
          )
          .subscribe();
        
        subscriptionRef.current = unsubscribe;
        console.log('✅ Real-time subscription setup successful');
      } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error);
        subscriptionRef.current = null;
      }
    };

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      console.log('📡 Back online, refreshing optional records');
      initializeOptionalRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📶 Gone offline');
    };

    // Initialize
    initializeOptionalRecords();
    setupSubscription();
    
    // Setup event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      console.log(`🔕 Cleaning up optional records for proposal: ${proposalId}`);
      
      if (subscriptionRef.current && typeof subscriptionRef.current === 'function') {
        try {
          subscriptionRef.current();
        } catch (error) {
          console.error('Error unsubscribing from real-time updates:', error);
        }
        subscriptionRef.current = null;
      }
      
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [proposalId, user, finalConfig.enableRealTimeSync, toast]);

  /**
   * Update optional status for a specific item
   */
  const updateOptionalItem = useCallback(async (
    itemId: string,
    itemType: 'activity' | 'transport' | 'sightseeing',
    isOptional: boolean
  ): Promise<void> => {
    if (!proposalId || !user) {
      console.warn('⚠️ Cannot update optional item - missing proposalId or user');
      return;
    }

    // Validate proposalId format - accept UUIDs, ENQ format, DEQ format, and draft format
    if (!UUID_REGEX.test(proposalId) && !ENQUIRY_REGEX.test(proposalId) && !DEQ_ENQUIRY_REGEX.test(proposalId) && !DRAFT_REGEX.test(proposalId)) {
      console.warn(`⚠️ Invalid format for proposalId: ${proposalId}. Skipping update.`);
      return;
    }

    const updateKey = `${itemType}-${itemId}`;
    
    try {
      // Optimistic update
      if (finalConfig.enableDebouncing) {
        pendingUpdates.current.set(updateKey, true);
        
        // Update local state immediately
        setOptionalRecords(prev => {
          const newRecords = { ...prev };
          const recordType = mapItemTypeToRecordType(itemType);
          
          if (!newRecords[recordType]) {
            newRecords[recordType] = [];
          }
          
          const records = newRecords[recordType] as any[];
          const existingIndex = records.findIndex(r => r.optionId === itemId);
          
          const updatedRecord = {
            optionId: itemId,
            isOptional,
            updatedAt: new Date().toISOString(),
            updatedBy: user.id
          };
          
          if (existingIndex >= 0) {
            records[existingIndex] = updatedRecord;
          } else {
            records.push(updatedRecord);
          }
          
          return newRecords;
        });
      }

      // Perform actual update
      await updateOptionalItemDirect(
        proposalId,
        itemType,
        itemId,
        isOptional,
        user.id
      );

      pendingUpdates.current.delete(updateKey);
      
      // Show success toast
      toast({
        title: "Updated",
        description: `Item marked as ${isOptional ? 'optional' : 'required'}`,
        variant: "default",
        duration: 2000,
      });

    } catch (error) {
      pendingUpdates.current.delete(updateKey);
      
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      console.error('❌ Error updating optional item:', error);
      
      setError(errorMessage);
      
      // Revert optimistic update on error
      if (finalConfig.enableDebouncing) {
        setOptionalRecords(prev => {
          const newRecords = { ...prev };
          const recordType = mapItemTypeToRecordType(itemType);
          
          if (newRecords[recordType]) {
            const records = newRecords[recordType] as any[];
            const existingIndex = records.findIndex(r => r.optionId === itemId);
            
            if (existingIndex >= 0) {
              // Revert to previous state
              records[existingIndex].isOptional = !isOptional;
            }
          }
          
          return newRecords;
        });
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      throw error;
    }
  }, [proposalId, user, finalConfig.enableDebouncing, toast]);

  /**
   * Get optional status for a specific item
   */
  const getOptionalStatus = useCallback((
    itemId: string,
    itemType: 'activity' | 'transport' | 'sightseeing'
  ): boolean => {
    try {
      const recordType = mapItemTypeToRecordType(itemType);
      const records = optionalRecords?.[recordType] || [];
      const record = records.find((r: ComponentOptionalRecord) => r.optionId === itemId);
      return record?.isOptional || false;
    } catch (error) {
      console.error('❌ Error getting optional status:', error);
      return false; // Default to included on error
    }
  }, [optionalRecords]);

  /**
   * Refresh optional records from database
   */
  const refreshOptionalRecords = useCallback(async (): Promise<void> => {
    if (!proposalId) return;

    try {
      setIsLoading(true);
      const records = await getOptionalRecordsDirect(proposalId);
      setOptionalRecords(records);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh';
      setError(errorMessage);
      console.error('❌ Error refreshing optional records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;
      pendingUpdates.current.clear();
      
      if (subscriptionRef.current && typeof subscriptionRef.current === 'function') {
        try {
          subscriptionRef.current();
        } catch (error) {
          console.error('Error unsubscribing from real-time updates during cleanup:', error);
        }
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    optionalRecords,
    isLoading,
    error,
    isOnline,
    updateOptionalItem,
    getOptionalStatus,
    refreshOptionalRecords,
  };
};

/**
 * useOptionalItem Hook - Simplified hook for managing a single optional item's state
 */
export const useOptionalItem = (
  proposalId: string | null,
  itemId: string,
  itemType: 'activity' | 'transport' | 'sightseeing'
) => {
  const {
    optionalRecords,
    isLoading,
    error,
    updateOptionalItem,
    getOptionalStatus,
  } = useOptionalRecords(proposalId);

  const isOptional = getOptionalStatus(itemId, itemType);

  const updateItem = useCallback(async (newOptional: boolean) => {
    return updateOptionalItem(itemId, itemType, newOptional);
  }, [updateOptionalItem, itemId, itemType]);

  return {
    isOptional,
    isLoading,
    error,
    updateItem,
  };
};

export default useOptionalRecords;