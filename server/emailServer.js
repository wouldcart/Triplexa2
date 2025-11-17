import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { getActiveEmailConfiguration } from './emailConfigService.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced logging and error tracking
const emailLogs = [];
const MAX_LOGS = 100;

function logEmailEvent(type, data) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, data };
  emailLogs.unshift(logEntry);
  if (emailLogs.length > MAX_LOGS) {
    emailLogs.pop();
  }
  console.log(`[${timestamp}] ${type}:`, JSON.stringify(data, null, 2));
}

const sseClients = [];
function notify(event, payload) {
  sseClients.forEach(res => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });
}

// Function to reset daily counters for email configurations
async function resetDailyCounters() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset counters for accounts where last_sent_date is before today
    const { data, error } = await supabase
      .from('email_configurations')
      .update({ 
        current_day_sent: 0, 
        last_sent_date: today 
      })
      .lt('last_sent_date', today)
      .select('id, name');

    if (error) {
      console.error('Error resetting daily counters:', error);
      logEmailEvent('DAILY_COUNTER_RESET_ERROR', { error: error.message });
    } else if (data && data.length > 0) {
      console.log(`Reset daily counters for ${data.length} email configurations`);
      logEmailEvent('DAILY_COUNTERS_RESET', { 
        count: data.length,
        configurations: data.map(c => ({ id: c.id, name: c.name }))
      });
    } else {
      console.log('No email configurations needed daily counter reset');
      logEmailEvent('DAILY_COUNTERS_CHECKED', { message: 'No resets needed' });
    }
  } catch (error) {
    console.error('Exception resetting daily counters:', error);
    logEmailEvent('DAILY_COUNTER_RESET_EXCEPTION', { error: error.message });
  }
}

