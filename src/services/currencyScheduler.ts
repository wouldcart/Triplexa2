
import { CurrencyService } from './currencyService';
import { getMillisecondsUntilNextIST, getISTTime, formatISTTime } from '../utils/timezoneUtils';

export class CurrencyScheduler {
  private static timeoutId: NodeJS.Timeout | null = null;
  private static isScheduled = false;
  private static refreshCallback: (() => void) | null = null;

  static scheduleDaily9AM(callback?: () => void): void {
    if (callback) {
      this.refreshCallback = callback;
    }

    // Clear existing schedule
    this.clearSchedule();

    const millisecondsUntil9AM = getMillisecondsUntilNextIST(9, 0); // 9:00 AM IST
    
    console.log(`Scheduling next currency refresh in ${Math.round(millisecondsUntil9AM / 1000 / 60)} minutes (9:00 AM IST)`);
    
    this.timeoutId = setTimeout(() => {
      this.performScheduledRefresh();
    }, millisecondsUntil9AM);
    
    this.isScheduled = true;
  }

  private static async performScheduledRefresh(): Promise<void> {
    try {
      const currentTime = getISTTime();
      console.log(`Performing scheduled currency refresh at ${formatISTTime(currentTime)} IST`);
      
      // Trigger the refresh callback if provided
      if (this.refreshCallback) {
        this.refreshCallback();
      }
      
      // Schedule next refresh for tomorrow
      this.scheduleDaily9AM();
      
    } catch (error) {
      console.error('Scheduled currency refresh failed:', error);
      // Still schedule next refresh even if this one failed
      this.scheduleDaily9AM();
    }
  }

  static clearSchedule(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isScheduled = false;
  }

  static getNextRefreshTime(): string {
    if (!this.isScheduled) return 'Not scheduled';
    
    const nextRefresh = new Date();
    nextRefresh.setTime(nextRefresh.getTime() + getMillisecondsUntilNextIST(9, 0));
    
    return formatISTTime(nextRefresh);
  }

  static isActive(): boolean {
    return this.isScheduled;
  }
}
