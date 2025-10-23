import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';
import { loadSightseeingData, getSightseeingById } from '@/pages/inventory/sightseeing/services/storageService';

// Enhanced error types for better error handling
export interface TransportRouteError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface SightseeingValidationResult {
  isValid: boolean;
  missingData: string[];
  invalidReferences: string[];
  warnings: string[];
}

export interface TransportRouteResult<T = any> {
  success: boolean;
  data?: T;
  error?: TransportRouteError;
  validationResult?: SightseeingValidationResult;
}

// Enhanced Transport Routes service with sightseeing synchronization
export class EnhancedTransportRoutesService {
  private static instance: EnhancedTransportRoutesService;
  
  static getInstance(): EnhancedTransportRoutesService {
    if (!EnhancedTransportRoutesService.instance) {
      EnhancedTransportRoutesService.instance = new EnhancedTransportRoutesService();
    }
    return EnhancedTransportRoutesService.instance;
  }

  /**
   * Validate sightseeing options against available sightseeing data
   */
  private async validateSightseeingOptions(sightseeingOptions: any[]): Promise<SightseeingValidationResult> {
    const result: SightseeingValidationResult = {
      isValid: true,
      missingData: [],
      invalidReferences: [],
      warnings: []
    };

    if (!sightseeingOptions || sightseeingOptions.length === 0) {
      return result; // No sightseeing options to validate
    }

    try {
      // Load current sightseeing data
      const availableSightseeing = loadSightseeingData();
      const sightseeingMap = new Map(availableSightseeing.map(s => [s.id, s]));

      for (const option of sightseeingOptions) {
        if (!option.id) {
          result.missingData.push('Sightseeing option missing ID');
          result.isValid = false;
          continue;
        }

        const sightseeingData = sightseeingMap.get(option.id);
        if (!sightseeingData) {
          result.invalidReferences.push(`Sightseeing ID ${option.id} not found in database`);
          result.isValid = false;
          continue;
        }

        // Validate pricing information
        if (!option.selectedPricing && !option.adultPrice && !option.childPrice) {
          result.warnings.push(`Sightseeing "${sightseeingData.name}" has no pricing information`);
        }

        // Validate transfer options if specified
        if (option.selectedTransfer && sightseeingData.transferOptions) {
          const transferExists = sightseeingData.transferOptions.some(
            t => t.id === option.selectedTransfer.id
          );
          if (!transferExists) {
            result.invalidReferences.push(
              `Transfer option ${option.selectedTransfer.id} not found for sightseeing "${sightseeingData.name}"`
            );
            result.isValid = false;
          }
        }

        // Check if sightseeing is active
        if (sightseeingData.status !== 'active') {
          result.warnings.push(`Sightseeing "${sightseeingData.name}" is not active (status: ${sightseeingData.status})`);
        }
      }
    } catch (error) {
      result.isValid = false;
      result.missingData.push(`Failed to validate sightseeing options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Enrich sightseeing options with current data from the sightseeing database
   */
  private async enrichSightseeingOptions(sightseeingOptions: any[]): Promise<any[]> {
    if (!sightseeingOptions || sightseeingOptions.length === 0) {
      return [];
    }

    try {
      const availableSightseeing = loadSightseeingData();
      const sightseeingMap = new Map(availableSightseeing.map(s => [s.id, s]));

      return sightseeingOptions.map(option => {
        const sightseeingData = sightseeingMap.get(option.id);
        if (!sightseeingData) {
          return option; // Return as-is if not found
        }

        return {
          ...option,
          name: sightseeingData.name,
          description: sightseeingData.description,
          category: sightseeingData.category,
          country: sightseeingData.country,
          city: sightseeingData.city,
          status: sightseeingData.status,
          lastSyncedAt: new Date().toISOString(),
          // Preserve user selections while updating reference data
          availablePricing: sightseeingData.pricingOptions || [],
          availableTransfers: sightseeingData.transferOptions || [],
          policies: sightseeingData.policies
        };
      });
    } catch (error) {
      console.error('Failed to enrich sightseeing options:', error);
      return sightseeingOptions; // Return original data on error
    }
  }

  /**
   * Create a new transport route with enhanced sightseeing validation
   */
  async createTransportRoute(
    payload: Partial<TablesInsert<'transport_routes'>> & {
      start_location?: string;
      end_location?: string;
      sightseeing_options?: any[];
    }
  ): Promise<TransportRouteResult<Tables<'transport_routes'>>> {
    try {
      // Validate sightseeing options first
      const sightseeingOptions = payload.sightseeing_options || [];
      const validationResult = await this.validateSightseeingOptions(sightseeingOptions);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'SIGHTSEEING_VALIDATION_FAILED',
            message: 'Sightseeing validation failed',
            details: validationResult,
            timestamp: new Date()
          },
          validationResult
        };
      }

      // Enrich sightseeing options with current data
      const enrichedSightseeingOptions = await this.enrichSightseeingOptions(sightseeingOptions);

      // Build the insert payload
      const startLoc = (payload as any).start_location;
      const endLoc = (payload as any).end_location;
      const routeName = (payload as any).name ??
        (startLoc && endLoc ? `${startLoc} to ${endLoc}` : 'Route');
      const routeCode = (payload as any).route_code ??
        (startLoc && endLoc ? `${startLoc}-${endLoc}` : undefined);

      const insertPayload: any = {
        country: (payload as any).country,
        transfer_type: (payload as any).transfer_type,
        start_location: startLoc,
        end_location: endLoc,
        start_location_code: (payload as any).start_location_code ?? startLoc,
        end_location_code: (payload as any).end_location_code ?? endLoc,
        route_code: routeCode,
        name: routeName,
        route_name: routeName,
        status: (payload as any).status ?? 'active',
        transport_entries: (payload as any).transport_entries,
        sightseeing_options: enrichedSightseeingOptions,
        intermediate_stops: (payload as any).intermediate_stops,
        transfer_method_notes: (payload as any).transfer_method_notes
      };

      // Attempt insert with retry logic for unknown columns
      let attemptPayload = { ...insertPayload };
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabaseAdmin
          .from('transport_routes')
          .insert(attemptPayload)
          .select('*')
          .single();
        
        if (!error) {
          console.log('✅ Transport route created successfully with sightseeing validation');
          return {
            success: true,
            data: data as Tables<'transport_routes'>,
            validationResult
          };
        }

        // Handle unknown column errors
        const msg = String(error.message || '');
        const m1 = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column of 'transport_routes'/);
        const m2 = msg.match(/column\s+transport_routes\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i);
        const unknownCol = (m1 && m1[1]) || (m2 && m2[1]);
        
        if (unknownCol && unknownCol in attemptPayload) {
          delete (attemptPayload as any)[unknownCol];
          continue;
        }
        
        // If we cannot identify an unknown column, surface the error
        return {
          success: false,
          error: {
            code: 'DATABASE_INSERT_FAILED',
            message: `Failed to create transport route: ${error.message}`,
            details: error,
            timestamp: new Date()
          },
          validationResult
        };
      }

      // Fallback: perform minimal insert
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .insert({
          country: (payload as any).country,
          transfer_type: (payload as any).transfer_type,
          start_location: startLoc,
          end_location: endLoc,
          name: routeName,
          status: (payload as any).status ?? 'active',
          sightseeing_options: enrichedSightseeingOptions
        })
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_INSERT_FAILED',
            message: `Failed to create transport route: ${error.message}`,
            details: error,
            timestamp: new Date()
          },
          validationResult
        };
      }

      console.log('✅ Transport route created successfully (minimal payload)');
      return {
        success: true,
        data: data as Tables<'transport_routes'>,
        validationResult
      };

    } catch (error) {
      console.error('❌ Error creating transport route:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Update an existing transport route with enhanced sightseeing validation
   */
  async updateTransportRoute(
    id: string,
    payload: Partial<TablesUpdate<'transport_routes'>> & {
      start_location?: string;
      end_location?: string;
      sightseeing_options?: any[];
    }
  ): Promise<TransportRouteResult<Tables<'transport_routes'>>> {
    try {
      // Validate sightseeing options if provided
      let validationResult: SightseeingValidationResult | undefined;
      let enrichedSightseeingOptions: any[] | undefined;

      if (payload.sightseeing_options !== undefined) {
        validationResult = await this.validateSightseeingOptions(payload.sightseeing_options);
        
        if (!validationResult.isValid) {
          return {
            success: false,
            error: {
              code: 'SIGHTSEEING_VALIDATION_FAILED',
              message: 'Sightseeing validation failed',
              details: validationResult,
              timestamp: new Date()
            },
            validationResult
          };
        }

        enrichedSightseeingOptions = await this.enrichSightseeingOptions(payload.sightseeing_options);
      }

      const updatePayload: any = {
        country: (payload as any).country,
        transfer_type: (payload as any).transfer_type,
        start_location: (payload as any).start_location,
        end_location: (payload as any).end_location,
        start_location_code: (payload as any).start_location_code || (payload as any).start_location,
        end_location_code: (payload as any).end_location_code || (payload as any).end_location,
        route_code: (payload as any).route_code,
        name: (payload as any).name,
        route_name: (payload as any).name,
        status: (payload as any).status,
        transport_entries: (payload as any).transport_entries,
        intermediate_stops: (payload as any).intermediate_stops,
        transfer_method_notes: (payload as any).transfer_method_notes
      };

      // Add enriched sightseeing options if provided
      if (enrichedSightseeingOptions !== undefined) {
        updatePayload.sightseeing_options = enrichedSightseeingOptions;
      }

      // Attempt update with fallback removal of unknown columns
      let attemptPayload = { ...updatePayload };
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabaseAdmin
          .from('transport_routes')
          .update(attemptPayload)
          .eq('id', id)
          .select('*')
          .single();
        
        if (!error) {
          console.log('✅ Transport route updated successfully with sightseeing validation');
          return {
            success: true,
            data: data as Tables<'transport_routes'>,
            validationResult
          };
        }

        // Handle unknown column errors
        const msg = String(error.message || '');
        const m1 = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column of 'transport_routes'/);
        const m2 = msg.match(/column\s+transport_routes\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i);
        const unknownCol = (m1 && m1[1]) || (m2 && m2[1]);
        
        if (unknownCol && unknownCol in attemptPayload) {
          delete (attemptPayload as any)[unknownCol];
          continue;
        }
        
        return {
          success: false,
          error: {
            code: 'DATABASE_UPDATE_FAILED',
            message: `Failed to update transport route: ${error.message}`,
            details: error,
            timestamp: new Date()
          },
          validationResult
        };
      }

      // Last resort: minimal update
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .update({
          country: (payload as any).country,
          transfer_type: (payload as any).transfer_type,
          start_location: (payload as any).start_location,
          end_location: (payload as any).end_location,
          name: (payload as any).name,
          status: (payload as any).status,
          ...(enrichedSightseeingOptions !== undefined && { sightseeing_options: enrichedSightseeingOptions })
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_UPDATE_FAILED',
            message: `Failed to update transport route: ${error.message}`,
            details: error,
            timestamp: new Date()
          },
          validationResult
        };
      }

      console.log('✅ Transport route updated successfully (minimal payload)');
      return {
        success: true,
        data: data as Tables<'transport_routes'>,
        validationResult
      };

    } catch (error) {
      console.error('❌ Error updating transport route:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * List transport routes with optional filters
   */
  async listTransportRoutes(filters?: {
    country?: string;
    transferType?: string;
    validateSightseeing?: boolean;
  }): Promise<TransportRouteResult<Tables<'transport_routes'>[]>> {
    try {
      let query = supabaseAdmin
        .from('transport_routes')
        .select('*')
        .order('start_location', { ascending: true });

      if (filters?.country) {
        query = query.eq('country', filters.country);
      }
      if (filters?.transferType) {
        query = query.ilike('transfer_type', filters.transferType);
      }

      const { data, error } = await query;
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_QUERY_FAILED',
            message: `Failed to list transport routes: ${error.message}`,
            details: error,
            timestamp: new Date()
          }
        };
      }

      let routes = (data || []) as Tables<'transport_routes'>[];

      // Optionally validate sightseeing data for each route
      if (filters?.validateSightseeing) {
        const validationResults = await Promise.all(
          routes.map(async (route) => {
            const sightseeingOptions = route.sightseeing_options as any[] || [];
            const validation = await this.validateSightseeingOptions(sightseeingOptions);
            return { routeId: route.id, validation };
          })
        );

        console.log('🔍 Sightseeing validation results:', validationResults);
      }

      return {
        success: true,
        data: routes
      };

    } catch (error) {
      console.error('❌ Error listing transport routes:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Delete a transport route
   */
  async deleteTransportRoute(id: string): Promise<TransportRouteResult<boolean>> {
    try {
      const { error } = await supabaseAdmin
        .from('transport_routes')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: {
            code: 'DATABASE_DELETE_FAILED',
            message: `Failed to delete transport route: ${error.message}`,
            details: error,
            timestamp: new Date()
          }
        };
      }

      console.log('✅ Transport route deleted successfully');
      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('❌ Error deleting transport route:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Validate and sync sightseeing data for an existing route
   */
  async validateAndSyncSightseeingData(routeId: string): Promise<TransportRouteResult<{
    route: Tables<'transport_routes'>;
    syncedOptions: any[];
  }>> {
    try {
      // First, get the current route
      const { data: route, error: fetchError } = await supabaseAdmin
        .from('transport_routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (fetchError || !route) {
        return {
          success: false,
          error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Transport route not found: ${fetchError?.message || 'Route does not exist'}`,
            details: fetchError,
            timestamp: new Date()
          }
        };
      }

