import { supabase } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

// Type definitions based on Supabase schema
export type VisaRow = Tables<'visa'>;
export type VisaInsert = TablesInsert<'visa'>;
export type VisaUpdate = TablesUpdate<'visa'>;

// Service response interface
export interface VisaServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Filter interface for visa queries
export interface VisaFilters {
  search?: string;
  country?: string;
  visa_type?: string;
  status?: 'active' | 'disabled';
  page?: number;
  limit?: number;
}

// Document interface for visa documents (jsonb field)
export interface VisaDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  format?: string;
}

// Enhanced visa interface with computed fields
export interface EnhancedVisa extends VisaRow {
  documents_parsed?: VisaDocument[];
}

export class VisaService {
  /**
   * Get all visas with optional filtering and pagination
   */
  static async getAllVisas(filters: VisaFilters = {}): Promise<VisaServiceResponse<{ visas: EnhancedVisa[]; total: number }>> {
    try {
      console.log('🔍 Fetching visas from Supabase...', filters);

      let query = supabase
        .from('visa')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`country.ilike.%${filters.search}%,visa_type.ilike.%${filters.search}%`);
      }

      // Apply country filter
      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      // Apply visa type filter
      if (filters.visa_type) {
        query = query.eq('visa_type', filters.visa_type);
      }

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching visas:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Parse documents field for each visa
      const enhancedVisas: EnhancedVisa[] = (data || []).map(visa => ({
        ...visa,
        documents_parsed: this.parseDocuments(visa.documents)
      }));

      console.log(`✅ Successfully fetched ${enhancedVisas.length} visas`);

      return {
        data: {
          visas: enhancedVisas,
          total: count || 0
        },
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching visas:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get a single visa by ID
   */
  static async getVisaById(id: string): Promise<VisaServiceResponse<EnhancedVisa>> {
    try {
      console.log('🔍 Fetching visa by ID:', id);

      const { data, error } = await supabase
        .from('visa')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching visa:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const enhancedVisa: EnhancedVisa = {
        ...data,
        documents_parsed: this.parseDocuments(data.documents)
      };

      console.log('✅ Successfully fetched visa:', enhancedVisa.country);

      return {
        data: enhancedVisa,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching visa:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Create a new visa
   */
  static async createVisa(visaData: VisaInsert): Promise<VisaServiceResponse<EnhancedVisa>> {
    try {
      console.log('📝 Creating new visa:', visaData.country);

      const { data, error } = await supabase
        .from('visa')
        .insert(visaData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating visa:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const enhancedVisa: EnhancedVisa = {
        ...data,
        documents_parsed: this.parseDocuments(data.documents)
      };

      console.log('✅ Successfully created visa:', enhancedVisa.country);

      return {
        data: enhancedVisa,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error creating visa:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Update an existing visa
   */
  static async updateVisa(id: string, visaData: VisaUpdate): Promise<VisaServiceResponse<EnhancedVisa>> {
    try {
      console.log('📝 Updating visa:', id);

      const { data, error } = await supabase
        .from('visa')
        .update(visaData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating visa:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const enhancedVisa: EnhancedVisa = {
        ...data,
        documents_parsed: this.parseDocuments(data.documents)
      };

      console.log('✅ Successfully updated visa:', enhancedVisa.country);

      return {
        data: enhancedVisa,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error updating visa:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Delete a visa
   */
  static async deleteVisa(id: string): Promise<VisaServiceResponse<boolean>> {
    try {
      console.log('🗑️ Deleting visa:', id);

      const { error } = await supabase
        .from('visa')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting visa:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      console.log('✅ Successfully deleted visa');

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error deleting visa:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get unique countries from visas
   */
  static async getVisaCountries(): Promise<VisaServiceResponse<string[]>> {
    try {
      console.log('🔍 Fetching visa countries...');

      const { data, error } = await supabase
        .from('visa')
        .select('country')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error fetching visa countries:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const countries = [...new Set(data.map(item => item.country))].sort();

      console.log('✅ Successfully fetched visa countries:', countries.length);

      return {
        data: countries,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching visa countries:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get unique visa types
   */
  static async getVisaTypes(): Promise<VisaServiceResponse<string[]>> {
    try {
      console.log('🔍 Fetching visa types...');

      const { data, error } = await supabase
        .from('visa')
        .select('visa_type')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error fetching visa types:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const visaTypes = [...new Set(data.map(item => item.visa_type))].sort();

      console.log('✅ Successfully fetched visa types:', visaTypes.length);

      return {
        data: visaTypes,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching visa types:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Helper method to parse documents JSON field
   */
  private static parseDocuments(documents: Json | null): VisaDocument[] {
    if (!documents) return [];
    
    try {
      if (Array.isArray(documents)) {
        return documents as unknown as VisaDocument[];
      }
      return [];
    } catch (error) {
      console.warn('Failed to parse visa documents:', error);
      return [];
    }
  }

  /**
   * Helper method to format documents for storage
   */
  static formatDocumentsForStorage(documents: VisaDocument[]): Json {
    return documents as unknown as Json;
  }

  /**
   * Get countries from the countries table for visa forms
   */
  static async getActiveCountries(): Promise<VisaServiceResponse<Array<{ id: string; name: string; code: string }>>> {
    try {
      console.log('🔍 Fetching active countries...');

      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching countries:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      console.log('✅ Successfully fetched active countries:', data.length);

      return {
        data: data || [],
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error fetching countries:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }
}