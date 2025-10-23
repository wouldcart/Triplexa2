import { loadSightseeingData } from '@/pages/inventory/sightseeing/services/storageService';
import type { Tables } from '@/integrations/supabase/types';

// Validation error types
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  score: number; // 0-100 validation score
}

export interface SightseeingDataIntegrity {
  totalOptions: number;
  validOptions: number;
  invalidOptions: number;
  missingReferences: number;
  outdatedData: number;
  pricingIssues: number;
  transferIssues: number;
}

export interface RouteDataIntegrity {
  routeValidation: ValidationResult;
  sightseeingIntegrity: SightseeingDataIntegrity;
  recommendations: string[];
  lastValidated: Date;
}

export class TransportRouteValidationService {
  private static instance: TransportRouteValidationService;
  
  static getInstance(): TransportRouteValidationService {
    if (!TransportRouteValidationService.instance) {
      TransportRouteValidationService.instance = new TransportRouteValidationService();
    }
    return TransportRouteValidationService.instance;
  }

  /**
   * Validate basic route data
   */
  validateRouteData(route: Partial<Tables<'transport_routes'>>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Required field validation
    if (!route.country?.trim()) {
      errors.push({
        field: 'country',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Country is required',
        severity: 'error'
      });
    }

    if (!route.transfer_type?.trim()) {
      errors.push({
        field: 'transfer_type',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Transfer type is required',
        severity: 'error'
      });
    }

    if (!route.name?.trim() && !route.route_name?.trim()) {
      errors.push({
        field: 'name',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Route name is required',
        severity: 'error'
      });
    }

    // Location validation
    const startLocation = (route as any).start_location;
    const endLocation = (route as any).end_location;
    const startLocationCode = (route as any).start_location_code;
    const endLocationCode = (route as any).end_location_code;

    if (!startLocation && !startLocationCode) {
      errors.push({
        field: 'start_location',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Start location or location code is required',
        severity: 'error'
      });
    }

    if (!endLocation && !endLocationCode) {
      errors.push({
        field: 'end_location',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'End location or location code is required',
        severity: 'error'
      });
    }

    if (startLocation === endLocation && startLocation) {
      warnings.push({
        field: 'locations',
        code: 'SAME_START_END_LOCATION',
        message: 'Start and end locations are the same',
        severity: 'warning'
      });
    }

    // Status validation
    const validStatuses = ['active', 'inactive', 'draft', 'archived'];
    if (route.status && !validStatuses.includes(route.status)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        severity: 'error',
        details: { validStatuses, currentStatus: route.status }
      });
    }

    // Transport entries validation
    if (route.transport_entries) {
      const transportValidation = this.validateTransportEntries(route.transport_entries as any);
      errors.push(...transportValidation.errors);
      warnings.push(...transportValidation.warnings);
      info.push(...transportValidation.info);
    }

    // Intermediate stops validation
    if (route.intermediate_stops) {
      const stopsValidation = this.validateIntermediateStops(route.intermediate_stops as any);
      errors.push(...stopsValidation.errors);
      warnings.push(...stopsValidation.warnings);
    }

    // Calculate validation score
    const totalChecks = 10; // Base number of validation checks
    const errorWeight = 3;
    const warningWeight = 1;
    const deductions = (errors.length * errorWeight) + (warnings.length * warningWeight);
    const score = Math.max(0, Math.min(100, 100 - (deductions / totalChecks) * 100));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      score: Math.round(score)
    };
  }

  /**
   * Validate transport entries
   */
  private validateTransportEntries(transportEntries: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    if (!Array.isArray(transportEntries)) {
      errors.push({
        field: 'transport_entries',
        code: 'INVALID_FORMAT',
        message: 'Transport entries must be an array',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, info, score: 0 };
    }

    if (transportEntries.length === 0) {
      warnings.push({
        field: 'transport_entries',
        code: 'NO_TRANSPORT_ENTRIES',
        message: 'No transport entries defined',
        severity: 'warning'
      });
    }

    transportEntries.forEach((entry, index) => {
      if (!entry.type) {
        errors.push({
          field: `transport_entries[${index}].type`,
          code: 'REQUIRED_FIELD_MISSING',
          message: `Transport entry ${index + 1} is missing type`,
          severity: 'error'
        });
      }

      if (typeof entry.price !== 'number' || entry.price < 0) {
        errors.push({
          field: `transport_entries[${index}].price`,
          code: 'INVALID_PRICE',
          message: `Transport entry ${index + 1} has invalid price`,
          severity: 'error',
          details: { price: entry.price }
        });
      }

      if (!entry.duration) {
        warnings.push({
          field: `transport_entries[${index}].duration`,
          code: 'MISSING_DURATION',
          message: `Transport entry ${index + 1} is missing duration`,
          severity: 'warning'
        });
      }

      if (entry.price === 0) {
        info.push({
          field: `transport_entries[${index}].price`,
          code: 'FREE_TRANSPORT',
          message: `Transport entry ${index + 1} is free`,
          severity: 'info'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      score: errors.length === 0 ? 100 : 50
    };
  }

  /**
   * Validate intermediate stops
   */
  private validateIntermediateStops(intermediateStops: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    if (!Array.isArray(intermediateStops)) {
      errors.push({
        field: 'intermediate_stops',
        code: 'INVALID_FORMAT',
        message: 'Intermediate stops must be an array',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, info, score: 0 };
    }

    intermediateStops.forEach((stop, index) => {
      if (!stop.location && !stop.locationCode) {
        errors.push({
          field: `intermediate_stops[${index}]`,
          code: 'MISSING_LOCATION',
          message: `Intermediate stop ${index + 1} is missing location`,
          severity: 'error'
        });
      }

      if (typeof stop.duration !== 'string' && typeof stop.duration !== 'number') {
        warnings.push({
          field: `intermediate_stops[${index}].duration`,
          code: 'MISSING_DURATION',
          message: `Intermediate stop ${index + 1} is missing duration`,
          severity: 'warning'
        });
      }
    });

    if (intermediateStops.length > 10) {
      warnings.push({
        field: 'intermediate_stops',
        code: 'TOO_MANY_STOPS',
        message: 'Route has many intermediate stops, consider splitting into multiple routes',
        severity: 'warning',
        details: { stopCount: intermediateStops.length }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      score: errors.length === 0 ? 100 : 70
    };
  }

  /**
   * Comprehensive sightseeing data validation
   */
  async validateSightseeingData(sightseeingOptions: any[]): Promise<{
    validation: ValidationResult;
    integrity: SightseeingDataIntegrity;
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    const integrity: SightseeingDataIntegrity = {
      totalOptions: sightseeingOptions.length,
      validOptions: 0,
      invalidOptions: 0,
      missingReferences: 0,
      outdatedData: 0,
      pricingIssues: 0,
      transferIssues: 0
    };

    if (!Array.isArray(sightseeingOptions)) {
      errors.push({
        field: 'sightseeing_options',
        code: 'INVALID_FORMAT',
        message: 'Sightseeing options must be an array',
        severity: 'error'
      });
      return {
        validation: { isValid: false, errors, warnings, info, score: 0 },
        integrity
      };
    }

    if (sightseeingOptions.length === 0) {
      info.push({
        field: 'sightseeing_options',
        code: 'NO_SIGHTSEEING_OPTIONS',
        message: 'No sightseeing options defined',
        severity: 'info'
      });
      return {
        validation: { isValid: true, errors, warnings, info, score: 100 },
        integrity
      };
    }

    try {
      // Load current sightseeing data for validation
      const availableSightseeing = loadSightseeingData();
      const sightseeingMap = new Map(availableSightseeing.map(s => [s.id, s]));

      for (let i = 0; i < sightseeingOptions.length; i++) {
        const option = sightseeingOptions[i];
        const fieldPrefix = `sightseeing_options[${i}]`;

        // Basic structure validation
        if (!option.id) {
          errors.push({
            field: `${fieldPrefix}.id`,
            code: 'MISSING_ID',
            message: `Sightseeing option ${i + 1} is missing ID`,
            severity: 'error'
          });
          integrity.invalidOptions++;
          continue;
        }

        // Reference validation
        const sightseeingData = sightseeingMap.get(option.id);
        if (!sightseeingData) {
          errors.push({
            field: `${fieldPrefix}.id`,
            code: 'INVALID_REFERENCE',
            message: `Sightseeing ID ${option.id} not found in database`,
            severity: 'error',
            details: { sightseeingId: option.id }
          });
          integrity.missingReferences++;
          integrity.invalidOptions++;
          continue;
        }

        // Status validation
        if (sightseeingData.status !== 'active') {
          warnings.push({
            field: `${fieldPrefix}.status`,
            code: 'INACTIVE_SIGHTSEEING',
            message: `Sightseeing "${sightseeingData.name}" is not active (status: ${sightseeingData.status})`,
            severity: 'warning',
            details: { status: sightseeingData.status }
          });
        }

        // Data freshness validation
        if (option.lastSyncedAt) {
          const lastSynced = new Date(option.lastSyncedAt);
          const daysSinceSync = (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceSync > 7) {
            warnings.push({
              field: `${fieldPrefix}.lastSyncedAt`,
              code: 'OUTDATED_DATA',
              message: `Sightseeing data for "${sightseeingData.name}" is ${Math.round(daysSinceSync)} days old`,
              severity: 'warning',
              details: { daysSinceSync: Math.round(daysSinceSync) }
            });
            integrity.outdatedData++;
          }
        } else {
          info.push({
            field: `${fieldPrefix}.lastSyncedAt`,
            code: 'NO_SYNC_INFO',
            message: `No sync information for "${sightseeingData.name}"`,
            severity: 'info'
          });
        }

        // Pricing validation
        const hasPricing = 
          (option.adultPrice && option.adultPrice > 0) ||
          (option.childPrice && option.childPrice > 0) ||
          (option.selectedPricing && option.selectedPricing.adultPrice > 0);

        if (!hasPricing && !sightseeingData.isFree) {
          errors.push({
            field: `${fieldPrefix}.pricing`,
            code: 'MISSING_PRICING',
            message: `Sightseeing "${sightseeingData.name}" has no pricing information`,
            severity: 'error'
          });
          integrity.pricingIssues++;
        }

        // Transfer validation
        if (option.selectedTransfer) {
          const transferExists = sightseeingData.transferOptions?.some(
            t => t.id === option.selectedTransfer.id
          );
          
          if (!transferExists) {
            errors.push({
              field: `${fieldPrefix}.selectedTransfer`,
              code: 'INVALID_TRANSFER_REFERENCE',
              message: `Transfer option ${option.selectedTransfer.id} not found for "${sightseeingData.name}"`,
              severity: 'error',
              details: { transferId: option.selectedTransfer.id }
            });
            integrity.transferIssues++;
          }
        }

        // Country/city consistency validation
        if (option.country && option.country !== sightseeingData.country) {
          warnings.push({
            field: `${fieldPrefix}.country`,
            code: 'COUNTRY_MISMATCH',
            message: `Country mismatch for "${sightseeingData.name}": option has "${option.country}", database has "${sightseeingData.country}"`,
            severity: 'warning',
            details: { optionCountry: option.country, databaseCountry: sightseeingData.country }
          });
        }

        if (option.city && option.city !== sightseeingData.city) {
          warnings.push({
            field: `${fieldPrefix}.city`,
            code: 'CITY_MISMATCH',
            message: `City mismatch for "${sightseeingData.name}": option has "${option.city}", database has "${sightseeingData.city}"`,
            severity: 'warning',
            details: { optionCity: option.city, databaseCity: sightseeingData.city }
          });
        }

        // If we reach here, the option is valid
        integrity.validOptions++;
      }

    } catch (error) {
      errors.push({
        field: 'sightseeing_options',
        code: 'VALIDATION_ERROR',
        message: `Failed to validate sightseeing options: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        details: error
      });
    }

    // Calculate validation score
    const totalOptions = sightseeingOptions.length;
    const validationScore = totalOptions > 0 
      ? Math.round((integrity.validOptions / totalOptions) * 100)
      : 100;

    return {
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings,
        info,
        score: validationScore
      },
      integrity
    };
  }

  /**
   * Comprehensive route data integrity check
   */
  async validateCompleteRoute(route: Partial<Tables<'transport_routes'>>): Promise<RouteDataIntegrity> {
    const routeValidation = this.validateRouteData(route);
    
    const sightseeingOptions = route.sightseeing_options as any[] || [];
    const { validation: sightseeingValidation, integrity: sightseeingIntegrity } = 
      await this.validateSightseeingData(sightseeingOptions);

    // Combine validations
    const combinedValidation: ValidationResult = {
      isValid: routeValidation.isValid && sightseeingValidation.isValid,
      errors: [...routeValidation.errors, ...sightseeingValidation.errors],
      warnings: [...routeValidation.warnings, ...sightseeingValidation.warnings],
      info: [...routeValidation.info, ...sightseeingValidation.info],
      score: Math.round((routeValidation.score + sightseeingValidation.score) / 2)
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (combinedValidation.errors.length > 0) {
      recommendations.push(`Fix ${combinedValidation.errors.length} critical error(s) before saving`);
    }
    
    if (combinedValidation.warnings.length > 0) {
      recommendations.push(`Review ${combinedValidation.warnings.length} warning(s) for data quality`);
    }
    
    if (sightseeingIntegrity.outdatedData > 0) {
      recommendations.push(`Sync ${sightseeingIntegrity.outdatedData} outdated sightseeing option(s)`);
    }
    
    if (sightseeingIntegrity.missingReferences > 0) {
      recommendations.push(`Remove or fix ${sightseeingIntegrity.missingReferences} invalid sightseeing reference(s)`);
    }
    
    if (combinedValidation.score < 80) {
      recommendations.push('Consider improving data quality before publishing this route');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Route data looks good! Ready for production use.');
    }

    return {
      routeValidation: combinedValidation,
      sightseeingIntegrity,
      recommendations,
      lastValidated: new Date()
    };
  }

  /**
   * Generate user-friendly validation summary
   */
  generateValidationSummary(integrity: RouteDataIntegrity): string {
    const { routeValidation, sightseeingIntegrity } = integrity;
    
    let summary = `Route Validation Score: ${routeValidation.score}/100\n`;
    
    if (routeValidation.errors.length > 0) {
      summary += `❌ ${routeValidation.errors.length} error(s) found\n`;
    }
    
    if (routeValidation.warnings.length > 0) {
      summary += `⚠️ ${routeValidation.warnings.length} warning(s) found\n`;
    }
    
    if (sightseeingIntegrity.totalOptions > 0) {
      summary += `\nSightseeing Data:\n`;
      summary += `✅ ${sightseeingIntegrity.validOptions}/${sightseeingIntegrity.totalOptions} options valid\n`;
      
      if (sightseeingIntegrity.missingReferences > 0) {
        summary += `❌ ${sightseeingIntegrity.missingReferences} missing reference(s)\n`;
      }
      
      if (sightseeingIntegrity.outdatedData > 0) {
        summary += `⏰ ${sightseeingIntegrity.outdatedData} outdated option(s)\n`;
      }
    }
    
    summary += `\nRecommendations:\n`;
    integrity.recommendations.forEach(rec => {
      summary += `• ${rec}\n`;
    });
    
    return summary;
  }
}

// Export singleton instance
export const transportRouteValidationService = TransportRouteValidationService.getInstance();