      const sightseeingOptions = route.sightseeing_options as any[] || [];
      
      // Validate current sightseeing options
      const validationResult = await this.validateSightseeingOptions(sightseeingOptions);
      
      // Enrich with current data
      const enrichedOptions = await this.enrichSightseeingOptions(sightseeingOptions);

      // Update the route with enriched data
      const updateResult = await this.updateTransportRoute(routeId, {
        sightseeing_options: enrichedOptions
      });

      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: {
          route: updateResult.data!,
          syncedOptions: enrichedOptions
        },
        validationResult
      };

    } catch (error) {
      console.error('❌ Error validating and syncing sightseeing data:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get comprehensive sightseeing validation report for all routes
   */
  async getSightseeingValidationReport(): Promise<TransportRouteResult<{
    totalRoutes: number;
    routesWithSightseeing: number;
    validRoutes: number;
    invalidRoutes: number;
    routesWithWarnings: number;
    detailedResults: Array<{
      routeId: string;
      routeName: string;
      validation: SightseeingValidationResult;
      sightseeingCount: number;
    }>;
  }>> {
    try {
      const routesResult = await this.listTransportRoutes();
      
      if (!routesResult.success) {
        return routesResult as any;
      }

      const routes = routesResult.data!;
      const detailedResults = [];
      let validRoutes = 0;
      let invalidRoutes = 0;
      let routesWithWarnings = 0;
      let routesWithSightseeing = 0;

      for (const route of routes) {
        const sightseeingOptions = route.sightseeing_options as any[] || [];
        
        if (sightseeingOptions.length > 0) {
          routesWithSightseeing++;
          
          const validation = await this.validateSightseeingOptions(sightseeingOptions);
          
          if (validation.isValid) {
            validRoutes++;
          } else {
            invalidRoutes++;
          }
          
          if (validation.warnings.length > 0) {
            routesWithWarnings++;
          }

          detailedResults.push({
            routeId: route.id,
            routeName: route.name || route.route_name || 'Unnamed Route',
            validation,
            sightseeingCount: sightseeingOptions.length
          });
        }
      }

      return {
        success: true,
        data: {
          totalRoutes: routes.length,
          routesWithSightseeing,
          validRoutes,
          invalidRoutes,
          routesWithWarnings,
          detailedResults
        }
      };

    } catch (error) {
      console.error('❌ Error generating sightseeing validation report:', error);
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          timestamp: new Date()
        }
      };
    }
  }
}

// Export singleton instance
export const enhancedTransportRoutesService = EnhancedTransportRoutesService.getInstance();

// Export legacy functions for backward compatibility
export const createTransportRoute = (payload: any) => 
  enhancedTransportRoutesService.createTransportRoute(payload);

export const updateTransportRoute = (id: string, payload: any) => 
  enhancedTransportRoutesService.updateTransportRoute(id, payload);

export const listTransportRoutes = (filters?: any) => 
  enhancedTransportRoutesService.listTransportRoutes(filters);

export const deleteTransportRoute = (id: string) => 
  enhancedTransportRoutesService.deleteTransportRoute(id);