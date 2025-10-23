import type { Tables } from '@/integrations/supabase/types';
import type { ValidationError, ValidationResult } from './transportRouteValidationService';

// Error severity levels
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';

// Error categories
export type ErrorCategory = 
  | 'validation' 
  | 'database' 
  | 'network' 
  | 'authentication' 
  | 'authorization' 
  | 'business_logic' 
  | 'data_integrity' 
  | 'synchronization'
  | 'user_input';

// Error context for better debugging
export interface ErrorContext {
  userId?: string;
  routeId?: string;
  operation: string;
  timestamp: Date;
  userAgent?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

// Structured error log entry
export interface ErrorLogEntry {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  details?: any;
  context: ErrorContext;
  stackTrace?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
}

// User feedback interface
export interface UserFeedback {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
  }>;
  duration?: number; // Auto-dismiss duration in ms
  persistent?: boolean; // Don't auto-dismiss
}

// Error statistics for monitoring
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: ErrorLogEntry[];
  topErrors: Array<{ code: string; count: number; lastOccurred: Date }>;
  errorRate: number; // Errors per hour
  resolutionRate: number; // Percentage of resolved errors
}

export class TransportRouteErrorService {
  private static instance: TransportRouteErrorService;
  private errorLog: ErrorLogEntry[] = [];
  private errorCallbacks: Array<(error: ErrorLogEntry) => void> = [];
  private feedbackCallbacks: Array<(feedback: UserFeedback) => void> = [];

  static getInstance(): TransportRouteErrorService {
    if (!TransportRouteErrorService.instance) {
      TransportRouteErrorService.instance = new TransportRouteErrorService();
    }
    return TransportRouteErrorService.instance;
  }

  /**
   * Log an error with full context
   */
  logError(
    severity: ErrorSeverity,
    category: ErrorCategory,
    code: string,
    message: string,
    context: Partial<ErrorContext>,
    details?: any,
    error?: Error
  ): string {
    const errorId = this.generateErrorId();
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      severity,
      category,
      code,
      message,
      details,
      context: {
        operation: context.operation || 'unknown',
        timestamp: new Date(),
        ...context
      },
      stackTrace: error?.stack,
      resolved: false,
      tags: this.generateTags(category, code, severity)
    };

    this.errorLog.push(logEntry);
    
