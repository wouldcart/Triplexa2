
export * from './transportTypes';
export * from './visaTypes';
export * from './city';

// Add FilterStarRating and FilterHotelStatus to be exported from this file
import { FilterStarRating, FilterHotelStatus } from '@/components/inventory/hotels/types/hotel';
export type { FilterStarRating, FilterHotelStatus };

// Export TransferType for use in other modules
export interface TransferType {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  status: 'active' | 'inactive';
}
