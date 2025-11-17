import { supabase } from '@/lib/supabaseClient';

export interface EmailSendingLog {
  id?: string;
  email_configuration_id: string;
  recipient_email: string;
  subject: string;
  sent_at?: string;
  status: 'sent' | 'failed' | 'bounced';
  error_message?: string;
  country_id?: string;
  cc_recipients?: string[];
  bcc_recipients?: string[];
}

export interface EmailAccountUsage {
  configuration_id: string;
  daily_send_limit: number;
  current_day_sent: number;
  last_sent_date: string;
  remaining_quota: number;
  usage_percentage: number;
}

export interface AvailableAccount {
  id: string;
  name: string;
  provider: string;
  daily_send_limit: number;
  current_day_sent: number;
  remaining_quota: number;
  usage_percentage: number;
}

export interface EmailLimitResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class EmailLimitsService {
  private static instance: EmailLimitsService;
  private tableName = 'email_sending_logs';
  private configTable = 'email_configurations';

  static getInstance(): EmailLimitsService {
    if (!EmailLimitsService.instance) {
      EmailLimitsService.instance = new EmailLimitsService();
    }
    return EmailLimitsService.instance;
  }

  /**
   * Log an email sending attempt
   */
  async logEmailSending(log: EmailSendingLog): Promise<EmailLimitResponse<EmailSendingLog>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          email_configuration_id: log.email_configuration_id,
          recipient_email: log.recipient_email,
          subject: log.subject,
          status: log.status,
          error_message: log.error_message,
          country_id: log.country_id,
          cc_recipients: log.cc_recipients || [],
          bcc_recipients: log.bcc_recipients || []
        }])
        .select()
        .single();

      if (error) {
        console.error('Error logging email sending:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception logging email sending:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get email account usage statistics
   */
  async getEmailAccountUsage(configId: string): Promise<EmailLimitResponse<EmailAccountUsage>> {
    try {
      const { data, error } = await supabase
        .from(this.configTable)
        .select('id, daily_send_limit, current_day_sent, last_sent_date')
        .eq('id', configId)
        .single();

      if (error) {
        console.error('Error getting email account usage:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Email configuration not found' };
      }

      const remainingQuota = Math.max(0, data.daily_send_limit - data.current_day_sent);
      const usagePercentage = data.daily_send_limit > 0 ? (data.current_day_sent / data.daily_send_limit) * 100 : 0;

      const usage: EmailAccountUsage = {
        configuration_id: data.id,
        daily_send_limit: data.daily_send_limit,
        current_day_sent: data.current_day_sent,
        last_sent_date: data.last_sent_date,
        remaining_quota: remainingQuota,
        usage_percentage: usagePercentage
      };

      return { success: true, data: usage };
    } catch (error) {
      console.error('Exception getting email account usage:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if an email account has available quota
   */
  async hasAvailableQuota(configId: string): Promise<EmailLimitResponse<boolean>> {
    const result = await this.getEmailAccountUsage(configId);
    
    if (!result.success) {
      return result;
    }

    return { 
      success: true, 
      data: result.data!.remaining_quota > 0 
    };
  }

  /**
   * Get all available email accounts with quota information
   */
  async getAvailableAccounts(): Promise<EmailLimitResponse<AvailableAccount[]>> {
    try {
      const { data, error } = await supabase
        .from(this.configTable)
        .select('id, name, provider, daily_send_limit, current_day_sent, last_sent_date, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error getting available accounts:', error);
        return { success: false, error: error.message };
      }

      const availableAccounts: AvailableAccount[] = (data || [])
        .filter(config => {
          // Check if it's a new day and reset counter if needed
          const today = new Date().toISOString().split('T')[0];
          const lastDate = new Date(config.last_sent_date).toISOString().split('T')[0];
          const isNewDay = today !== lastDate;
          
          const remainingQuota = isNewDay 
            ? config.daily_send_limit 
            : Math.max(0, config.daily_send_limit - config.current_day_sent);
          
          const usagePercentage = config.daily_send_limit > 0 
            ? (isNewDay ? 0 : (config.current_day_sent / config.daily_send_limit) * 100) 
            : 0;

          return remainingQuota > 0; // Only include accounts with available quota
        })
        .map(config => {
          const today = new Date().toISOString().split('T')[0];
          const lastDate = new Date(config.last_sent_date).toISOString().split('T')[0];
          const isNewDay = today !== lastDate;
          
          const remainingQuota = isNewDay 
            ? config.daily_send_limit 
            : Math.max(0, config.daily_send_limit - config.current_day_sent);
          
          const usagePercentage = config.daily_send_limit > 0 
            ? (isNewDay ? 0 : (config.current_day_sent / config.daily_send_limit) * 100) 
            : 0;

          return {
            id: config.id,
            name: config.name,
            provider: config.provider,
            daily_send_limit: config.daily_send_limit,
            current_day_sent: isNewDay ? 0 : config.current_day_sent,
            remaining_quota: remainingQuota,
            usage_percentage: usagePercentage
          };
        })
        .sort((a, b) => a.usage_percentage - b.usage_percentage); // Sort by usage (least used first)

      return { success: true, data: availableAccounts };
    } catch (error) {
      console.error('Exception getting available accounts:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get the best available email account for sending
   */
  async getBestAvailableAccount(): Promise<EmailLimitResponse<AvailableAccount | null>> {
    const result = await this.getAvailableAccounts();
    
    if (!result.success) {
      return result;
    }

    const availableAccounts = result.data!;
    
    if (availableAccounts.length === 0) {
      return { success: true, data: null };
    }

    // Return the account with the lowest usage percentage
    return { success: true, data: availableAccounts[0] };
  }

  /**
   * Reset daily counters for accounts that need it
   */
  async resetDailyCounters(): Promise<EmailLimitResponse<void>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from(this.configTable)
        .update({ 
          current_day_sent: 0, 
          last_sent_date: today 
        })
        .lt('last_sent_date', today);

      if (error) {
        console.error('Error resetting daily counters:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception resetting daily counters:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get email sending statistics for a date range
   */
  async getSendingStatistics(
    startDate: string, 
    endDate: string, 
    configId?: string
  ): Promise<EmailLimitResponse<any[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          id,
          recipient_email,
          subject,
          sent_at,
          status,
          error_message,
          email_configurations!inner(name, provider)
        `)
        .gte('sent_at', startDate)
        .lte('sent_at', endDate);

      if (configId) {
        query = query.eq('email_configuration_id', configId);
      }

      const { data, error } = await query.order('sent_at', { ascending: false });

      if (error) {
        console.error('Error getting sending statistics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Exception getting sending statistics:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export const emailLimitsService = EmailLimitsService.getInstance();