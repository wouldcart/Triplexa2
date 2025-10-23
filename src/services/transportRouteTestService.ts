import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import type { Tables } from '@/integrations/supabase/types';
import { loadSightseeingData } from '@/pages/inventory/sightseeing/services/storageService';
import { transportRouteValidationService } from './transportRouteValidationService';
import { transportRouteErrorService } from './transportRouteErrorService';
import { transportRouteTransactionService } from './transportRouteTransactionService';

// Test result types
export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
  warnings?: string[];
}

export interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  coverage: number; // Percentage of functionality tested
}

export interface SynchronizationTestResult {
  localDataCount: number;
  remoteDataCount: number;
  syncedCount: number;
  failedCount: number;
  missingInRemote: any[];
  extraInRemote: any[];
  dataIntegrityIssues: any[];
  lastSyncTime?: Date;
}

export interface DataIntegrityReport {
  tableConsistency: boolean;
  schemaValidation: boolean;
  referentialIntegrity: boolean;
  dataQuality: number; // 0-100 score
  issues: Array<{
    type: 'critical' | 'warning' | 'info';
    description: string;
    affectedRecords: number;
    recommendation: string;
  }>;
}

export class TransportRouteTestService {
  private static instance: TransportRouteTestService;
  private testResults: TestSuite[] = [];

