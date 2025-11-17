// Optional Records Types - Defines the structure for optional toggle functionality
// This file contains all TypeScript interfaces related to optional records management

export interface OptionalRecords {
  sightseeing?: ComponentOptionalRecord[];
  transport?: ComponentOptionalRecord[];
  days?: DayOptionalRecord[];
  cities?: CityOptionalRecord[];
}

export interface ComponentOptionalRecord {
  optionId: string;
  isOptional: boolean;
  updatedAt: string;
  updatedBy: string;
  cost?: number;
  description?: string;
  name?: string;
}

export interface DayOptionalRecord {
  day_number: number;
  sightseeing: ActivityOptionalRecord[];
  transport: TransportOptionalRecord[];
}

export interface ActivityOptionalRecord {
  id: string;
  name: string;
  is_optional: boolean;
  updatedAt: string;
  updatedBy: string;
  cost?: number;
  duration?: string;
  location?: string;
}

export interface TransportOptionalRecord {
  id: string;
  name: string;
  is_optional: boolean;
  updatedAt: string;
  updatedBy: string;
  cost?: number;
  route?: string;
  vehicleType?: string;
}

export interface CityOptionalRecord {
  cityId: string;
  cityName: string;
  sightseeing: ActivityOptionalRecord[];
  transport: TransportOptionalRecord[];
}

// Props interfaces for components
export interface OptionalToggleProps {
  isOptional: boolean;
  onToggle: (isOptional: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface RealTimeToggleProps extends OptionalToggleProps {
  itemId: string;
  itemType: 'activity' | 'transport' | 'sightseeing';
  proposalId: string;
  onRealTimeUpdate?: (itemId: string, itemType: 'activity' | 'transport' | 'sightseeing', isOptional: boolean) => Promise<void>;
  debounceDelay?: number;
  showStatusIndicator?: boolean;
}

// Service interfaces
export interface UpdateOptionalRecordsRequest {
  itemId: string;
  itemType: 'activity' | 'transport' | 'sightseeing';
  isOptional: boolean;
  dayNumber?: number;
  updatePath?: string[];
  proposalId: string;
}

export interface UpdateOptionalRecordsResponse {
  success: boolean;
  data?: {
    optional_records: OptionalRecords;
    last_saved: string;
  };
  error?: string;
}

// Hook interfaces
export interface UseOptionalRecordsReturn {
  optionalRecords: OptionalRecords;
  isLoading: boolean;
  error: string | null;
  updateOptionalItem: (itemId: string, itemType: 'activity' | 'transport' | 'sightseeing', isOptional: boolean) => Promise<void>;
  getOptionalStatus: (itemId: string, itemType: 'activity' | 'transport' | 'sightseeing') => boolean;
  refreshOptionalRecords: () => Promise<void>;
}

// Enhanced proposal interface with optional records
export interface ProposalWithOptionalRecords {
  id: string;
  proposal_id: string;
  enquiry_id: string;
  optional_records: OptionalRecords;
  itinerary_data: any[];
  last_saved: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Status indicators for UI feedback
export interface OptionalItemStatus {
  isOptional: boolean;
  isUpdating: boolean;
  lastUpdated?: Date;
  error?: string;
}

// Configuration for optional records behavior
export interface OptionalRecordsConfig {
  enableDebouncing: boolean;
  debounceDelay: number;
  enableRealTimeSync: boolean;
  enableOfflineSupport: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

// Default configuration
export const DEFAULT_OPTIONAL_RECORDS_CONFIG: OptionalRecordsConfig = {
  enableDebouncing: true,
  debounceDelay: 1000, // 1 second
  enableRealTimeSync: true,
  enableOfflineSupport: true,
  maxRetryAttempts: 3,
  retryDelay: 1000, // 1 second
};