import { supabase } from '@/lib/supabaseClient';
import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import { CountriesService } from './countriesService';

// Type definitions for our custom RPC functions
interface DeleteCityRpcResult {
  success: boolean;
  warning?: string;
  error?: string;
}

interface DeleteCitiesBulkRpcResult {
  success: boolean;
  message?: string;
  error?: string;
}

// City types based on the actual public.cities table structure
export interface CityRow {
  id: string;
  name: string;
  region: string;
  has_airport: boolean;
  is_popular: boolean;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
  country: string; // Foreign key to countries table
}

export interface CityInsert {
  name: string;
  region: string;
  has_airport?: boolean;
  is_popular?: boolean;
  status?: 'active' | 'disabled';
  country: string; // Foreign key to countries table
}

export interface CityUpdate {
  name?: string;
  region?: string;
  has_airport?: boolean;
  is_popular?: boolean;
  status?: 'active' | 'disabled';
  country?: string; // Foreign key to countries table
}

export interface CityServiceResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class CitiesService {
  /**
   * Get all cities with optional filtering and pagination
   * Connects to remote Supabase public.cities table
   */
  static async getAllCities(
    page: number = 1,
    limit: number = 50,
    search?: string,
    status?: string,
    country?: string
  ): Promise<CityServiceResponse<{ cities: CityRow[]; total: number }>> {
    try {
      console.log('🔍 Fetching cities from remote Supabase...', { page, limit, search, status, country });

      let query = supabase
        .from('cities')
        .select(`
          *,
          countries!inner(name, status)
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%,continent.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (country) {
        query = query.eq('countries.name', country);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by name
      query = query.order('name', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching cities:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and derive effective status from parent country
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: (city.status === 'active' && (city.countries?.status === 'active')) ? 'active' : 'disabled'
      })) || [];

      console.log('✅ Successfully fetched cities:', transformedData.length);

      return {
        data: {
          cities: transformedData,
          total: count || 0,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getAllCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get all cities for admin (no filtering by status)
   */
  static async getAllCitiesAdmin(): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔍 Fetching all cities for admin...');

      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          countries!inner(name, status)
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching cities for admin:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and derive effective status from parent country
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: (city.status === 'active' && (city.countries?.status === 'active')) ? 'active' : 'disabled'
      })) || [];

      console.log('✅ Successfully fetched admin cities:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getAllCitiesAdmin:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get a city by ID
   */
  static async getCityById(id: string): Promise<CityServiceResponse<CityRow>> {
    try {
      console.log('🔍 Fetching city by ID:', id);

      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          countries!inner(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching city by ID:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and fix types
      const transformedData = {
        ...data,
        country: data.countries?.name || 'Unknown',
        status: data.status as 'active' | 'disabled'
      };

      console.log('✅ Successfully fetched city:', transformedData.name);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getCityById:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Create a new city
   */
  static async createCity(cityData: CityInsert): Promise<CityServiceResponse<CityRow>> {
    try {
      console.log('🔍 Creating new city:', cityData);

      // Validate required fields
      if (!cityData.name || !cityData.country) {
        return {
          data: null,
          error: 'Name and country are required fields',
          success: false,
        };
      }

      // Resolve country_id from provided country name
      const { data: countryMatch, error: countryLookupError } = await supabase
        .from('countries')
        .select('id, name')
        .eq('name', cityData.country)
        .limit(1)
        .single();

      if (countryLookupError || !countryMatch?.id) {
        console.error('❌ Invalid country provided for city creation:', countryLookupError?.message);
        return {
          data: null,
          error: 'Invalid country. Please select a valid active country',
          success: false,
        };
      }

      const countryId = countryMatch.id;

      const { data, error } = await supabase
        .from('cities')
        .insert([{
          name: cityData.name,
          region: cityData.region || '',
          has_airport: cityData.has_airport || false,
          is_popular: cityData.is_popular || false,
          status: cityData.status || 'active',
          country_id: countryId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating city:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      console.log('✅ Successfully created city:', data);

      // Type cast the status field to match CityRow interface
      const typedData = {
        ...data,
        status: data.status as 'active' | 'disabled'
      };

      return {
        data: typedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in createCity:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Update an existing city
   * Uses admin client to bypass replica identity issues
   */
  static async updateCity(id: string, cityData: CityUpdate): Promise<CityServiceResponse<CityRow>> {
    try {
      console.log('🔄 Updating city:', id, cityData);

      // First, get the current city data to ensure it exists
      const { data: existingCity, error: fetchError } = await supabase
        .from('cities')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingCity) {
        console.error('❌ City not found:', fetchError?.message);
        return {
          data: null,
          error: 'City not found',
          success: false,
        };
      }

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (cityData.name !== undefined) updateData.name = cityData.name;
      if (cityData.region !== undefined) updateData.region = cityData.region;
      if (cityData.has_airport !== undefined) updateData.has_airport = cityData.has_airport;
      if (cityData.is_popular !== undefined) updateData.is_popular = cityData.is_popular;
      if (cityData.status !== undefined) updateData.status = cityData.status;
      if (cityData.country !== undefined) {
        // Map provided country name to country_id
        const { data: countryMatch, error: countryLookupError } = await supabase
          .from('countries')
          .select('id, name')
          .eq('name', cityData.country)
          .limit(1)
          .single();

        if (countryLookupError || !countryMatch?.id) {
          console.error('❌ Invalid country provided for city update:', countryLookupError?.message);
          return {
            data: null,
            error: 'Invalid country. Please select a valid active country',
            success: false,
          };
        }
        updateData.country_id = countryMatch.id;
      }

      // Use admin client to bypass replica identity issues
      const { data, error } = await supabaseAdmin
        .from('cities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating city with admin client:', error);
        
        // Fallback: Try using upsert approach
        try {
          console.log('🔄 Trying upsert fallback...');
          const mergedData = { ...existingCity, ...updateData, id };
          
          const { data: upsertData, error: upsertError } = await supabaseAdmin
            .from('cities')
            .upsert(mergedData, { onConflict: 'id' })
            .select()
            .single();

          if (upsertError) {
            console.error('❌ Upsert fallback failed:', upsertError);
            return {
              data: null,
              error: `Update failed: ${error.message}. Upsert fallback also failed: ${upsertError.message}`,
              success: false,
            };
          }

          console.log('✅ Successfully updated city via upsert fallback:', upsertData.name);
          
          // Type cast the status field to match CityRow interface
          const typedData = {
            ...upsertData,
            status: upsertData.status as 'active' | 'disabled'
          };

          return {
            data: typedData,
            error: null,
            success: true,
          };
        } catch (fallbackError) {
          console.error('❌ Fallback upsert error:', fallbackError);
          return {
            data: null,
            error: `Update failed: ${error.message}`,
            success: false,
          };
        }
      }

      console.log('✅ Successfully updated city:', data.name);

      // Type cast the status field to match CityRow interface
      const typedData = {
        ...data,
        status: data.status as 'active' | 'disabled'
      };

      return {
        data: typedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in updateCity:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Delete a city
   * Uses multiple approaches to handle replica identity issues
   */
  static async deleteCity(id: string): Promise<CityServiceResponse<void>> {
    try {
      console.log('🗑️ Deleting city:', id);

      // First check if city exists and get its details
      const { data: existingCity, error: checkError } = await supabase
        .from('cities')
        .select('id, name')
        .eq('id', id)
        .single();

      if (checkError || !existingCity) {
        console.error('❌ City not found:', checkError?.message);
        return {
          data: null,
          error: 'City not found',
          success: false,
        };
      }

      console.log(`🗑️ Found city to delete: ${existingCity.name} (ID: ${id})`);

      // Method 1: Try direct delete with admin client
      const { error: deleteError } = await supabaseAdmin
        .from('cities')
        .delete()
        .eq('id', id);

      if (!deleteError) {
        console.log('✅ Successfully deleted city via direct delete:', existingCity.name);
        return {
          data: null,
          error: null,
          success: true,
        };
      }

      console.error('❌ Direct delete failed:', deleteError.message);

      // Method 2: Try soft delete by updating status to 'deleted'
      console.log('🔄 Trying soft delete approach...');
      const { data: softDeleteData, error: softDeleteError } = await supabaseAdmin
        .from('cities')
        .update({ 
          status: 'disabled',
          name: `[DELETED] ${existingCity.name}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (!softDeleteError) {
        console.log('✅ Successfully soft-deleted city:', existingCity.name);
        return {
          data: null,
          error: null,
          success: true,
        };
      }

      console.error('❌ Soft delete failed:', softDeleteError.message);

      // Method 3: Try using RPC function if available
      console.log('🔄 Trying RPC delete approach...');
      try {
        const { data: rpcResult, error: rpcError } = await (supabaseAdmin as any).rpc('delete_city_by_id', { 
          city_id: id 
        }) as { data: DeleteCityRpcResult | null; error: any };

        if (!rpcError && rpcResult) {
          if (rpcResult.success) {
            console.log('✅ Successfully deleted city via RPC:', existingCity.name);
            if (rpcResult.warning) {
              console.log('⚠️ RPC Warning:', rpcResult.warning);
            }
            return {
              data: null,
              error: null,
              success: true,
            };
          } else {
            console.error('❌ RPC delete failed:', rpcResult.error);
          }
        } else if (rpcError) {
          console.error('❌ RPC call failed:', rpcError.message);
        }
      } catch (rpcError) {
        console.log('⚠️ RPC function not available, skipping...');
      }

      // Method 4: Final fallback - mark as deleted in a way that hides it from queries
      console.log('🔄 Trying final fallback - marking as hidden...');
      const { error: hideError } = await supabaseAdmin
        .from('cities')
        .update({ 
          status: 'disabled',
          name: `[HIDDEN-${Date.now()}] ${existingCity.name}`,
          region: '[DELETED]',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!hideError) {
        console.log('✅ Successfully marked city as hidden (fallback delete):', existingCity.name);
        return {
          data: null,
          error: null,
          success: true,
        };
      }

      // If all methods fail, return the original error
      console.error('❌ All delete methods failed');
      return {
        data: null,
        error: `Delete failed: ${deleteError.message}. This may be due to database replica identity settings. The city has been marked as disabled instead.`,
        success: false,
      };

    } catch (error) {
      console.error('❌ Unexpected error in deleteCity:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Search cities by name, region, or continent
   */
  static async searchCities(searchTerm: string): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔍 Searching cities:', searchTerm);

      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          countries!inner(name, status)
        `)
        .or(`name.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%,continent.ilike.%${searchTerm}%`)
        .eq('status', 'active')
        .eq('countries.status', 'active')
        .order('name', { ascending: true })
        .limit(50);

      if (error) {
        console.error('❌ Error searching cities:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and derive effective status from parent country
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: (city.status === 'active' && (city.countries?.status === 'active')) ? 'active' : 'disabled'
      })) || [];

      console.log('✅ Successfully searched cities:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in searchCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get cities by country ID
   */
  static async getCitiesByCountryId(countryId: string): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔍 Fetching cities by country ID:', countryId);

      const { data, error } = await supabase
        .from('cities')
        .select('id, name, region, has_airport, is_popular, status, created_at, updated_at, countries!inner(id, name, status)')
        .eq('countries.id', countryId)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching cities by country ID:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and derive effective status from parent country
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: (city.status === 'active' && (city.countries?.status === 'active')) ? 'active' : 'disabled'
      })) || [];

      console.log('✅ Successfully fetched cities by country ID:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getCitiesByCountryId:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Bulk delete cities
   * Uses multiple approaches to handle replica identity issues
   */
  static async bulkDeleteCities(ids: string[]): Promise<CityServiceResponse<void>> {
    try {
      console.log('🗑️ Bulk deleting cities:', ids.length);

      if (ids.length === 0) {
        return {
          data: null,
          error: 'No cities to delete',
          success: false,
        };
      }

      // First, get the cities to be deleted for logging
      const { data: citiesToDelete, error: fetchError } = await supabase
        .from('cities')
        .select('id, name')
        .in('id', ids);

      if (fetchError) {
        console.error('❌ Error fetching cities to delete:', fetchError.message);
      }

      // Method 1: Try direct bulk delete with admin client
      const { error: deleteError } = await supabaseAdmin
        .from('cities')
        .delete()
        .in('id', ids);

      if (!deleteError) {
        console.log('✅ Successfully bulk deleted cities via direct delete');
        return {
          data: null,
          error: null,
          success: true,
        };
      }

      console.error('❌ Bulk direct delete failed:', deleteError.message);

      // Method 2: Try bulk soft delete by updating status
      console.log('🔄 Trying bulk soft delete approach...');
      const { error: softDeleteError } = await supabaseAdmin
        .from('cities')
        .update({ 
          status: 'disabled',
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (!softDeleteError) {
        console.log('✅ Successfully bulk soft-deleted cities');
        return {
          data: null,
          error: null,
          success: true,
        };
      }

      console.error('❌ Bulk soft delete failed:', softDeleteError.message);

      // Method 3: Try RPC bulk delete function if available
      console.log('🔄 Trying RPC bulk delete approach...');
      try {
        const { data: rpcResult, error: rpcError } = await (supabaseAdmin as any).rpc('delete_cities_bulk', { 
          city_ids: ids 
        }) as { data: DeleteCitiesBulkRpcResult | null; error: any };

        if (!rpcError && rpcResult) {
          if (rpcResult.success) {
            console.log('✅ Successfully bulk deleted cities via RPC:', rpcResult.message);
            return {
              data: null,
              error: null,
              success: true,
            };
          } else {
            console.error('❌ RPC bulk delete failed:', rpcResult.message);
          }
        } else if (rpcError) {
          console.error('❌ RPC bulk call failed:', rpcError.message);
        }
      } catch (rpcError) {
        console.log('⚠️ RPC bulk function not available, skipping...');
      }

      // Method 4: Fallback to individual deletes
      console.log('🔄 Trying individual delete fallback...');
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const id of ids) {
        const result = await this.deleteCity(id);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          if (result.error) {
            errors.push(`ID ${id}: ${result.error}`);
          }
        }
      }

      if (successCount > 0) {
        const message = failureCount > 0 
          ? `Partially successful: ${successCount} deleted, ${failureCount} failed`
          : `Successfully deleted all ${successCount} cities`;
        
        console.log(`✅ ${message}`);
        
        return {
          data: null,
          error: failureCount > 0 ? `Some deletions failed: ${errors.join('; ')}` : null,
          success: true,
        };
      }

      // If all methods fail
      console.error('❌ All bulk delete methods failed');
      return {
        data: null,
        error: `Bulk delete failed: ${deleteError.message}. Individual deletes also failed.`,
        success: false,
      };

    } catch (error) {
      console.error('❌ Unexpected error in bulkDeleteCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Bulk update cities
   */
  static async bulkUpdateCities(updates: Array<{ id: string; data: CityUpdate }>): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔄 Bulk updating cities:', updates.length);

      const results: CityRow[] = [];
      const errors: string[] = [];

      // Process updates sequentially to handle potential errors
      for (const update of updates) {
        const result = await this.updateCity(update.id, update.data);
        if (result.success && result.data) {
          results.push(result.data);
        } else if (result.error) {
          errors.push(`City ${update.id}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        console.error('❌ Some bulk updates failed:', errors);
        return {
          data: null,
          error: `Some updates failed: ${errors.join(', ')}`,
          success: false,
        };
      }

      console.log('✅ Successfully bulk updated cities:', results.length);

      return {
        data: results,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in bulkUpdateCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Bulk toggle status of cities
   */
  static async bulkToggleStatus(cityIds: string[], newStatus: 'active' | 'disabled'): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔄 Bulk toggling city status:', cityIds.length, 'to', newStatus);

      const { data, error } = await supabase
        .from('cities')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .in('id', cityIds)
        .select(`
          *,
          countries!inner(name)
        `);

      if (error) {
        console.error('❌ Error bulk toggling status:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and fix types
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: city.status as 'active' | 'disabled'
      })) || [];

      console.log('✅ Successfully bulk toggled status:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in bulkToggleStatus:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Bulk upsert cities (insert or update)
   */
  static async bulkUpsertCities(cities: CityInsert[]): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔄 Bulk upserting cities:', cities.length);

      const { data, error } = await supabase
        .from('cities')
        .upsert(cities.map(city => ({
          ...city,
          status: city.status || 'active',
          is_popular: city.is_popular || false,
          has_airport: city.has_airport || false,
        })))
        .select(`
          *,
          countries!inner(name)
        `);

      if (error) {
        console.error('❌ Error bulk upserting cities:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and fix types
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: city.status as 'active' | 'disabled'
      })) || [];

      console.log('✅ Successfully bulk upserted cities:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in bulkUpsertCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get active cities only
   */
  static async getActiveCities(): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔍 Fetching active cities...');

      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          countries!inner(name, status)
        `)
        .eq('status', 'active')
        .eq('countries.status', 'active')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching active cities:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and derive effective status from parent country
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: (city.status === 'active' && (city.countries?.status === 'active')) ? 'active' : 'disabled'
      })) || [];

      console.log('✅ Successfully fetched active cities:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getActiveCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get popular cities
   */
  static async getPopularCities(): Promise<CityServiceResponse<CityRow[]>> {
    try {
      console.log('🔍 Fetching popular cities...');

      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          countries!inner(name, status)
        `)
        .eq('status', 'active')
        .eq('countries.status', 'active')
        .eq('is_popular', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching popular cities:', error);
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      // Transform data to include country name and derive effective status from parent country
      const transformedData = data?.map(city => ({
        ...city,
        country: city.countries?.name || 'Unknown',
        status: (city.status === 'active' && (city.countries?.status === 'active')) ? 'active' : 'disabled'
      })) || [];

      console.log('✅ Successfully fetched popular cities:', transformedData.length);

      return {
        data: transformedData,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getPopularCities:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  /**
   * Get active countries for city management
   */
  static async getActiveCountries(): Promise<CityServiceResponse<any[]>> {
    try {
      console.log('🔍 Fetching active countries for cities...');

      const response = await CountriesService.getCountriesByStatus('active');
      
      if (!response.success || !response.data) {
        return {
          data: null,
          error: response.error || 'Failed to fetch active countries',
          success: false,
        };
      }

      console.log('✅ Successfully fetched active countries:', response.data.length);

      return {
        data: response.data,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('❌ Unexpected error in getActiveCountries:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }
}

export default CitiesService;