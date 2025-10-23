import { adminSupabase as supabaseAdmin } from '@/lib/supabaseClient';
import type { Tables } from '@/integrations/supabase/types';
import { transportRouteErrorService } from './transportRouteErrorService';
import { transportRouteValidationService } from './transportRouteValidationService';

// Transaction operation types
export type TransactionOperation = 
  | 'create_route'
  | 'update_route'
  | 'delete_route'
  | 'sync_sightseeing'
  | 'bulk_update'
  | 'data_migration';

// Transaction context for tracking
export interface TransactionContext {
  operationType: TransactionOperation;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  startTime: Date;
}

// Transaction result
export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  rollbackPerformed?: boolean;
  operationsCompleted: number;
  totalOperations: number;
  duration: number;
  warnings?: string[];
}

// Rollback operation
export interface RollbackOperation {
  operation: string;
  table: string;
  data: any;
  execute: () => Promise<void>;
}

// Transaction state
interface TransactionState {
  id: string;
  context: TransactionContext;
  rollbackOperations: RollbackOperation[];
  completed: boolean;
  rolledBack: boolean;
}

export class TransportRouteTransactionService {
  private static instance: TransportRouteTransactionService;
  private activeTransactions = new Map<string, TransactionState>();

  static getInstance(): TransportRouteTransactionService {
    if (!TransportRouteTransactionService.instance) {
      TransportRouteTransactionService.instance = new TransportRouteTransactionService();
    }
    return TransportRouteTransactionService.instance;
  }