    // Trigger callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(logEntry);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = this.getConsoleMethod(severity);
      logMethod(`[${category.toUpperCase()}] ${code}: ${message}`, {
        details,
        context,
        error
      });
    }

    // Persist to localStorage for debugging
    this.persistErrorLog();

    return errorId;
  }

  /**
   * Log validation errors
   */
  logValidationErrors(
    validationResult: ValidationResult,
    context: Partial<ErrorContext>
  ): string[] {
    const errorIds: string[] = [];

    validationResult.errors.forEach(error => {
      const errorId = this.logError(
        'error',
        'validation',
        error.code,
        error.message,
        {
          ...context,
          operation: context.operation || 'validation'
        },
        {
          field: error.field,
          validationDetails: error.details
        }
      );
      errorIds.push(errorId);
    });

    validationResult.warnings.forEach(warning => {
      const errorId = this.logError(
        'warning',
        'validation',
        warning.code,
        warning.message,
        {
          ...context,
          operation: context.operation || 'validation'
        },
        {
          field: warning.field,
          validationDetails: warning.details
        }
      );
      errorIds.push(errorId);
    });

    return errorIds;
  }

  /**
   * Log database operation errors
   */
  logDatabaseError(
    operation: string,
    error: Error,
    context: Partial<ErrorContext>,
    additionalDetails?: any
  ): string {
    return this.logError(
      'error',
      'database',
      this.getDatabaseErrorCode(error),
      `Database ${operation} failed: ${error.message}`,
      {
        ...context,
        operation: `database_${operation}`
      },
      {
        originalError: error.message,
        ...additionalDetails
      },
      error
    );
  }

  /**
   * Log synchronization errors
   */
  logSynchronizationError(
    syncType: string,
    error: Error,
    context: Partial<ErrorContext>,
    failedData?: any
  ): string {
    return this.logError(
      'error',
      'synchronization',
      'SYNC_FAILED',
      `${syncType} synchronization failed: ${error.message}`,
      {
        ...context,
        operation: `sync_${syncType}`
      },
      {
        syncType,
        failedData,
        originalError: error.message
      },
      error
    );
  }

  /**
   * Show user feedback
   */
  showUserFeedback(feedback: UserFeedback): void {
    this.feedbackCallbacks.forEach(callback => {
      try {
        callback(feedback);
      } catch (error) {
        console.error('Error in feedback callback:', error);
      }
    });
  }

  /**
   * Show validation feedback to user
   */
  showValidationFeedback(
    validationResult: ValidationResult,
    routeName?: string
  ): void {
    if (validationResult.errors.length > 0) {
      this.showUserFeedback({
        type: 'error',
        title: 'Validation Failed',
        message: `${routeName ? `Route "${routeName}"` : 'Route'} has ${validationResult.errors.length} error(s) that must be fixed`,
        details: validationResult.errors.map(e => `• ${e.message}`).join('\n'),
        persistent: true,
        actions: [{
          label: 'View Details',
          action: () => this.showDetailedValidationErrors(validationResult.errors),
          variant: 'secondary'
        }]
      });
    } else if (validationResult.warnings.length > 0) {
      this.showUserFeedback({
        type: 'warning',
        title: 'Validation Warnings',
        message: `${routeName ? `Route "${routeName}"` : 'Route'} has ${validationResult.warnings.length} warning(s)`,
        details: validationResult.warnings.map(w => `• ${w.message}`).join('\n'),
        duration: 8000,
        actions: [{
          label: 'Continue Anyway',
          action: () => {},
          variant: 'primary'
        }, {
          label: 'Review Warnings',
          action: () => this.showDetailedValidationErrors(validationResult.warnings),
          variant: 'secondary'
        }]
      });
    } else {
      this.showUserFeedback({
        type: 'success',
        title: 'Validation Passed',
        message: `${routeName ? `Route "${routeName}"` : 'Route'} validation completed successfully`,
        duration: 3000
      });
    }
  }

  /**
   * Show database operation feedback
   */
  showDatabaseFeedback(
    operation: string,
    success: boolean,
    routeName?: string,
    error?: Error
  ): void {
    if (success) {
      this.showUserFeedback({
        type: 'success',
        title: 'Operation Successful',
        message: `${routeName ? `Route "${routeName}"` : 'Route'} ${operation} completed successfully`,
        duration: 3000
      });
    } else {
      this.showUserFeedback({
        type: 'error',
        title: 'Operation Failed',
        message: `Failed to ${operation} ${routeName ? `route "${routeName}"` : 'route'}`,
        details: error?.message || 'Unknown error occurred',
        persistent: true,
        actions: [{
          label: 'Retry',
          action: () => {}, // Will be overridden by caller
          variant: 'primary'
        }, {
          label: 'View Error Details',
          action: () => this.showErrorDetails(error),
          variant: 'secondary'
        }]
      });
    }
  }

  /**
   * Show synchronization feedback
   */
  showSynchronizationFeedback(
    syncType: string,
    success: boolean,
    syncedCount?: number,
    failedCount?: number,
    errors?: Error[]
  ): void {
    if (success) {
      this.showUserFeedback({
        type: 'success',
        title: 'Synchronization Complete',
        message: `${syncType} synchronization completed${syncedCount ? ` (${syncedCount} items)` : ''}`,
        duration: 3000
      });
    } else {
      this.showUserFeedback({
        type: 'error',
        title: 'Synchronization Failed',
        message: `${syncType} synchronization failed${failedCount ? ` (${failedCount} items failed)` : ''}`,
        details: errors?.map(e => `• ${e.message}`).join('\n'),
        persistent: true,
        actions: [{
          label: 'Retry Sync',
          action: () => {}, // Will be overridden by caller
          variant: 'primary'
        }, {
          label: 'View Error Log',
          action: () => this.showRecentErrors(),
          variant: 'secondary'
        }]
      });
    }
  }

  /**
   * Register error callback
   */
  onError(callback: (error: ErrorLogEntry) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register feedback callback
   */
  onFeedback(callback: (feedback: UserFeedback) => void): () => void {
    this.feedbackCallbacks.push(callback);
    return () => {
      const index = this.feedbackCallbacks.indexOf(callback);
      if (index > -1) {
        this.feedbackCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeRange?: { start: Date; end: Date }): ErrorStatistics {
    let filteredErrors = this.errorLog;
    
    if (timeRange) {
      filteredErrors = this.errorLog.filter(error => 
        error.context.timestamp >= timeRange.start && 
        error.context.timestamp <= timeRange.end
      );
    }

    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    const errorCounts = new Map<string, number>();

    filteredErrors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorCounts.set(error.code, (errorCounts.get(error.code) || 0) + 1);
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([code, count]) => ({
        code,
        count,
        lastOccurred: filteredErrors
          .filter(e => e.code === code)
          .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())[0]
          ?.context.timestamp || new Date()
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentErrors = filteredErrors
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, 20);

    const resolvedErrors = filteredErrors.filter(e => e.resolved).length;
    const resolutionRate = filteredErrors.length > 0 ? (resolvedErrors / filteredErrors.length) * 100 : 100;

    // Calculate error rate (errors per hour)
    const timeSpan = timeRange 
      ? timeRange.end.getTime() - timeRange.start.getTime()
      : 24 * 60 * 60 * 1000; // Default to 24 hours
    const hours = timeSpan / (1000 * 60 * 60);
    const errorRate = filteredErrors.length / hours;

    return {
      totalErrors: filteredErrors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors,
      topErrors,
      errorRate,
      resolutionRate
    };
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string, resolvedBy?: string): boolean {
    const error = this.errorLog.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolvedBy = resolvedBy;
      this.persistErrorLog();
      return true;
    }
    return false;
  }

  /**
   * Clear old errors
   */
  clearOldErrors(olderThan: Date): number {
    const initialCount = this.errorLog.length;
    this.errorLog = this.errorLog.filter(error => 
      error.context.timestamp >= olderThan
    );
    this.persistErrorLog();
    return initialCount - this.errorLog.length;
  }

  /**
   * Export error log for analysis
   */
  exportErrorLog(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Severity', 'Category', 'Code', 'Message', 'Operation', 'Resolved'];
      const rows = this.errorLog.map(error => [
        error.id,
        error.context.timestamp.toISOString(),
        error.severity,
        error.category,
        error.code,
        error.message,
        error.context.operation,
        error.resolved.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.errorLog, null, 2);
  }

  // Private helper methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTags(category: ErrorCategory, code: string, severity: ErrorSeverity): string[] {
    const tags = [category, severity];
    
    // Add specific tags based on error code
    if (code.includes('VALIDATION')) tags.push('validation');
    if (code.includes('DATABASE')) tags.push('database');
    if (code.includes('NETWORK')) tags.push('network');
    if (code.includes('SYNC')) tags.push('synchronization');
    
    return tags;
  }

  private getConsoleMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case 'critical':
      case 'error':
        return console.error;
      case 'warning':
        return console.warn;
      case 'info':
        return console.info;
      case 'debug':
        return console.debug;
      default:
        return console.log;
    }
  }

  private getDatabaseErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('connection')) return 'DB_CONNECTION_ERROR';
    if (message.includes('timeout')) return 'DB_TIMEOUT';
    if (message.includes('constraint')) return 'DB_CONSTRAINT_VIOLATION';
    if (message.includes('duplicate')) return 'DB_DUPLICATE_KEY';
    if (message.includes('not found')) return 'DB_RECORD_NOT_FOUND';
    if (message.includes('permission')) return 'DB_PERMISSION_DENIED';
    
    return 'DB_UNKNOWN_ERROR';
  }

  private persistErrorLog(): void {
    try {
      // Keep only last 1000 errors in localStorage
      const recentErrors = this.errorLog.slice(-1000);
      localStorage.setItem('transport_route_errors', JSON.stringify(recentErrors));
    } catch (error) {
      console.warn('Failed to persist error log:', error);
    }
  }

  private showDetailedValidationErrors(errors: ValidationError[]): void {
    const details = errors.map(error => 
      `Field: ${error.field}\nCode: ${error.code}\nMessage: ${error.message}${
        error.details ? `\nDetails: ${JSON.stringify(error.details, null, 2)}` : ''
      }`
    ).join('\n\n');

    this.showUserFeedback({
      type: 'info',
      title: 'Validation Error Details',
      message: `Found ${errors.length} validation issue(s):`,
      details,
      persistent: true
    });
  }

  private showErrorDetails(error?: Error): void {
    if (!error) return;

    this.showUserFeedback({
      type: 'info',
      title: 'Error Details',
      message: error.message,
      details: error.stack,
      persistent: true
    });
  }

  private showRecentErrors(): void {
    const recentErrors = this.errorLog
      .slice(-10)
      .reverse()
      .map(error => `${error.context.timestamp.toLocaleString()}: ${error.message}`)
      .join('\n');

    this.showUserFeedback({
      type: 'info',
      title: 'Recent Errors',
      message: 'Last 10 errors:',
      details: recentErrors,
      persistent: true
    });
  }
}

// Export singleton instance
export const transportRouteErrorService = TransportRouteErrorService.getInstance();