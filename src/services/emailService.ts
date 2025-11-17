import { AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';

export interface SMTPConfig {
  smtp_host?: string;
  smtp_port?: number | string;
  smtp_secure?: boolean | string;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
}

export async function loadSMTPConfig(): Promise<SMTPConfig> {
  try {
    console.log('📧 Loading SMTP configuration from app settings...');
    
    const [host, port, secure, user, password, fromEmail, fromName] = await Promise.all([
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_host'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_port'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_secure'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_user'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_password'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'from_email'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'from_name'),
    ]);

    console.log('📧 SMTP config loaded:', {
      host: host ? '✅' : '❌',
      port: port ? '✅' : '❌',
      secure: secure ? '✅' : '❌',
      user: user ? '✅' : '❌',
      password: password ? '✅' : '❌',
      fromEmail: fromEmail ? '✅' : '❌',
      fromName: fromName ? '✅' : '❌'
    });

    return {
      smtp_host: host as string | undefined,
      smtp_port: (port as any) ?? undefined,
      smtp_secure: (secure as any) ?? undefined,
      smtp_user: user as string | undefined,
      smtp_password: password as string | undefined,
      from_email: (fromEmail as string) || undefined,
      from_name: (fromName as string) || undefined,
    };
  } catch (e) {
    console.warn('📧 Failed to load SMTP config from settings, using empty config:', e.message);
    return {};
  }
}

export async function sendEmail(to: string, subject: string, html: string, configOverride?: SMTPConfig) {
  try {
    console.log('📧 Email service: Starting email send...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Has HTML:', !!html);
    
    const baseConfig = await loadSMTPConfig();
    const config: SMTPConfig = { ...baseConfig, ...(configOverride || {}) };
    console.log('📧 Config loaded:', Object.keys(config));
    
    // Resolve email server URL/port with env override and sensible defaults
    const port = (import.meta as any).env?.VITE_EMAIL_SERVER_PORT || 3003;
    const baseUrl = (import.meta as any).env?.VITE_EMAIL_SERVER_URL || `http://localhost:${port}`;
    console.log('📧 Email server URL:', `${baseUrl}/send-email`);

    console.log('📧 Sending request to email server...');
    const res = await fetch(`${baseUrl}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, config })
    });

    console.log('📧 Email server response status:', res.status);

    if (!res.ok) {
      console.error('📧 Email server error response:', res.status, res.statusText);
      const err = await res.json().catch(() => ({}));
      console.error('📧 Error details:', err);
      throw new Error(err.error || `Failed to send email: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    console.log('📧 Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('📧 Email service error:', error.message);
    console.error('📧 Full error:', error);
    throw error;
  }
}