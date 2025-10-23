
export type VisaStatus = 'active' | 'disabled';

export interface VisaDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  format?: string;
}

// Legacy interface for backward compatibility
export interface Visa {
  id: string;
  country: string;
  visaType: string;
  processingTime: string;
  validity: string;
  price: number;
  isRushAvailable: boolean;
  rushProcessingTime?: string;
  rushPrice?: number;
  status: VisaStatus;
  requirements: string;
  documents: VisaDocument[];
}

// New interface matching Supabase schema exactly
export interface SupabaseVisa {
  id: string;
  country: string;
  visa_type: string;
  processing_time: string | null;
  validity: string | null;
  price: number | null;
  is_rush_available: boolean | null;
  rush_processing_time: string | null;
  rush_price: number | null;
  status: VisaStatus;
  requirements: string | null;
  documents: VisaDocument[] | null;
  created_at: string | null;
  updated_at: string | null;
}

// Form interface for creating/editing visas
export interface VisaFormData {
  country: string;
  visa_type: string;
  processing_time?: string;
  validity?: string;
  price?: number;
  is_rush_available?: boolean;
  rush_processing_time?: string;
  rush_price?: number;
  status: VisaStatus;
  requirements?: string;
  documents?: VisaDocument[];
}

// Visa settings interface
export interface VisaSettings {
  defaultProcessingDays: number;
  defaultValidity: string;
  defaultCurrency: string;
  rushProcessingFee: number;
  requireHotelBooking: boolean;
  requireReturnTicket: boolean;
  requireInsurance: boolean;
  automaticApproval: boolean;
}