// Create a transporter using database config, env, or ephemeral Ethereal for testing
async function createTransporter(overrides = {}) {
  const overrideHost = overrides.smtp_host || overrides.host;
  const overridePort = overrides.smtp_port || overrides.port;
  const overrideUser = overrides.smtp_user || (overrides.auth && overrides.auth.user);
  const overridePass = overrides.smtp_password || (overrides.auth && overrides.auth.pass);
  const overrideSecure =
    overrides.smtp_secure !== undefined
      ? overrides.smtp_secure === true || overrides.smtp_secure === 'true'
      : overrides.secure !== undefined
      ? overrides.secure === true || overrides.secure === 'true'
      : Number(overridePort) === 465;

  if (overrideHost && overridePort && overrideUser && overridePass) {
    logEmailEvent('TRANSPORT_CREATED', {
      source: 'override_config',
      host: overrideHost,
      port: overridePort,
      secure: overrideSecure
    });
    return nodemailer.createTransport({
      host: String(overrideHost),
      port: Number(overridePort),
      secure: overrideSecure,
      auth: {
        user: String(overrideUser),
        pass: String(overridePass)
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  // Try to get configuration from database first
  try {
    const dbConfig = await getActiveEmailConfiguration();
    if (dbConfig) {
      logEmailEvent('TRANSPORT_CREATED', { 
        source: 'database_config', 
        config_name: dbConfig.name,
        host: dbConfig.smtp_host,
        port: dbConfig.smtp_port
      });
      return nodemailer.createTransport({
        host: dbConfig.smtp_host,
        port: dbConfig.smtp_port,
        secure: dbConfig.smtp_secure || dbConfig.smtp_port === 465,
        auth: {
          user: dbConfig.smtp_user,
          pass: dbConfig.smtp_password
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
    }
  } catch (error) {
    logEmailEvent('DATABASE_CONFIG_ERROR', { error: error.message });
    console.error('Error fetching email configuration from database:', error);
  }

  // Fallback to environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    logEmailEvent('TRANSPORT_CREATED', { 
      source: 'environment_config', 
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT
    });
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  // Final fallback: ephemeral Ethereal test account
  logEmailEvent('TRANSPORT_CREATED', { source: 'ethereal_test_account' });
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

app.post('/send-email', async (req, res) => {
  try {
    let { to, subject, html, config, templateId, variables, country_id, configId } = req.body || {};
    
    console.log('Email request received:', { to, subject, hasHtml: !!html, country_id, configId });
    
    // Enhanced validation
    if (!to || !subject || !html) {
      const error = 'Missing required fields: to, subject, html';
      logEmailEvent('VALIDATION_ERROR', { error, body: req.body });
      return res.status(400).json({ success: false, error });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      const error = 'Invalid email format';
      logEmailEvent('VALIDATION_ERROR', { error, to });
      return res.status(400).json({ success: false, error });
    }

    logEmailEvent('EMAIL_SEND_REQUEST', { 
      to, 
      subject, 
      templateId, 
      hasVariables: !!variables,
      configSource: config ? 'override' : 'default'
    });

    // Email limits checking and automatic account switching
    let effectiveConfig = config || {};
    let selectedConfigId = configId;
    
    // Skip account switching if a specific config is provided (for testing purposes)
    const isTestingSpecificConfig = Object.keys(config).length > 0;
    
    if (!isTestingSpecificConfig) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL || '',
          process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
        );

        // Check if the requested account has available quota
        if (selectedConfigId) {
          const { data: usageData, error: usageError } = await supabase
            .from('email_configurations')
            .select('daily_send_limit, current_day_sent, last_sent_date')
            .eq('id', selectedConfigId)
            .eq('is_active', true)
            .single();

          if (!usageError && usageData) {
            // Check if it's a new day and reset counter if needed
            const today = new Date().toISOString().split('T')[0];
            const lastDate = new Date(usageData.last_sent_date).toISOString().split('T')[0];
            const isNewDay = today !== lastDate;
            
            const currentSent = isNewDay ? 0 : usageData.current_day_sent;
            const remainingQuota = Math.max(0, usageData.daily_send_limit - currentSent);
            
            if (remainingQuota <= 0) {
              logEmailEvent('EMAIL_LIMIT_EXCEEDED', { 
                configId: selectedConfigId,
                dailyLimit: usageData.daily_send_limit,
                currentSent
              });
              console.log(`Email limit exceeded for config ${selectedConfigId}. Daily limit: ${usageData.daily_send_limit}, Current sent: ${currentSent}`);
              selectedConfigId = null; // Force account switching
            }
          }
        }

        // If no specific config or limit exceeded, find the best available account
        if (!selectedConfigId) {
          const { data: availableAccounts, error: accountsError } = await supabase
            .from('email_configurations')
            .select('id, name, smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, daily_send_limit, current_day_sent, last_sent_date')
            .eq('is_active', true)
            .order('current_day_sent', { ascending: true })
            .limit(10);

          if (!accountsError && availableAccounts && availableAccounts.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            
            // Find the first account with available quota
            for (const account of availableAccounts) {
              const lastDate = new Date(account.last_sent_date).toISOString().split('T')[0];
              const isNewDay = today !== lastDate;
              const currentSent = isNewDay ? 0 : account.current_day_sent;
              const remainingQuota = Math.max(0, account.daily_send_limit - currentSent);
              
              if (remainingQuota > 0) {
                selectedConfigId = account.id;
                effectiveConfig = {
                  smtp_host: account.smtp_host,
                  smtp_port: account.smtp_port,
                  smtp_secure: account.smtp_port === 465,
                  smtp_user: account.smtp_user,
                  smtp_password: account.smtp_password,
                  from_email: account.from_email,
                  from_name: account.from_name
                };
                
                logEmailEvent('EMAIL_ACCOUNT_SWITCHED', { 
                  fromConfigId: 'auto-selected',
                  toConfigId: selectedConfigId,
                  remainingQuota,
                  accountName: account.name
                });
                console.log(`Switched to account: ${account.name} (ID: ${selectedConfigId}), Remaining quota: ${remainingQuota}`);
                break;
              }
            }
            
            if (!selectedConfigId) {
              return res.status(429).json({ 
                success: false, 
                error: 'All email accounts have exceeded their daily sending limits. Please try again tomorrow or contact support.'
              });
            }
          }
        }
      } catch (limitsError) {
        logEmailEvent('EMAIL_LIMITS_ERROR', { 
          error: limitsError.message,
          configId: selectedConfigId
        });
        console.error('Error checking email limits:', limitsError);
        // Continue with original config if limits checking fails
      }
    } else {
      logEmailEvent('SPECIFIC_CONFIG_TEST', { 
        config: effectiveConfig,
        message: 'Testing specific configuration - skipping account switching'
      });
      console.log('Testing specific configuration - skipping account switching');
    }

    const transporter = await createTransporter(effectiveConfig);

    // Get country-based CC/BCC emails if country_id is provided
    let ccEmails = [];
    let bccEmails = [];
    
    if (country_id) {
      try {
        console.log(`Looking up country email settings for country_id: ${country_id}`);
        
        // Create Supabase client to fetch country email settings
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL || '',
          process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
          {
            auth: { persistSession: false, autoRefreshToken: false },
          }
        );
        
        const { data: countrySetting, error } = await supabase
          .from('country_email_settings')
          .select('cc_emails, bcc_emails')
          .eq('country_id', country_id)
          .eq('is_active', true);
        
        console.log('Country setting lookup result:', { countrySetting, error });
        
        if (!error && countrySetting && countrySetting.length > 0) {
          const setting = countrySetting[0]; // Take the first (and should be only) setting
          ccEmails = setting.cc_emails || [];
          bccEmails = setting.bcc_emails || [];
          
          console.log(`Found country email settings: CC=${ccEmails.length}, BCC=${bccEmails.length}`);
          
          logEmailEvent('COUNTRY_EMAIL_SETTINGS_APPLIED', { 
            country_id,
            ccCount: ccEmails.length,
            bccCount: bccEmails.length,
            ccEmails,
            bccEmails
          });
        } else {
          console.log(`No country email settings found for country_id: ${country_id}`);
          if (error) {
            console.log(`Error details: ${error.message}`);
          }
        }
      } catch (countryError) {
        logEmailEvent('COUNTRY_EMAIL_SETTINGS_ERROR', { 
          error: countryError.message,
          country_id
        });
        console.error('Error fetching country email settings:', countryError);
      }
    }

    // Determine from email and name with enhanced priority logic
    let fromEmail = process.env.FROM_EMAIL || 'no-reply@example.com';
    let fromName = process.env.FROM_NAME || 'Triplexa System';

    // Priority 1: Config overrides from request
    if (config && config.from_email) {
      fromEmail = config.from_email;
    }
    if (config && config.from_name) {
      fromName = config.from_name;
    }

    // Priority 2: Database configuration (if no explicit config overrides)
    if (!config || (!config.from_email && !config.from_name)) {
      try {
        const dbConfig = await getActiveEmailConfiguration();
        if (dbConfig) {
          fromEmail = dbConfig.from_email;
          fromName = dbConfig.from_name;
          logEmailEvent('DATABASE_CONFIG_USED', { 
            configName: dbConfig.name,
            fromEmail,
            fromName
          });
          if (!selectedConfigId && dbConfig.id) {
            selectedConfigId = dbConfig.id;
          }
        }
      } catch (error) {
        logEmailEvent('DATABASE_CONFIG_ERROR', { error: error.message });
        console.error('Error getting email config from database:', error);
      }
    }

    // Enhanced email content processing
    let processedHtml = html;
    let processedSubject = subject;
    
    // Apply template variables if provided
    if (variables && typeof variables === 'object') {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        processedHtml = processedHtml.replace(regex, String(value));
        processedSubject = processedSubject.replace(regex, String(value));
      });
      logEmailEvent('VARIABLES_APPLIED', { variableCount: Object.keys(variables).length });
    }

    // Add email footer with company info if not present
    if (!processedHtml.includes('<!-- email-footer -->')) {
      processedHtml += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>This email was sent by ${fromName}</p>
          <p>© ${new Date().getFullYear()} Triplexa DMS. All rights reserved.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: processedSubject,
      html: processedHtml,
      // Add text fallback
      text: processedHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      // Add country-based CC/BCC emails if available
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      bcc: bccEmails.length > 0 ? bccEmails : undefined
    };

    logEmailEvent('EMAIL_SENDING', { 
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: processedSubject,
      hasHtml: !!processedHtml,
      hasText: !!mailOptions.text
    });

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Log the successful email sending to database
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || '',
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
      );

      // Log the email sending event
      await supabase.from('email_sending_logs').insert([{
        email_configuration_id: selectedConfigId || 'default',
        recipient_email: to,
        subject: processedSubject,
        status: 'sent',
        country_id: country_id,
        cc_recipients: ccEmails,
        bcc_recipients: bccEmails
      }]);

      logEmailEvent('EMAIL_LOGGED_SUCCESS', { 
        configId: selectedConfigId,
        recipient: to,
        country_id
      });
    } catch (loggingError) {
      logEmailEvent('EMAIL_LOGGING_ERROR', { 
        error: loggingError.message,
        configId: selectedConfigId
      });
      console.error('Error logging email sending:', loggingError);
      // Continue even if logging fails - don't block email sending
    }
    
    logEmailEvent('EMAIL_SENT_SUCCESS', { 
      messageId: info.messageId,
      previewUrl,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      ccRecipients: ccEmails,
      bccRecipients: bccEmails,
      configId: selectedConfigId
    });

    // Update daily counter after successful email sending
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, check if we need to reset the counter for a new day
      const { data: configData, error: configError } = await supabase
        .from('email_configurations')
        .select('last_sent_date, current_day_sent')
        .eq('id', selectedConfigId)
        .single();

      if (!configError && configData) {
        const lastDate = new Date(configData.last_sent_date).toISOString().split('T')[0];
        const isNewDay = today !== lastDate;
        
        // Update the counter - reset to 1 if new day, otherwise increment
        const newCount = isNewDay ? 1 : (configData.current_day_sent || 0) + 1;
        
        const { error: updateError } = await supabase
          .from('email_configurations')
          .update({ 
            current_day_sent: newCount,
            last_sent_date: today 
          })
          .eq('id', selectedConfigId);

        if (updateError) {
          console.error('Error updating daily counter:', updateError);
          logEmailEvent('DAILY_COUNTER_UPDATE_ERROR', {
            configId: selectedConfigId,
            error: updateError.message,
            newCount: newCount
          });
        } else {
          console.log(`Daily counter updated for config ${selectedConfigId}: ${newCount} emails sent today`);
          logEmailEvent('DAILY_COUNTER_UPDATED', {
            configId: selectedConfigId,
            newCount: newCount,
            isNewDay: isNewDay
          });
        }
      }
    } catch (counterError) {
      console.error('Exception updating daily counter:', counterError);
      logEmailEvent('DAILY_COUNTER_UPDATE_EXCEPTION', {
        configId: selectedConfigId,
        error: counterError.message
      });
    }

    res.json({ 
      success: true, 
      messageId: info.messageId, 
      previewUrl,
      timestamp: new Date().toISOString(),
      ccRecipients: ccEmails,
      bccRecipients: bccEmails,
      configId: selectedConfigId,
      accountSwitched: configId !== selectedConfigId
    });

  } catch (error) {
    logEmailEvent('EMAIL_SEND_ERROR', { 
      error: error.message,
      stack: error.stack,
      to: req.body?.to,
      subject: req.body?.subject
    });
    console.error('Email send error:', error);
    
    // Enhanced error messages based on error type
    let errorMessage = error.message || 'Send failed';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your email configuration.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your SMTP settings.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Connection timeout. Please check your network and SMTP settings.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: error.code
    });
  }
});

