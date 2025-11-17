import { supabase } from '@/lib/supabaseClient';

export interface EmailConfiguration {
  id?: string;
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface EmailConfigurationResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class EmailConfigurationService {
  private static instance: EmailConfigurationService;
  private readonly tableName = 'email_configurations';

  private constructor() {}

  static getInstance(): EmailConfigurationService {
    if (!EmailConfigurationService.instance) {
      EmailConfigurationService.instance = new EmailConfigurationService();
    }
    return EmailConfigurationService.instance;
  }

  /**
   * Get all email configurations
   */
  async getEmailConfigurations(): Promise<EmailConfigurationResponse<EmailConfiguration[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email configurations:', error);
        // Handle schema cache issues
        if (error.code === 'PGRST205') {
          console.warn('Table not found in schema cache, returning empty array');
          return { success: true, data: [] };
        }
        return { success: false, error: error.message };
      }

      console.log('Raw data from database:', data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching email configurations:', error);
      return { success: false, error: 'Failed to fetch email configurations' };
    }
  }

  /**
   * Get active email configuration
   */
  async getActiveEmailConfiguration(): Promise<EmailConfigurationResponse<EmailConfiguration | null>> {
    try {
      // Try to use the function first
      const { data, error } = await supabase
        .rpc('get_active_email_config')
        .single();

      if (error) {
        console.error('Error fetching active email configuration:', error);
        // If function doesn't exist, try to get manually
        if (error.code === 'PGRST205') {
          console.warn('Function not found, trying manual query');
          const { data: manualData, error: manualError } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (manualError) {
            return { success: false, error: manualError.message };
          }
          return { success: true, data: manualData };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error('Unexpected error fetching active email configuration:', error);
      return { success: false, error: 'Failed to fetch active email configuration' };
    }
  }
  async getEmailConfigurationById(id: string): Promise<EmailConfigurationResponse<EmailConfiguration>> {
    try {
      console.log('Fetching email configuration by ID:', id);
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching email configuration:', error);
        // Handle schema cache issues
        if (error.code === 'PGRST205') {
          return { success: false, error: 'Email configurations table not available. Please try again later.' };
        }
        return { success: false, error: error.message };
      }

      console.log('Fetched configuration data:', data);

      if (!data) {
        return { success: false, error: 'Email configuration not found' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching email configuration:', error);
      return { success: false, error: 'Failed to fetch email configuration' };
    }
  }

  /**
   * Create email configuration
   */
  async createEmailConfiguration(
    config: Omit<EmailConfiguration, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<EmailConfigurationResponse<EmailConfiguration>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const configData = {
        ...config,
        created_by: user.id,
        updated_by: user.id,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(configData)
        .select()
        .single();

      if (error) {
        console.error('Error creating email configuration:', error);
        // Handle schema cache issues
        if (error.code === 'PGRST205') {
          return { success: false, error: 'Email configurations table is not available. Please try again in a few moments.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error creating email configuration:', error);
      return { success: false, error: 'Failed to create email configuration' };
    }
  }

  /**
   * Update email configuration
   */
  async updateEmailConfiguration(
    id: string,
    config: Partial<Omit<EmailConfiguration, 'id' | 'created_at' | 'created_by'>>
  ): Promise<EmailConfigurationResponse<EmailConfiguration>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const configData = {
        ...config,
        updated_by: user.id,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .update(configData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating email configuration:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating email configuration:', error);
      return { success: false, error: 'Failed to update email configuration' };
    }
  }

  /**
   * Delete email configuration
   */
  async deleteEmailConfiguration(id: string): Promise<EmailConfigurationResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting email configuration:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Unexpected error deleting email configuration:', error);
      return { success: false, error: 'Failed to delete email configuration' };
    }
  }

  /**
   * Set default email configuration
   */
  async setDefaultEmailConfiguration(id: string): Promise<EmailConfigurationResponse<boolean>> {
    try {
      // First, unset all defaults
      const { error: unsetError } = await supabase
        .from(this.tableName)
        .update({ is_default: false })
        .neq('id', id);

      if (unsetError) {
        console.error('Error unsetting default configurations:', unsetError);
        return { success: false, error: unsetError.message };
      }

      // Then set the new default
      const { error: setError } = await supabase
        .from(this.tableName)
        .update({ is_default: true })
        .eq('id', id);

      if (setError) {
        console.error('Error setting default configuration:', setError);
        return { success: false, error: setError.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Unexpected error setting default configuration:', error);
      return { success: false, error: 'Failed to set default email configuration' };
    }
  }

  /**
   * Toggle email configuration active status
   */
  async toggleEmailConfigurationStatus(id: string): Promise<EmailConfigurationResponse<boolean>> {
    try {
      const { data: currentConfig, error: fetchError } = await this.getEmailConfigurationById(id);
      
      if (fetchError || !currentConfig.data) {
        return { success: false, error: fetchError?.error || 'Configuration not found' };
      }

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: !currentConfig.data.is_active })
        .eq('id', id);

      if (error) {
        console.error('Error toggling configuration status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Unexpected error toggling configuration status:', error);
      return { success: false, error: 'Failed to toggle email configuration status' };
    }
  }

  /**
   * Test email configuration by sending a test email
   */
  async testEmailConfiguration(
    id: string,
    testEmail: string
  ): Promise<EmailConfigurationResponse<{ messageId: string; previewUrl?: string }>> {
    try {
      console.log('Testing email configuration:', id, 'to:', testEmail);
      
      const configResult = await this.getEmailConfigurationById(id);
      
      if (!configResult.success || !configResult.data) {
        console.error('Configuration not found:', configResult.error);
        return { success: false, error: configResult.error || 'Configuration not found' };
      }

      const config = configResult.data;
      console.log('Config object:', config);
      console.log('Config keys:', Object.keys(config));
      console.log('Config name:', config.name);
      console.log('Config host:', config.smtp_host);
      console.log('Found configuration:', config.name);

      // Build the HTML content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Configuration Details:</h3>
            <p><strong>Name:</strong> ${config.name}</p>
            <p><strong>SMTP Host:</strong> ${config.smtp_host}</p>
            <p><strong>SMTP Port:</strong> ${config.smtp_port}</p>
            <p><strong>From Email:</strong> ${config.from_email}</p>
            <p><strong>From Name:</strong> ${config.from_name}</p>
          </div>
          <p style="color: #666; font-size: 12px;">Sent on: ${new Date().toLocaleString()}</p>
        </div>
      `;

      // Send test email using the email server
      const emailServerUrl = 'http://localhost:3003/send-email';
      console.log('Calling email server at:', emailServerUrl);
      
      const response = await fetch(emailServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email Configuration',
          html: htmlContent,
          config: {
            smtp_host: config.smtp_host,
            smtp_port: config.smtp_port,
            smtp_secure: config.smtp_secure,
            smtp_user: config.smtp_user,
            smtp_password: config.smtp_password,
            from_email: config.from_email,
            from_name: config.from_name,
          }
        }),
      });

      console.log('Email server response status:', response.status);
      
      if (!response.ok) {
        console.error('Email server returned error:', response.status, response.statusText);
        
        // Handle specific error cases
        if (response.status === 500) {
          // Try to get more detailed error information
          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('Authentication failed')) {
              return { 
                success: false, 
                error: 'SMTP authentication failed. Please check your username and password.' 
              };
            }
          } catch (e) {
            // If we can't parse the error JSON, use generic message
          }
          
          return { 
            success: false, 
            error: 'Email server error. Please check your SMTP configuration and try again.' 
          };
        }
        
        return { success: false, error: `Email server error: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();
      console.log('Email server result:', result);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to send test email' };
      }

      return { 
        success: true, 
        data: { 
          messageId: result.messageId,
          previewUrl: result.previewUrl 
        } 
      };
    } catch (error) {
      console.error('Unexpected error testing email configuration:', error);
      return { success: false, error: `Failed to test email configuration: ${error.message}` };
    }
  }
}

export const emailConfigurationService = EmailConfigurationService.getInstance();