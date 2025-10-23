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
    const [host, port, secure, user, password, fromEmail, fromName] = await Promise.all([
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_host'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_port'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_secure'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_user'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'smtp_password'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'from_email'),
      AppSettingsService.getSettingValue(SETTING_CATEGORIES.NOTIFICATIONS, 'from_name'),
    ]);

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
    console.warn('Failed to load SMTP config from settings, using empty config');
    return {};
  }
}

export async function sendEmail(to: string, subject: string, html: string, configOverride?: SMTPConfig) {
  const baseConfig = await loadSMTPConfig();
  const config: SMTPConfig = { ...baseConfig, ...(configOverride || {}) };
  // Resolve email server URL/port with env override and sensible defaults
  const port = (import.meta as any).env?.VITE_EMAIL_SERVER_PORT || 3001;
  const baseUrl = (import.meta as any).env?.VITE_EMAIL_SERVER_URL || `http://localhost:${port}`;

  const res = await fetch(`${baseUrl}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, config })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send email');
  }

  return res.json();
}