// Add endpoint to view email logs
app.get('/email-logs', (req, res) => {
  res.json({
    success: true,
    logs: emailLogs.slice(0, 50), // Return last 50 logs
    total: emailLogs.length
  });
});

// Add endpoint to get email server status
app.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString(),
    port: PORT,
    totalLogs: emailLogs.length,
    uptime: process.uptime()
  });
});

const PORT = process.env.EMAIL_SERVER_PORT ? Number(process.env.EMAIL_SERVER_PORT) : 3001;
app.listen(PORT, async () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`);
  
  // Reset daily counters when server starts
  await resetDailyCounters();
  
  // Set up daily counter reset at midnight (optional - can also be done on each email send)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(async () => {
    await resetDailyCounters();
    // Set up daily reset
    setInterval(resetDailyCounters, 24 * 60 * 60 * 1000); // Reset every 24 hours
  }, msUntilMidnight);
  
  console.log(`📊 Daily counter reset scheduled for midnight (${msUntilMidnight}ms from now)`);
});

app.get('/email/outbox', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { from, to, status, campaign_id, limit = 100 } = req.query;
    let query = supabaseClient
      .from('email_sending_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(Number(limit));
    if (from) query = query.gte('sent_at', from);
    if (to) query = query.lte('sent_at', to);
    if (status) query = query.eq('status', status);
    if (campaign_id) query = query.eq('campaign_id', campaign_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/email/inbox', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { limit = 100, unread, has_attachments, sender, start, end, page = 1 } = req.query;
    const limitNum = Number(limit);
    const pageNum = Math.max(1, Number(page));
    const rangeStart = (pageNum - 1) * limitNum;
    const rangeEnd = rangeStart + limitNum - 1;
    let query = supabaseClient
      .from('email_threads')
      .select('id, subject, last_activity_at, participants, labels')
      .order('last_activity_at', { ascending: false })
      .range(rangeStart, rangeEnd);
    if (sender) query = query.contains('participants', [sender]);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    const threads = data || [];
    const messagesQuery = supabaseClient
      .from('email_thread_messages')
      .select('*')
      .in('thread_id', threads.map(t => t.id));
    const { data: messages } = await messagesQuery;
    let filtered = threads.map(t => ({
      ...t,
      messages: (messages || []).filter(m => m.thread_id === t.id)
    }));
    if (unread === 'true') {
      filtered = filtered.filter(t => t.messages.some(m => m.read === false));
    }
    if (has_attachments === 'true') {
      filtered = filtered.filter(t => t.messages.some(m => m.attachments));
    }
    if (start || end) {
      filtered = filtered.filter(t => {
        const ts = new Date(t.last_activity_at).getTime();
        const s = start ? new Date(start).getTime() : -Infinity;
        const e = end ? new Date(end).getTime() : Infinity;
        return ts >= s && ts <= e;
      });
    }
    res.json({ success: true, data: filtered, page: pageNum, limit: limitNum });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/email/campaigns', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { status, limit = 100 } = req.query;
    let query = supabaseClient
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/email/campaigns/:id/recipients', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { id } = req.params;
    const { data, error } = await supabaseClient
      .from('email_campaign_recipients')
      .select('*')
      .eq('campaign_id', id)
      .order('status');
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/email/inbox/mark-read', async (req, res) => {
  try {
    const { messageId, read } = req.body || {};
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { error } = await supabaseClient
      .from('email_thread_messages')
      .update({ read: !!read })
      .eq('id', messageId);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/email/queue/status', async (req, res) => {
  try {
    res.json({ success: true, data: { queueSize: queue.size, failed: queue.failed, slow: queue.slow, rateLimit: 100 } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/email/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  sseClients.push(res);
  req.on('close', () => {
    const i = sseClients.indexOf(res);
    if (i >= 0) sseClients.splice(i, 1);
  });
});

app.get('/email/search', async (req, res) => {
  try {
    const { q, scope = 'threads', limit = 50 } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'q required' });
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const tsquery = q;
    let data, error;
    if (scope === 'threads') {
      ({ data, error } = await supabaseClient
        .from('email_thread_messages')
        .select('*')
        .textSearch('tsv', tsquery, { type: 'plain' })
        .limit(Number(limit)));
    } else if (scope === 'inbox') {
      ({ data, error } = await supabaseClient
        .from('email_inbox_logs')
        .select('*')
        .textSearch('tsv', tsquery, { type: 'plain' })
        .limit(Number(limit)));
    } else if (scope === 'outbox') {
      ({ data, error } = await supabaseClient
        .from('email_sending_logs')
        .select('*')
        .textSearch('tsv', tsquery, { type: 'plain' })
        .limit(Number(limit)));
    } else if (scope === 'campaigns') {
      ({ data, error } = await supabaseClient
        .from('email_campaigns')
        .select('*')
        .textSearch('tsv', tsquery, { type: 'plain' })
        .limit(Number(limit)));
    } else {
      return res.status(400).json({ success: false, error: 'invalid scope' });
    }
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function sanitizeHtml(html) {
  if (!html) return '';
  let s = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/javascript:/gi, '');
  return s;
}

app.post('/email/inbox/ingest', async (req, res) => {
  try {
    const { sender, recipient, subject, body_html, attachments } = req.body || {};
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const subj = subject || '';
    const part = [sender, recipient].filter(Boolean);
    const { data: existing } = await supabaseClient
      .from('email_threads')
      .select('id')
      .eq('subject', subj)
      .contains('participants', part)
      .limit(1);
    let threadId;
    if (existing && existing.length > 0) {
      threadId = existing[0].id;
    } else {
      const { data: created } = await supabaseClient
        .from('email_threads')
        .insert([{ subject: subj, last_activity_at: new Date().toISOString(), participants: part, labels: [] }])
        .select('id')
        .limit(1);
      threadId = created && created[0] && created[0].id;
    }
    const clean = sanitizeHtml(body_html || '');
    await supabaseClient
      .from('email_thread_messages')
      .insert([{ thread_id: threadId, direction: 'inbound', sender, recipient, subject: subj, body_html: clean, timestamp: new Date().toISOString(), attachments, read: false }]);
    await supabaseClient
      .from('email_inbox_logs')
      .insert([{ thread_id: threadId, sender, recipient, subject: subj, body_html: clean, has_attachments: !!attachments, read: false, attachments }]);
    await supabaseClient
      .from('email_threads')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', threadId);
    notify('inbox_new', { threadId });
    res.json({ success: true, threadId });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/email/campaigns', async (req, res) => {
  try {
    const { sender_email, subject, body_html, campaign_type, recipients = [], scheduled_at, created_by, config_id } = req.body || {};
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { data, error } = await supabaseClient
      .from('email_campaigns')
      .insert([{ sender_email, subject, body_html, campaign_type, status: scheduled_at ? 'scheduled' : 'draft', scheduled_at, created_by, config_id }])
      .select('id')
      .limit(1);
    if (error) return res.status(500).json({ success: false, error: error.message });
    const id = data && data[0] && data[0].id;
    if (recipients.length > 0) {
      const rows = recipients.map((email) => ({ campaign_id: id, email, status: 'pending' }));
      await supabaseClient.from('email_campaign_recipients').insert(rows);
    }
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/email/campaigns/:id/send-now', async (req, res) => {
  try {
    const { id } = req.params;
    queue.enqueueCampaign(id);
    notify('queue_update', { queueSize: queue.size });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/email/campaigns/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
    const { error } = await supabaseClient.from('email_campaigns').update({ status: 'paused' }).eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/email/campaigns/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
    const { error } = await supabaseClient.from('email_campaigns').update({ status: 'scheduled' }).eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    queue.enqueueCampaign(id);
    notify('queue_update', { queueSize: queue.size });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/email/dashboard', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
    const [cDraft, cSched, cSent, rSent, rOpened, rClicked, rFailed] = await Promise.all([
      supabaseClient.from('email_campaigns').select('id', { count: 'exact', head: true }).eq('status','draft'),
      supabaseClient.from('email_campaigns').select('id', { count: 'exact', head: true }).eq('status','scheduled'),
      supabaseClient.from('email_campaigns').select('id', { count: 'exact', head: true }).eq('status','sent'),
      supabaseClient.from('email_campaign_recipients').select('id', { count: 'exact', head: true }).eq('status','sent'),
      supabaseClient.from('email_campaign_recipients').select('id', { count: 'exact', head: true }).eq('status','opened'),
      supabaseClient.from('email_campaign_recipients').select('id', { count: 'exact', head: true }).eq('status','clicked'),
      supabaseClient.from('email_campaign_recipients').select('id', { count: 'exact', head: true }).eq('status','failed'),
    ]);
    res.json({ success: true, data: {
      campaigns: { draft: cDraft.count||0, scheduled: cSched.count||0, sent: cSent.count||0 },
      recipients: { sent: rSent.count||0, opened: rOpened.count||0, clicked: rClicked.count||0, failed: rFailed.count||0 }
    }});
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/email/tracking/open/:recipientId.gif', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
    await supabaseClient.from('email_campaign_recipients').update({ status: 'opened', opened_at: new Date().toISOString() }).eq('id', recipientId);
    const pixel = Buffer.from('R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    res.end(pixel);
  } catch (e) { res.status(500).end(); }
});

app.get('/email/tracking/click/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const url = String(req.query.url || '');
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
    await supabaseClient.from('email_campaign_recipients').update({ status: 'clicked', clicked_at: new Date().toISOString() }).eq('id', recipientId);
    res.redirect(url || '/');
  } catch (e) { res.redirect('/'); }
});

app.post('/email/unsubscribe/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { email } = req.body || {};
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
    if (email) {
      await supabaseClient.from('email_unsubscribes').upsert({ email, reason: 'user_unsubscribe', created_at: new Date().toISOString() });
    }
    await supabaseClient.from('email_campaign_recipients').update({ status: 'failed', error_message: 'unsubscribed' }).eq('id', recipientId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/email/campaigns/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body || {};
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { error } = await supabaseClient
      .from('email_campaigns')
      .update({ status: 'scheduled', scheduled_at })
      .eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/email/webhooks/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const payload = req.body || {};
    const email = payload.email || payload.recipient || payload.to || payload.address;
    const reason = payload.reason || payload.event || 'bounce';
    if (!email) return res.status(400).json({ success: false, error: 'email missing' });
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    await supabaseClient
      .from('email_blacklist')
      .upsert({ email, reason, last_seen: new Date().toISOString() });
    await supabaseClient
      .from('email_sending_logs')
      .update({ status: 'bounced', error_message: reason })
      .eq('recipient_email', email);
    notify('outbox_update', { email, provider });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const queue = {
  size: 0,
  failed: 0,
  slow: 0,
  campaigns: new Set(),
  enqueueCampaign(id) {
    this.campaigns.add(id);
    this.size = this.campaigns.size;
  }
};

async function getUserRoleAndLimit(userId) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  );
  const { data: roleData } = await supabaseClient.rpc('get_current_user_role');
  let role = roleData || 'staff';
  let limit = 1000;
  if (role === 'agent') limit = 200;
  if (role === 'admin' || role === 'super_admin') limit = 1000000000;
  return { role, limit };
}

async function checkAndIncrementDailyUsage(userId, limit) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  );
  const today = new Date().toISOString().slice(0,10);
  const { data } = await supabaseClient
    .from('email_daily_usage')
    .select('sent_today, limit')
    .eq('user_id', userId)
    .eq('date', today)
    .limit(1);
  let sent = data && data[0] ? data[0].sent_today || 0 : 0;
  const currentLimit = data && data[0] && data[0].limit ? data[0].limit : limit;
  if (sent >= currentLimit) return false;
  if (data && data[0]) {
    await supabaseClient
      .from('email_daily_usage')
      .update({ sent_today: sent + 1, limit: currentLimit })
      .eq('user_id', userId)
      .eq('date', today);
  } else {
    await supabaseClient
      .from('email_daily_usage')
      .insert([{ user_id: userId, sent_today: 1, limit: currentLimit, date: today }]);
  }
  return true;
}

async function isBlockedEmail(email) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseClient = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  );
  const { data: ub } = await supabaseClient
    .from('email_unsubscribes')
    .select('email')
    .eq('email', email)
    .limit(1);
  if (ub && ub.length > 0) return true;
  const { data: bl } = await supabaseClient
    .from('email_blacklist')
    .select('email')
    .eq('email', email)
    .limit(1);
  return !!(bl && bl.length > 0);
}

async function processQueueTick() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const ids = Array.from(queue.campaigns.values());
    if (ids.length === 0) return;
    const { data: campaigns } = await supabaseClient
      .from('email_campaigns')
      .select('id, subject, body_html, sender_email, created_by')
      .in('id', ids);
    for (const c of campaigns || []) {
      const { data: statusRow } = await supabaseClient.from('email_campaigns').select('status').eq('id', c.id).limit(1);
      const st = statusRow && statusRow[0] && statusRow[0].status;
      if (st === 'paused') continue;
      const { data: next } = await supabaseClient
        .from('email_campaign_recipients')
        .select('id, email, status')
        .eq('campaign_id', c.id)
        .eq('status', 'pending')
        .limit(1);
      if (!next || next.length === 0) {
        queue.campaigns.delete(c.id);
        queue.size = queue.campaigns.size;
        continue;
      }
      const recipient = next[0];
      const { limit } = await getUserRoleAndLimit(c.created_by);
      const allowed = await checkAndIncrementDailyUsage(c.created_by, limit);
      if (!allowed) {
        await supabaseClient
          .from('email_campaign_recipients')
          .update({ status: 'failed', error_message: 'daily limit reached' })
          .eq('id', recipient.id);
        queue.failed += 1;
        notify('queue_update', { queueSize: queue.size, failed: queue.failed });
        continue;
      }
      const blocked = await isBlockedEmail(recipient.email);
      if (blocked) {
        await supabaseClient
          .from('email_campaign_recipients')
          .update({ status: 'failed', error_message: 'blocked recipient' })
          .eq('id', recipient.id);
        queue.failed += 1;
        notify('queue_update', { queueSize: queue.size, failed: queue.failed });
        continue;
      }
      try {
        const html = c.body_html;
        const resSend = await fetch(`${process.env.VITE_EMAIL_SERVER_URL || 'http://localhost:'+PORT}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipient.email, subject: c.subject, html, configId: c.config_id })
        });
        if (!resSend.ok) throw new Error('send failed');
        await supabaseClient
          .from('email_campaign_recipients')
          .update({ status: 'sent' })
          .eq('id', recipient.id);
        notify('outbox_update', { email: recipient.email });
      } catch (err) {
        await supabaseClient
          .from('email_campaign_recipients')
          .update({ status: 'failed', error_message: 'send failed' })
          .eq('id', recipient.id);
        queue.failed += 1;
        notify('queue_update', { queueSize: queue.size, failed: queue.failed });
      }
    }
  } catch {}
}

setInterval(processQueueTick, 600);
cron.schedule('* * * * *', async () => {
  notify('queue_update', { queueSize: queue.size });
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const now = new Date().toISOString();
    const { data: sched } = await supabaseClient
      .from('email_campaigns')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .limit(50);
    for (const c of sched || []) {
      queue.enqueueCampaign(c.id);
      notify('queue_update', { queueSize: queue.size });
    }
  } catch {}
});
