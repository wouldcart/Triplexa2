
export interface CurrencyApiResponse {
  meta: {
    last_updated_at: string;
  };
  data: {
    [key: string]: {
      code: string;
      value: number;
    };
  };
}

export interface ApiUsage {
  used: number;
  limit: number;
  resetDate: string;
  lastFetch: string;
}

export class CurrencyApiService {
  private static readonly API_BASE_URL = 'https://api.currencyapi.com/v3/latest';
  private static readonly CACHE_KEY = 'currencyapi_cache';
  private static readonly USAGE_KEY = 'currencyapi_usage';
  private static readonly API_KEY_KEY = 'currencyapi_key';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_KEY);
  }

  static getUsage(): ApiUsage {
    const saved = localStorage.getItem(this.USAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Initialize usage tracking
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      used: 0,
      limit: 300,
      resetDate: nextMonth.toISOString(),
      lastFetch: ''
    };
  }

  static updateUsage(increment: number = 1): void {
    const usage = this.getUsage();
    
    // Check if we need to reset monthly usage
    const now = new Date();
    const resetDate = new Date(usage.resetDate);
    
    if (now >= resetDate) {
      // Reset for new month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      usage.used = 0;
      usage.resetDate = nextMonth.toISOString();
    }
    
    usage.used += increment;
    usage.lastFetch = now.toISOString();
    
    localStorage.setItem(this.USAGE_KEY, JSON.stringify(usage));
  }

  static getCachedRates(): { rates: Record<string, number>; timestamp: number } | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;
    
    try {
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid (24 hours)
      if (now - data.timestamp < this.CACHE_DURATION) {
        return data;
      }
    } catch (error) {
      console.error('Error parsing cached rates:', error);
    }
    
    return null;
  }

  static setCachedRates(rates: Record<string, number>): void {
    const cacheData = {
      rates,
      timestamp: Date.now()
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
  }

  static async fetchRealTimeRates(): Promise<{ rates: Record<string, number>; isRealTime: boolean }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const usage = this.getUsage();
    
    // Check if we're approaching the limit
    if (usage.used >= usage.limit - 5) { // Keep 5 requests buffer
      console.warn('API limit nearly reached, using cached rates');
      const cached = this.getCachedRates();
      if (cached) {
        return { rates: cached.rates, isRealTime: false };
      }
      throw new Error('API limit exceeded and no cached rates available');
    }

    // Check cache first
    const cached = this.getCachedRates();
    if (cached) {
      console.log('Using cached rates to preserve API requests');
      return { rates: cached.rates, isRealTime: false };
    }

    try {
      // Fetch all needed currencies in one request to minimize API usage
      const currencies = 'THB,INR,AED,EUR,GBP,JPY,AUD,CAD,CHF,CNY,SGD,MYR';
      const url = `${this.API_BASE_URL}?apikey=${apiKey}&currencies=${currencies}&base_currency=USD`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API rate limit exceeded');
        } else if (response.status === 401) {
          throw new Error('Invalid API key');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data: CurrencyApiResponse = await response.json();
      
      // Update usage counter
      this.updateUsage(1);
      
      // Convert API response to our format
      const rates: Record<string, number> = {};
      Object.entries(data.data).forEach(([code, currencyData]) => {
        rates[`USD_${code}`] = currencyData.value;
        rates[`${code}_USD`] = 1 / currencyData.value;
      });

      // Add cross rates (THB to INR, etc.)
      if (rates['USD_THB'] && rates['USD_INR']) {
        rates['THB_INR'] = rates['USD_INR'] / rates['USD_THB'];
        rates['INR_THB'] = rates['USD_THB'] / rates['USD_INR'];
      }

      // Cache the rates
      this.setCachedRates(rates);
      
      console.log(`Fetched real-time rates. Usage: ${this.getUsage().used}/${this.getUsage().limit}`);
      
      return { rates, isRealTime: true };
    } catch (error) {
      console.error('Failed to fetch real-time rates:', error);
      
      // Try to use cached rates as fallback
      const cached = this.getCachedRates();
      if (cached) {
        console.log('Using cached rates as fallback');
        return { rates: cached.rates, isRealTime: false };
      }
      
      throw error;
    }
  }

  static async fetchSpecificRate(fromCurrency: string, toCurrency: string): Promise<{ rate: number; isRealTime: boolean }> {
    try {
      const { rates, isRealTime } = await this.fetchRealTimeRates();
      const rateKey = `${fromCurrency}_${toCurrency}`;
      
      if (rates[rateKey]) {
        return { rate: rates[rateKey], isRealTime };
      }
      
      // Try reverse rate
      const reverseKey = `${toCurrency}_${fromCurrency}`;
      if (rates[reverseKey]) {
        return { rate: 1 / rates[reverseKey], isRealTime };
      }
      
      throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('Error fetching specific rate:', error);
      throw error;
    }
  }

  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  static getRemainingRequests(): number {
    const usage = this.getUsage();
    return Math.max(0, usage.limit - usage.used);
  }
}