  /**
   * Execute a transaction with automatic rollback on failure
   */
  async executeTransaction<T>(
    operationType: TransactionOperation,
    operations: Array<() => Promise<any>>,
    context?: Partial<TransactionContext>
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId();
    const startTime = new Date();
    
    const transactionContext: TransactionContext = {
      operationType,
      startTime,
      ...context
    };

    const transactionState: TransactionState = {
      id: transactionId,
      context: transactionContext,
      rollbackOperations: [],
      completed: false,
      rolledBack: false
    };

    this.activeTransactions.set(transactionId, transactionState);

    try {
      transportRouteErrorService.logError(
        'info',
        'database',
        'TRANSACTION_STARTED',
        `Transaction ${transactionId} started for ${operationType}`,
        {
          operation: `transaction_${operationType}`,
          additionalData: { transactionId, operationsCount: operations.length }
        }
      );

      const results: any[] = [];
      let completedOperations = 0;

      // Execute operations sequentially
      for (const operation of operations) {
        try {
          const result = await operation();
          results.push(result);
          completedOperations++;
        } catch (error) {
          // Log the error
          transportRouteErrorService.logError(
            'error',
            'database',
            'TRANSACTION_OPERATION_FAILED',
            `Transaction operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
              operation: `transaction_${operationType}_op_${completedOperations + 1}`,
              additionalData: { transactionId, operationIndex: completedOperations }
            },
            undefined,
            error instanceof Error ? error : new Error(String(error))
          );

          // Perform rollback
          await this.performRollback(transactionId);
          
          const duration = Date.now() - startTime.getTime();
          
          return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            rollbackPerformed: true,
            operationsCompleted: completedOperations,
            totalOperations: operations.length,
            duration
          };
        }
      }

      // Mark transaction as completed
      transactionState.completed = true;
      
      const duration = Date.now() - startTime.getTime();

      transportRouteErrorService.logError(
        'info',
        'database',
        'TRANSACTION_COMPLETED',
        `Transaction ${transactionId} completed successfully`,
        {
          operation: `transaction_${operationType}`,
          additionalData: { transactionId, duration, operationsCompleted }
        }
      );

      return {
        success: true,
        data: results.length === 1 ? results[0] : results,
        operationsCompleted: completedOperations,
        totalOperations: operations.length,
        duration
      };

    } catch (error) {
      // Unexpected error - perform rollback
      await this.performRollback(transactionId);
      
      const duration = Date.now() - startTime.getTime();
      
      transportRouteErrorService.logError(
        'critical',
        'database',
        'TRANSACTION_UNEXPECTED_ERROR',
        `Unexpected transaction error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: `transaction_${operationType}`,
          additionalData: { transactionId }
        },
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        rollbackPerformed: true,
        operationsCompleted: 0,
        totalOperations: operations.length,
        duration
      };
    } finally {
      // Clean up transaction state
      this.activeTransactions.delete(transactionId);
    }
  }

  /**
   * Create a transport route with transaction support
   */
  async createRouteWithTransaction(
    routeData: Omit<Tables<'transport_routes'>, 'id' | 'created_at' | 'updated_at'>,
    context?: Partial<TransactionContext>
  ): Promise<TransactionResult<Tables<'transport_routes'>>> {
    // Pre-validation
    const validation = await transportRouteValidationService.validateCompleteRoute(routeData);
    
    if (!validation.routeValidation.isValid) {
      const validationErrors = validation.routeValidation.errors.map(e => e.message).join(', ');
      return {
        success: false,
        error: new Error(`Validation failed: ${validationErrors}`),
        operationsCompleted: 0,
        totalOperations: 1,
        duration: 0
      };
    }

    return this.executeTransaction<Tables<'transport_routes'>>(
      'create_route',
      [
        async () => {
          const { data, error } = await supabaseAdmin
            .from('transport_routes')
            .insert(routeData)
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to create route: ${error.message}`);
          }

          // Add rollback operation
          const transactionId = Array.from(this.activeTransactions.keys()).pop();
          if (transactionId) {
            const transaction = this.activeTransactions.get(transactionId);
            if (transaction) {
              transaction.rollbackOperations.push({
                operation: 'delete_created_route',
                table: 'transport_routes',
                data: { id: data.id },
                execute: async () => {
                  await supabaseAdmin
                    .from('transport_routes')
                    .delete()
                    .eq('id', data.id);
                }
              });
            }
          }

          return data;
        }
      ],
      context
    );
  }

  /**
   * Update a transport route with transaction support
   */
  async updateRouteWithTransaction(
    routeId: string,
    updates: Partial<Tables<'transport_routes'>>,
    context?: Partial<TransactionContext>
  ): Promise<TransactionResult<Tables<'transport_routes'>>> {
    // Pre-validation
    const validation = await transportRouteValidationService.validateCompleteRoute(updates);
    
    if (!validation.routeValidation.isValid) {
      const validationErrors = validation.routeValidation.errors.map(e => e.message).join(', ');
      return {
        success: false,
        error: new Error(`Validation failed: ${validationErrors}`),
        operationsCompleted: 0,
        totalOperations: 1,
        duration: 0
      };
    }

    return this.executeTransaction<Tables<'transport_routes'>>(
      'update_route',
      [
        async () => {
          // First, get the current data for rollback
          const { data: currentData, error: fetchError } = await supabaseAdmin
            .from('transport_routes')
            .select()
            .eq('id', routeId)
            .single();

          if (fetchError) {
            throw new Error(`Failed to fetch current route data: ${fetchError.message}`);
          }

          // Perform the update
          const { data, error } = await supabaseAdmin
            .from('transport_routes')
            .update(updates)
            .eq('id', routeId)
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to update route: ${error.message}`);
          }

          // Add rollback operation
          const transactionId = Array.from(this.activeTransactions.keys()).pop();
          if (transactionId) {
            const transaction = this.activeTransactions.get(transactionId);
            if (transaction) {
              transaction.rollbackOperations.push({
                operation: 'restore_original_route',
                table: 'transport_routes',
                data: currentData,
                execute: async () => {
                  await supabaseAdmin
                    .from('transport_routes')
                    .update(currentData)
                    .eq('id', routeId);
                }
              });
            }
          }

          return data;
        }
      ],
      context
    );
  }

  /**
   * Delete a transport route with transaction support
   */
  async deleteRouteWithTransaction(
    routeId: string,
    context?: Partial<TransactionContext>
  ): Promise<TransactionResult<void>> {
    return this.executeTransaction<void>(
      'delete_route',
      [
        async () => {
          // First, get the current data for rollback
          const { data: currentData, error: fetchError } = await supabaseAdmin
            .from('transport_routes')
            .select()
            .eq('id', routeId)
            .single();

          if (fetchError) {
            throw new Error(`Failed to fetch route data for deletion: ${fetchError.message}`);
          }

          // Perform the deletion
          const { error } = await supabaseAdmin
            .from('transport_routes')
            .delete()
            .eq('id', routeId);

          if (error) {
            throw new Error(`Failed to delete route: ${error.message}`);
          }

          // Add rollback operation
          const transactionId = Array.from(this.activeTransactions.keys()).pop();
          if (transactionId) {
            const transaction = this.activeTransactions.get(transactionId);
            if (transaction) {
              transaction.rollbackOperations.push({
                operation: 'restore_deleted_route',
                table: 'transport_routes',
                data: currentData,
                execute: async () => {
                  const { id, created_at, updated_at, ...restoreData } = currentData;
                  await supabaseAdmin
                    .from('transport_routes')
                    .insert({ ...restoreData, id });
                }
              });
            }
          }
        }
      ],
      context
    );
  }

  /**
   * Bulk update routes with transaction support
   */
  async bulkUpdateRoutesWithTransaction(
    updates: Array<{ id: string; data: Partial<Tables<'transport_routes'>> }>,
    context?: Partial<TransactionContext>
  ): Promise<TransactionResult<Tables<'transport_routes'>[]>> {
    // Pre-validate all updates
    for (const update of updates) {
      const validation = await transportRouteValidationService.validateCompleteRoute(update.data);
      if (!validation.routeValidation.isValid) {
        const validationErrors = validation.routeValidation.errors.map(e => e.message).join(', ');
        return {
          success: false,
          error: new Error(`Validation failed for route ${update.id}: ${validationErrors}`),
          operationsCompleted: 0,
          totalOperations: updates.length,
          duration: 0
        };
      }
    }

    const operations = updates.map(update => async () => {
      // Get current data for rollback
      const { data: currentData, error: fetchError } = await supabaseAdmin
        .from('transport_routes')
        .select()
        .eq('id', update.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current data for route ${update.id}: ${fetchError.message}`);
      }

      // Perform update
      const { data, error } = await supabaseAdmin
        .from('transport_routes')
        .update(update.data)
        .eq('id', update.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update route ${update.id}: ${error.message}`);
      }

      // Add rollback operation
      const transactionId = Array.from(this.activeTransactions.keys()).pop();
      if (transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (transaction) {
          transaction.rollbackOperations.push({
            operation: `restore_route_${update.id}`,
            table: 'transport_routes',
            data: currentData,
            execute: async () => {
              await supabaseAdmin
                .from('transport_routes')
                .update(currentData)
                .eq('id', update.id);
            }
          });
        }
      }

      return data;
    });

    return this.executeTransaction<Tables<'transport_routes'>[]>(
      'bulk_update',
      operations,
      context
    );
  }

  /**
   * Synchronize sightseeing data with transaction support
   */
  async syncSightseeingWithTransaction(
    routeId: string,
    sightseeingOptions: any[],
    context?: Partial<TransactionContext>
  ): Promise<TransactionResult<Tables<'transport_routes'>>> {
    // Validate sightseeing data
    const { validation } = await transportRouteValidationService.validateSightseeingData(sightseeingOptions);
    
    if (!validation.isValid) {
      const validationErrors = validation.errors.map(e => e.message).join(', ');
      return {
        success: false,
        error: new Error(`Sightseeing validation failed: ${validationErrors}`),
        operationsCompleted: 0,
        totalOperations: 1,
        duration: 0
      };
    }

    return this.executeTransaction<Tables<'transport_routes'>>(
      'sync_sightseeing',
      [
        async () => {
          // Get current route data
          const { data: currentRoute, error: fetchError } = await supabaseAdmin
            .from('transport_routes')
            .select()
            .eq('id', routeId)
            .single();

          if (fetchError) {
            throw new Error(`Failed to fetch route for sightseeing sync: ${fetchError.message}`);
          }

          // Update with new sightseeing options
          const { data, error } = await supabaseAdmin
            .from('transport_routes')
            .update({ 
              sightseeing_options: sightseeingOptions,
              updated_at: new Date().toISOString()
            })
            .eq('id', routeId)
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to sync sightseeing data: ${error.message}`);
          }

          // Add rollback operation
          const transactionId = Array.from(this.activeTransactions.keys()).pop();
          if (transactionId) {
            const transaction = this.activeTransactions.get(transactionId);
            if (transaction) {
              transaction.rollbackOperations.push({
                operation: 'restore_sightseeing_data',
                table: 'transport_routes',
                data: { sightseeing_options: currentRoute.sightseeing_options },
                execute: async () => {
                  await supabaseAdmin
                    .from('transport_routes')
                    .update({ sightseeing_options: currentRoute.sightseeing_options })
                    .eq('id', routeId);
                }
              });
            }
          }

          return data;
        }
      ],
      context
    );
  }

  /**
   * Get active transaction status
   */
  getActiveTransactions(): Array<{
    id: string;
    operationType: TransactionOperation;
    startTime: Date;
    operationsCount: number;
  }> {
    return Array.from(this.activeTransactions.values()).map(transaction => ({
      id: transaction.id,
      operationType: transaction.context.operationType,
      startTime: transaction.context.startTime,
      operationsCount: transaction.rollbackOperations.length
    }));
  }

  /**
   * Force rollback of a specific transaction
   */
  async forceRollback(transactionId: string): Promise<boolean> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      return false;
    }

    await this.performRollback(transactionId);
    return true;
  }

  // Private helper methods
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async performRollback(transactionId: string): Promise<void> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction || transaction.rolledBack) {
      return;
    }

    transportRouteErrorService.logError(
      'warning',
      'database',
      'TRANSACTION_ROLLBACK_STARTED',
      `Starting rollback for transaction ${transactionId}`,
      {
        operation: `rollback_${transaction.context.operationType}`,
        additionalData: { transactionId, operationsToRollback: transaction.rollbackOperations.length }
      }
    );

    // Execute rollback operations in reverse order
    const rollbackOperations = [...transaction.rollbackOperations].reverse();
    let rolledBackCount = 0;

    for (const rollbackOp of rollbackOperations) {
      try {
        await rollbackOp.execute();
        rolledBackCount++;
      } catch (error) {
        transportRouteErrorService.logError(
          'error',
          'database',
          'ROLLBACK_OPERATION_FAILED',
          `Rollback operation failed: ${rollbackOp.operation}`,
          {
            operation: `rollback_${transaction.context.operationType}`,
            additionalData: { transactionId, rollbackOperation: rollbackOp.operation }
          },
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
        // Continue with other rollback operations
      }
    }

    transaction.rolledBack = true;

    transportRouteErrorService.logError(
      'info',
      'database',
      'TRANSACTION_ROLLBACK_COMPLETED',
      `Rollback completed for transaction ${transactionId}`,
      {
        operation: `rollback_${transaction.context.operationType}`,
        additionalData: { 
          transactionId, 
          operationsRolledBack: rolledBackCount,
          totalOperations: rollbackOperations.length
        }
      }
    );
  }
}

// Export singleton instance
export const transportRouteTransactionService = TransportRouteTransactionService.getInstance();