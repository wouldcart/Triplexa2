import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Data Consistency Validator for Integrated Transport Service
 * 
 * This script validates:
 * 1. Foreign key relationships between tables
 * 2. Data integrity constraints
 * 3. Referential integrity
 * 4. Business logic constraints
 */

class DataConsistencyValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  /**
   * Validate foreign key relationships
   */
  async validateForeignKeyRelationships() {
    this.log('🔗 Validating foreign key relationships...');

    try {
      // Check transport_routes -> location_codes relationships
      const { data: routes, error: routesError } = await supabase
        .from('transport_routes')
        .select('id, start_location, end_location');

      if (routesError) {
        this.addError(`Failed to fetch transport routes: ${routesError.message}`);
        return false;
      }

      const { data: locationCodes, error: locationError } = await supabase
        .from('location_codes')
        .select('code');

      if (locationError) {
        this.addError(`Failed to fetch location codes: ${locationError.message}`);
        return false;
      }

      const validLocationCodes = new Set(locationCodes.map(loc => loc.code));

      // Validate start and end location codes
      for (const route of routes) {
        if (!validLocationCodes.has(route.start_location)) {
          this.addError(`Route ${route.id} has invalid start_location: ${route.start_location}`);
        }
        if (!validLocationCodes.has(route.end_location)) {
          this.addError(`Route ${route.id} has invalid end_location: ${route.end_location}`);
        }
      }

      // Check intermediate_stops -> transport_routes relationships
      const { data: stops, error: stopsError } = await supabase
        .from('intermediate_stops')
        .select('id, route_id, location_code');

      if (stopsError) {
        this.addError(`Failed to fetch intermediate stops: ${stopsError.message}`);
        return false;
      }

      const validRouteIds = new Set(routes.map(route => route.id));

      for (const stop of stops) {
        if (!validRouteIds.has(stop.route_id)) {
          this.addError(`Intermediate stop ${stop.id} references invalid route_id: ${stop.route_id}`);
        }
        if (!validLocationCodes.has(stop.location_code)) {
          this.addError(`Intermediate stop ${stop.id} has invalid location_code: ${stop.location_code}`);
        }
      }

      // Check transport_types relationships (if route_id column exists)
      try {
        const { data: transportTypes, error: typesError } = await supabase
          .from('transport_types')
          .select('*')
          .limit(1);

        if (typesError) {
          this.addWarning(`Could not check transport_types relationships: ${typesError.message}`);
        } else if (transportTypes.length > 0) {
          const firstType = transportTypes[0];
          if ('route_id' in firstType) {
            // route_id column exists, validate relationships
            const { data: allTypes, error: allTypesError } = await supabase
              .from('transport_types')
              .select('id, route_id');

            if (allTypesError) {
              this.addError(`Failed to fetch transport types: ${allTypesError.message}`);
            } else {
              for (const transportType of allTypes) {
                if (transportType.route_id && !validRouteIds.has(transportType.route_id)) {
                  this.addError(`Transport type ${transportType.id} references invalid route_id: ${transportType.route_id}`);
                }
              }
            }
          } else {
            this.log('ℹ️ transport_types table does not have route_id column - skipping relationship check');
          }
        }
      } catch (typeError) {
        this.addWarning(`Could not validate transport_types relationships: ${typeError.message}`);
      }

      this.log('✅ Foreign key relationship validation completed');
      return true;

    } catch (error) {
      this.addError(`Foreign key validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate data integrity constraints
   */
  async validateDataIntegrity() {
    this.log('🔍 Validating data integrity constraints...');

    try {
      // Validate location_codes constraints
      const { data: locations, error: locError } = await supabase
        .from('location_codes')
        .select('*');

      if (locError) {
        this.addError(`Failed to fetch location codes: ${locError.message}`);
        return false;
      }

      for (const location of locations) {
        if (!location.code || location.code.trim() === '') {
          this.addError(`Location ${location.id} has empty or null code`);
        }
        if (!location.name || location.name.trim() === '') {
          this.addError(`Location ${location.id} has empty or null name`);
        }
        if (!location.type || !['airport', 'hotel', 'attraction', 'city'].includes(location.type)) {
          this.addError(`Location ${location.id} has invalid type: ${location.type}`);
        }
      }

      // Validate transport_routes constraints
      const { data: routes, error: routesError } = await supabase
        .from('transport_routes')
        .select('*');

      if (routesError) {
        this.addError(`Failed to fetch transport routes: ${routesError.message}`);
        return false;
      }

      for (const route of routes) {
        if (!route.route_code || route.route_code.trim() === '') {
          this.addError(`Route ${route.id} has empty or null route_code`);
        }
        if (!route.start_location || route.start_location.trim() === '') {
          this.addError(`Route ${route.id} has empty or null start_location`);
        }
        if (!route.end_location || route.end_location.trim() === '') {
          this.addError(`Route ${route.id} has empty or null end_location`);
        }
        if (route.start_location === route.end_location) {
          this.addWarning(`Route ${route.id} has same start and end location: ${route.start_location}`);
        }
        if (route.price && route.price < 0) {
          this.addError(`Route ${route.id} has negative price: ${route.price}`);
        }
        if (route.duration_minutes && route.duration_minutes <= 0) {
          this.addError(`Route ${route.id} has invalid duration: ${route.duration_minutes}`);
        }
      }

      // Validate intermediate_stops constraints
      const { data: stops, error: stopsError } = await supabase
        .from('intermediate_stops')
        .select('*');

      if (stopsError) {
        this.addError(`Failed to fetch intermediate stops: ${stopsError.message}`);
        return false;
      }

      for (const stop of stops) {
        if (!stop.location_code || stop.location_code.trim() === '') {
          this.addError(`Intermediate stop ${stop.id} has empty or null location_code`);
        }
        if (stop.stop_order && stop.stop_order <= 0) {
          this.addError(`Intermediate stop ${stop.id} has invalid stop_order: ${stop.stop_order}`);
        }
        if (stop.duration_minutes && stop.duration_minutes < 0) {
          this.addError(`Intermediate stop ${stop.id} has negative duration: ${stop.duration_minutes}`);
        }
      }

      this.log('✅ Data integrity validation completed');
      return true;

    } catch (error) {
      this.addError(`Data integrity validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate business logic constraints
   */
  async validateBusinessLogic() {
    this.log('💼 Validating business logic constraints...');

    try {
      // Check for duplicate route codes
      const { data: routes, error: routesError } = await supabase
        .from('transport_routes')
        .select('id, route_code');

      if (routesError) {
        this.addError(`Failed to fetch routes for business logic validation: ${routesError.message}`);
        return false;
      }

      const routeCodes = new Map();
      for (const route of routes) {
        if (routeCodes.has(route.route_code)) {
          this.addError(`Duplicate route code found: ${route.route_code} (routes ${routeCodes.get(route.route_code)} and ${route.id})`);
        } else {
          routeCodes.set(route.route_code, route.id);
        }
      }

      // Check for duplicate location codes
      const { data: locations, error: locError } = await supabase
        .from('location_codes')
        .select('id, code');

      if (locError) {
        this.addError(`Failed to fetch locations for business logic validation: ${locError.message}`);
        return false;
      }

      const locationCodes = new Map();
      for (const location of locations) {
        if (locationCodes.has(location.code)) {
          this.addError(`Duplicate location code found: ${location.code} (locations ${locationCodes.get(location.code)} and ${location.id})`);
        } else {
          locationCodes.set(location.code, location.id);
        }
      }

      // Validate intermediate stops ordering
      const { data: stopsWithRoutes, error: stopsError } = await supabase
        .from('intermediate_stops')
        .select('route_id, stop_order')
        .order('route_id, stop_order');

      if (stopsError) {
        this.addError(`Failed to fetch stops for ordering validation: ${stopsError.message}`);
        return false;
      }

      if (stopsWithRoutes.length === 0) {
        this.log('ℹ️ No intermediate stops found to validate');
      } else {
        const routeStops = new Map();
        for (const stop of stopsWithRoutes) {
          if (!routeStops.has(stop.route_id)) {
            routeStops.set(stop.route_id, []);
          }
          routeStops.get(stop.route_id).push(stop.stop_order);
        }

        for (const [routeId, orders] of routeStops) {
          // Sort orders to check for proper sequence
          const sortedOrders = [...orders].sort((a, b) => a - b);
          
          // Check for sequential ordering starting from 1
          const expectedOrder = Array.from({ length: sortedOrders.length }, (_, i) => i + 1);
          
          if (JSON.stringify(expectedOrder) !== JSON.stringify(sortedOrders)) {
            this.addError(`Route ${routeId}: Invalid stop ordering. Expected: [${expectedOrder.join(', ')}], Got: [${sortedOrders.join(', ')}]`);
          }

          // Check for duplicate stop orders
          const uniqueOrders = new Set(orders);
          if (uniqueOrders.size !== orders.length) {
            this.addError(`Route ${routeId} has duplicate stop orders`);
          }
        }
      }

      this.log('✅ Business logic validation completed');
      return true;

    } catch (error) {
      this.addError(`Business logic validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    this.log('📊 Generating validation report...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        status: this.errors.length === 0 ? 'PASSED' : 'FAILED'
      },
      errors: this.errors,
      warnings: this.warnings,
      validationResults: this.validationResults
    };

    console.log('\n' + '='.repeat(60));
    console.log('📋 DATA CONSISTENCY VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Status: ${report.summary.status}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    console.log(`Timestamp: ${report.timestamp}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All validations passed successfully!');
    }

    console.log('='.repeat(60));

    return report;
  }

  /**
   * Run all validations
   */
  async runAllValidations() {
    this.log('🚀 Starting comprehensive data consistency validation...');

    const validations = [
      { name: 'Foreign Key Relationships', fn: () => this.validateForeignKeyRelationships() },
      { name: 'Data Integrity', fn: () => this.validateDataIntegrity() },
      { name: 'Business Logic', fn: () => this.validateBusinessLogic() }
    ];

    for (const validation of validations) {
      this.log(`\n🔄 Running ${validation.name} validation...`);
      try {
        const result = await validation.fn();
        this.validationResults[validation.name] = result;
      } catch (error) {
        this.addError(`${validation.name} validation failed: ${error.message}`);
        this.validationResults[validation.name] = false;
      }
    }

    return this.generateReport();
  }
}

// Run the validation
async function main() {
  const validator = new DataConsistencyValidator();
  const report = await validator.runAllValidations();
  
  // Exit with appropriate code
  process.exit(report.summary.totalErrors > 0 ? 1 : 0);
}

main().catch(console.error);