import { supabase } from '@/lib/supabaseClient';
import type { Json } from '@/integrations/supabase/types';

export type VisaBookingInsert = {
  applicant_name: string;
  email: string;
  phone: string;
  country: string;
  visa_type: string;
  visa_id?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  documents?: Json[] | null;
};

export interface BookingResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class VisaBookingService {
  static async createBooking(payload: VisaBookingInsert): Promise<BookingResponse<{ id: string }>> {
    try {
      // Cast client to allow querying tables not present in generated types
      const sb: any = supabase;
      const { data, error } = await sb
        .from('visa_booking')
        .insert(payload)
        .select('id')
        .single();
      if (error) {
        console.warn('visa_booking insert failed:', error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data, error: null, success: true };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error', success: false };
    }
  }

  static async listBookings(): Promise<BookingResponse<any[]>> {
    try {
      const sb: any = supabase;
      const { data, error } = await sb
        .from('visa_booking')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('visa_booking select failed:', error.message);
        return { data: null, error: error.message, success: false };
      }
      return { data: (data || []) as any[], error: null, success: true };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error', success: false };
    }
  }
}