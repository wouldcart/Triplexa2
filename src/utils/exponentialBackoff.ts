/**
 * Exponential Backoff Utility
 * Provides retry logic with exponential backoff for failed operations
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class ExponentialBackoff {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    jitter: true
  };

  /**
   * Retry an async operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If this was the last attempt, don't wait
        if (attempt === config.maxRetries) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: config.maxRetries + 1,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Calculate delay for the given attempt
   */
  private static calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    // Calculate exponential delay
    let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry with specific configuration for session refresh
   */
  static async retrySessionRefresh<T>(
    operation: () => Promise<T>
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: true
    });
  }

  /**
   * Retry with specific configuration for API calls
   */
  static async retryApiCall<T>(
    operation: () => Promise<T>
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true
    });
  }

  /**
   * Retry with specific configuration for authentication
   */
  static async retryAuth<T>(
    operation: () => Promise<T>
  ): Promise<RetryResult<T>> {
    return this.retry(operation, {
      maxRetries: 1,
      baseDelay: 2000,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: false
    });
  }
}

/**
 * Utility function for simple retry with default options
 */
export const retryWithBackoff = <T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> => {
  return ExponentialBackoff.retry(operation, options);
};