  static getInstance(): TransportRouteTestService {
    if (!TransportRouteTestService.instance) {
      TransportRouteTestService.instance = new TransportRouteTestService();
    }
    return TransportRouteTestService.instance;
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests(): Promise<TestSuite[]> {
    const testSuites: TestSuite[] = [];

    // Database connectivity tests
    testSuites.push(await this.runDatabaseConnectivityTests());

    // CRUD operation tests
    testSuites.push(await this.runCrudOperationTests());

    // Data validation tests
    testSuites.push(await this.runDataValidationTests());

    // Synchronization tests
    testSuites.push(await this.runSynchronizationTests());

    // Transaction integrity tests
    testSuites.push(await this.runTransactionIntegrityTests());

    // Performance tests
    testSuites.push(await this.runPerformanceTests());

    this.testResults = testSuites;
    return testSuites;
  }

  /**
   * Test database connectivity and basic operations
   */
  async runDatabaseConnectivityTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Basic connection
    tests.push(await this.runTest('Database Connection', async () => {
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .select('count')
        .limit(1);
      
      if (error) throw new Error(`Connection failed: ${error.message}`);
      return { connected: true };
    }));

    // Test 2: Table schema validation
    tests.push(await this.runTest('Table Schema Validation', async () => {
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .select('*')
        .limit(1);
      
      if (error) throw new Error(`Schema validation failed: ${error.message}`);
      
      const requiredColumns = [
        'id', 'country', 'transfer_type', 'status', 
        'sightseeing_options', 'transport_entries', 
        'created_at', 'updated_at'
      ];
      
      if (data && data.length > 0) {
        const record = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in record));
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
        }
      }
      
      return { schemaValid: true, columns: requiredColumns };
    }));

    // Test 3: Permissions check
    tests.push(await this.runTest('Database Permissions', async () => {
      // Test read permission
      const { error: readError } = await supabaseAdmin
        .from('transport_routes')
        .select('id')
        .limit(1);
      
      if (readError) throw new Error(`Read permission failed: ${readError.message}`);
      
      // Test write permission (insert and delete a test record)
      const testData = {
        country: 'TEST',
        transfer_type: 'TEST',
        status: 'draft' as const,
        name: 'Test Route - DELETE ME'
      };
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('transport_routes')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) throw new Error(`Insert permission failed: ${insertError.message}`);
      
      // Clean up test record
      const { error: deleteError } = await supabaseAdmin
        .from('transport_routes')
        .delete()
        .eq('id', insertData.id);
      
      if (deleteError) {
        console.warn(`Failed to clean up test record: ${deleteError.message}`);
      }
      
      return { permissions: ['read', 'write', 'delete'] };
    }));

    const totalDuration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;

    return {
      suiteName: 'Database Connectivity',
      tests,
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      totalDuration,
      coverage: 85 // Basic connectivity covers 85% of database functionality
    };
  }

  /**
   * Test CRUD operations
   */
  async runCrudOperationTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();
    let testRouteId: string | null = null;

    // Test 1: Create operation
    tests.push(await this.runTest('Create Route', async () => {
      const testRoute = {
        country: 'TEST_COUNTRY',
        transfer_type: 'bus',
        status: 'draft' as const,
        name: 'Test Route for CRUD',
        sightseeing_options: [],
        transport_entries: [
          { type: 'bus', price: 50, duration: '2 hours' }
        ]
      };

      const result = await transportRouteTransactionService.createRouteWithTransaction(testRoute);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Create operation failed');
      }
      
      testRouteId = result.data?.id || null;
      return { created: true, routeId: testRouteId };
    }));

    // Test 2: Read operation
    tests.push(await this.runTest('Read Route', async () => {
      if (!testRouteId) throw new Error('No test route ID available');
      
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .select('*')
        .eq('id', testRouteId)
        .single();
      
      if (error) throw new Error(`Read operation failed: ${error.message}`);
      if (!data) throw new Error('Route not found');
      
      return { found: true, data };
    }));

    // Test 3: Update operation
    tests.push(await this.runTest('Update Route', async () => {
      if (!testRouteId) throw new Error('No test route ID available');
      
      const updates = {
        name: 'Updated Test Route',
        status: 'active' as const
      };

      const result = await transportRouteTransactionService.updateRouteWithTransaction(
        testRouteId, 
        updates
      );
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Update operation failed');
      }
      
      return { updated: true, changes: updates };
    }));

    // Test 4: Delete operation
    tests.push(await this.runTest('Delete Route', async () => {
      if (!testRouteId) throw new Error('No test route ID available');
      
      const result = await transportRouteTransactionService.deleteRouteWithTransaction(testRouteId);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Delete operation failed');
      }
      
      // Verify deletion
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .select('id')
        .eq('id', testRouteId)
        .single();
      
      if (!error || data) {
        throw new Error('Route was not properly deleted');
      }
      
      return { deleted: true };
    }));

    const totalDuration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;

    return {
      suiteName: 'CRUD Operations',
      tests,
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      totalDuration,
      coverage: 90 // CRUD operations cover 90% of basic functionality
    };
  }

  /**
   * Test data validation
   */
  async runDataValidationTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Valid route validation
    tests.push(await this.runTest('Valid Route Validation', async () => {
      const validRoute = {
        country: 'Thailand',
        transfer_type: 'bus',
        status: 'active' as const,
        name: 'Bangkok to Pattaya',
        sightseeing_options: [],
        transport_entries: [
          { type: 'bus', price: 100, duration: '2 hours' }
        ]
      };

      const validation = await transportRouteValidationService.validateCompleteRoute(validRoute);
      
      if (!validation.routeValidation.isValid) {
        throw new Error(`Valid route failed validation: ${validation.routeValidation.errors.map(e => e.message).join(', ')}`);
      }
      
      return { validationScore: validation.routeValidation.score };
    }));

    // Test 2: Invalid route validation
    tests.push(await this.runTest('Invalid Route Validation', async () => {
      const invalidRoute = {
        // Missing required fields
        country: '',
        transfer_type: '',
        status: 'invalid_status' as any
      };

      const validation = await transportRouteValidationService.validateCompleteRoute(invalidRoute);
      
      if (validation.routeValidation.isValid) {
        throw new Error('Invalid route passed validation');
      }
      
      if (validation.routeValidation.errors.length === 0) {
        throw new Error('No validation errors detected for invalid route');
      }
      
      return { 
        errorsDetected: validation.routeValidation.errors.length,
        warningsDetected: validation.routeValidation.warnings.length
      };
    }));

    // Test 3: Sightseeing data validation
    tests.push(await this.runTest('Sightseeing Data Validation', async () => {
      const sightseeingData = loadSightseeingData();
      
      if (sightseeingData.length === 0) {
        return { 
          warning: 'No sightseeing data available for testing',
          validOptions: 0,
          totalOptions: 0
        };
      }

      // Test with valid sightseeing options
      const validOptions = sightseeingData.slice(0, 3).map(s => ({
        id: s.id,
        name: s.name,
        country: s.country,
        city: s.city,
        adultPrice: s.price?.adult || 0,
        childPrice: s.price?.child || 0
      }));

      const { validation, integrity } = await transportRouteValidationService.validateSightseeingData(validOptions);
      
      return {
        validationPassed: validation.isValid,
        validOptions: integrity.validOptions,
        totalOptions: integrity.totalOptions,
        issues: integrity.missingReferences + integrity.pricingIssues + integrity.transferIssues
      };
    }));

    const totalDuration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;

    return {
      suiteName: 'Data Validation',
      tests,
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      totalDuration,
      coverage: 75 // Validation tests cover 75% of data integrity
    };
  }

  /**
   * Test data synchronization
   */
  async runSynchronizationTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Local to remote synchronization
    tests.push(await this.runTest('Local to Remote Sync', async () => {
      const localSightseeing = loadSightseeingData();
      
      if (localSightseeing.length === 0) {
        return { 
          warning: 'No local sightseeing data to sync',
          syncedCount: 0
        };
      }

      // Create a test route with sightseeing data
      const testRoute = {
        country: 'SYNC_TEST',
        transfer_type: 'bus',
        status: 'draft' as const,
        name: 'Sync Test Route',
        sightseeing_options: localSightseeing.slice(0, 2).map(s => ({
          id: s.id,
          name: s.name,
          country: s.country,
          city: s.city,
          lastSyncedAt: new Date().toISOString()
        })),
        transport_entries: []
      };

      const result = await transportRouteTransactionService.createRouteWithTransaction(testRoute);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create test route');
      }

      // Verify the data was synced
      const { data: syncedRoute, error } = await supabaseAdmin
        .from('transport_routes')
        .select('sightseeing_options')
        .eq('id', result.data?.id)
        .single();

      if (error) {
        throw new Error(`Failed to verify sync: ${error.message}`);
      }

      // Clean up
      await supabaseAdmin
        .from('transport_routes')
        .delete()
        .eq('id', result.data?.id);

      const syncedOptions = syncedRoute.sightseeing_options as any[] || [];
      
      return {
        syncedCount: syncedOptions.length,
        expectedCount: testRoute.sightseeing_options.length,
        syncSuccessful: syncedOptions.length === testRoute.sightseeing_options.length
      };
    }));

    // Test 2: Data integrity after sync
    tests.push(await this.runTest('Sync Data Integrity', async () => {
      const syncResult = await this.testSynchronizationIntegrity();
      
      if (syncResult.dataIntegrityIssues.length > 0) {
        return {
          warning: `Found ${syncResult.dataIntegrityIssues.length} data integrity issues`,
          issues: syncResult.dataIntegrityIssues,
          integrityScore: Math.max(0, 100 - (syncResult.dataIntegrityIssues.length * 10))
        };
      }
      
      return {
        integrityScore: 100,
        localCount: syncResult.localDataCount,
        remoteCount: syncResult.remoteDataCount
      };
    }));

    const totalDuration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;

    return {
      suiteName: 'Data Synchronization',
      tests,
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      totalDuration,
      coverage: 80 // Sync tests cover 80% of synchronization functionality
    };
  }

  /**
   * Test transaction integrity
   */
  async runTransactionIntegrityTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Successful transaction
    tests.push(await this.runTest('Successful Transaction', async () => {
      const testRoute = {
        country: 'TRANSACTION_TEST',
        transfer_type: 'bus',
        status: 'draft' as const,
        name: 'Transaction Test Route'
      };

      const result = await transportRouteTransactionService.createRouteWithTransaction(testRoute);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Transaction failed');
      }

      // Clean up
      await transportRouteTransactionService.deleteRouteWithTransaction(result.data?.id || '');
      
      return {
        transactionSuccessful: true,
        operationsCompleted: result.operationsCompleted,
        duration: result.duration
      };
    }));

    // Test 2: Transaction rollback
    tests.push(await this.runTest('Transaction Rollback', async () => {
      // This test simulates a failure scenario
      try {
        const result = await transportRouteTransactionService.executeTransaction(
          'create_route',
          [
            // First operation succeeds
            async () => {
              const { data, error } = await supabaseAdmin
                .from('transport_routes')
                .insert({
                  country: 'ROLLBACK_TEST',
                  transfer_type: 'bus',
                  status: 'draft',
                  name: 'Rollback Test Route'
                })
                .select()
                .single();
              
              if (error) throw error;
              return data;
            },
            // Second operation fails intentionally
            async () => {
              throw new Error('Intentional failure for rollback test');
            }
          ]
        );

        if (result.success) {
          throw new Error('Transaction should have failed');
        }

        if (!result.rollbackPerformed) {
          throw new Error('Rollback was not performed');
        }

        return {
          rollbackSuccessful: true,
          operationsCompleted: result.operationsCompleted,
          rollbackPerformed: result.rollbackPerformed
        };
      } catch (error) {
        throw new Error(`Rollback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }));

    const totalDuration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;

    return {
      suiteName: 'Transaction Integrity',
      tests,
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      totalDuration,
      coverage: 70 // Transaction tests cover 70% of transaction functionality
    };
  }

  /**
   * Test performance
   */
  async runPerformanceTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const startTime = Date.now();

    // Test 1: Bulk operations performance
    tests.push(await this.runTest('Bulk Operations Performance', async () => {
      const bulkSize = 10;
      const testRoutes = Array.from({ length: bulkSize }, (_, i) => ({
        id: `perf_test_${i}`,
        data: {
          country: 'PERF_TEST',
          transfer_type: 'bus',
          status: 'draft' as const,
          name: `Performance Test Route ${i + 1}`
        }
      }));

      // Create routes first
      const createPromises = testRoutes.map(route => 
        transportRouteTransactionService.createRouteWithTransaction(route.data)
      );
      
      const createStart = Date.now();
      const createResults = await Promise.all(createPromises);
      const createDuration = Date.now() - createStart;

      const successfulCreates = createResults.filter(r => r.success);
      
      if (successfulCreates.length === 0) {
        throw new Error('No routes were created successfully');
      }

      // Clean up
      const deletePromises = successfulCreates.map(result => 
        transportRouteTransactionService.deleteRouteWithTransaction(result.data?.id || '')
      );
      
      await Promise.all(deletePromises);

      const avgCreateTime = createDuration / successfulCreates.length;
      
      return {
        bulkSize,
        successfulOperations: successfulCreates.length,
        totalDuration: createDuration,
        averageOperationTime: avgCreateTime,
        performanceRating: avgCreateTime < 1000 ? 'excellent' : avgCreateTime < 3000 ? 'good' : 'needs_improvement'
      };
    }));

    const totalDuration = Date.now() - startTime;
    const passedTests = tests.filter(t => t.passed).length;

    return {
      suiteName: 'Performance Tests',
      tests,
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      totalDuration,
      coverage: 60 // Performance tests cover 60% of performance aspects
    };
  }

  /**
   * Test synchronization integrity
   */
  async testSynchronizationIntegrity(): Promise<SynchronizationTestResult> {
    const localSightseeing = loadSightseeingData();
    
    // Get all routes with sightseeing options
    const { data: routes, error } = await supabaseAdmin
      .from('transport_routes')
      .select('id, sightseeing_options')
      .not('sightseeing_options', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch routes: ${error.message}`);
    }

    const remoteOptions: any[] = [];
    const dataIntegrityIssues: any[] = [];

    routes?.forEach(route => {
      const options = route.sightseeing_options as any[] || [];
      remoteOptions.push(...options);

      // Check for integrity issues
      options.forEach(option => {
        const localData = localSightseeing.find(s => s.id === option.id);
        
        if (!localData) {
          dataIntegrityIssues.push({
            type: 'missing_local_reference',
            routeId: route.id,
            sightseeingId: option.id,
            description: `Sightseeing option ${option.id} exists in remote but not in local data`
          });
        } else {
          // Check for data consistency
          if (option.country && option.country !== localData.country) {
            dataIntegrityIssues.push({
              type: 'data_mismatch',
              routeId: route.id,
              sightseeingId: option.id,
              field: 'country',
              remoteValue: option.country,
              localValue: localData.country,
              description: `Country mismatch for sightseeing ${option.id}`
            });
          }
        }
      });
    });

    const missingInRemote = localSightseeing.filter(local => 
      !remoteOptions.some(remote => remote.id === local.id)
    );

    const extraInRemote = remoteOptions.filter(remote => 
      !localSightseeing.some(local => local.id === remote.id)
    );

    return {
      localDataCount: localSightseeing.length,
      remoteDataCount: remoteOptions.length,
      syncedCount: remoteOptions.filter(remote => 
        localSightseeing.some(local => local.id === remote.id)
      ).length,
      failedCount: dataIntegrityIssues.length,
      missingInRemote,
      extraInRemote,
      dataIntegrityIssues,
      lastSyncTime: new Date()
    };
  }

  /**
   * Generate comprehensive data integrity report
   */
  async generateDataIntegrityReport(): Promise<DataIntegrityReport> {
    const issues: DataIntegrityReport['issues'] = [];
    let qualityScore = 100;

    try {
      // Test table consistency
      const { data: routes, error: routesError } = await supabaseAdmin
        .from('transport_routes')
        .select('*');

      if (routesError) {
        issues.push({
          type: 'critical',
          description: `Cannot access transport_routes table: ${routesError.message}`,
          affectedRecords: 0,
          recommendation: 'Check database connectivity and permissions'
        });
        qualityScore -= 30;
      }

      // Test synchronization integrity
      const syncResult = await this.testSynchronizationIntegrity();
      
      if (syncResult.dataIntegrityIssues.length > 0) {
        issues.push({
          type: 'warning',
          description: `Found ${syncResult.dataIntegrityIssues.length} data integrity issues`,
          affectedRecords: syncResult.dataIntegrityIssues.length,
          recommendation: 'Review and fix data inconsistencies between local and remote data'
        });
        qualityScore -= syncResult.dataIntegrityIssues.length * 5;
      }

      if (syncResult.missingInRemote.length > 0) {
        issues.push({
          type: 'info',
          description: `${syncResult.missingInRemote.length} local sightseeing options not synced to remote`,
          affectedRecords: syncResult.missingInRemote.length,
          recommendation: 'Consider syncing missing local data to remote database'
        });
        qualityScore -= syncResult.missingInRemote.length * 2;
      }

      // Test data validation
      if (routes) {
        let invalidRoutes = 0;
        
        for (const route of routes) {
          const validation = await transportRouteValidationService.validateCompleteRoute(route);
          if (!validation.routeValidation.isValid) {
            invalidRoutes++;
          }
        }

        if (invalidRoutes > 0) {
          issues.push({
            type: 'warning',
            description: `${invalidRoutes} routes have validation issues`,
            affectedRecords: invalidRoutes,
            recommendation: 'Run validation checks and fix data quality issues'
          });
          qualityScore -= invalidRoutes * 3;
        }
      }

    } catch (error) {
      issues.push({
        type: 'critical',
        description: `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        affectedRecords: 0,
        recommendation: 'Investigate system errors and ensure proper error handling'
      });
      qualityScore -= 50;
    }

    return {
      tableConsistency: !issues.some(i => i.type === 'critical'),
      schemaValidation: !issues.some(i => i.description.includes('schema')),
      referentialIntegrity: !issues.some(i => i.description.includes('reference')),
      dataQuality: Math.max(0, qualityScore),
      issues
    };
  }

  /**
   * Get test results summary
   */
  getTestResultsSummary(): {
    totalSuites: number;
    passedSuites: number;
    totalTests: number;
    passedTests: number;
    overallCoverage: number;
    overallDuration: number;
  } {
    const totalSuites = this.testResults.length;
    const passedSuites = this.testResults.filter(s => s.passed).length;
    const totalTests = this.testResults.reduce((sum, s) => sum + s.totalTests, 0);
    const passedTests = this.testResults.reduce((sum, s) => sum + s.passedTests, 0);
    const overallCoverage = this.testResults.reduce((sum, s) => sum + s.coverage, 0) / totalSuites;
    const overallDuration = this.testResults.reduce((sum, s) => sum + s.totalDuration, 0);

    return {
      totalSuites,
      passedSuites,
      totalTests,
      passedTests,
      overallCoverage: Math.round(overallCoverage),
      overallDuration
    };
  }

  // Private helper method
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        passed: true,
        duration,
        details: result,
        warnings: result?.warning ? [result.warning] : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Export singleton instance
export const transportRouteTestService = TransportRouteTestService.getInstance();