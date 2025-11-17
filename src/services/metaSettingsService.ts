/*
 * Meta WhatsApp Settings Service
 * Handles Meta WhatsApp Business API configuration management
 */

import { z } from 'zod';
import { adminSupabase } from '@/lib/supabaseClient';

// Validation schemas
const metaSettingsSchema = z.object({
  waba_id: z.string().min(1, 'WhatsApp Business Account ID is required'),
  phone_id: z.string().min(1, 'Phone Number ID is required'),
  token: z.string().min(1, 'Access token is required'),
  template_name: z.string().min(1, 'Template name is required').default('otp_verification'),
  business_name: z.string().min(1, 'Business name is required'),
  is_active: z.boolean().optional().default(true)
});

const testMessageSchema = z.object({
  phone: z.string().min(10, 'Phone number is required').max(15, 'Phone number too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long')
});

export interface MetaSettings {
  id?: string;
  waba_id: string;
  phone_id: string;
  token: string;
  template_name: string;
  business_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TestMessageResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

/**
 * Get current Meta WhatsApp settings
 */
export async function getMetaSettings(): Promise<{ success: boolean; data?: MetaSettings; error?: string }> {
  try {
    const { data, error } = await adminSupabase
      .from('meta_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'No Meta WhatsApp configuration found' };
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching Meta settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update Meta WhatsApp settings
 */
export async function updateMetaSettings(settings: MetaSettings): Promise<{ success: boolean; data?: MetaSettings; error?: string }> {
  try {
    // Validate input
    const validatedData = metaSettingsSchema.parse(settings);

    // Check if settings exist
    const existing = await getMetaSettings();
    
    let result;
    if (existing.success && existing.data) {
      // Update existing settings
      const { data, error } = await adminSupabase
        .from('meta_settings')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.data.id)
        .select()
        .single();

      if (error) throw new Error(`Update failed: ${error.message}`);
      result = data;
    } else {
      // Create new settings (ensure only one active configuration)
      await adminSupabase
        .from('meta_settings')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new settings
      const { data, error } = await adminSupabase
        .from('meta_settings')
        .insert({
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new Error(`Insert failed: ${error.message}`);
      result = data;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error updating Meta settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test WhatsApp connection by sending a test message
 */
export async function testWhatsAppConnection(phone: string, message: string): Promise<TestMessageResult> {
  try {
    // Validate input
    const validatedData = testMessageSchema.parse({ phone, message });
    
    // Get Meta settings
    const settings = await getMetaSettings();
    if (!settings.success || !settings.data) {
      return { success: false, error: 'Meta WhatsApp not configured' };
    }

    const config = settings.data;
    
    // First, verify the phone number ID exists and is accessible
    const phoneCheckResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_id}?access_token=${config.token}`,
      { method: 'GET' }
    );

    if (!phoneCheckResponse.ok) {
      const phoneError = await phoneCheckResponse.json();
      let errorMessage = 'WhatsApp API error: ';
      
      if (phoneError.error?.code === 100) {
        errorMessage += 'Phone number ID not found. Please verify your Phone Number ID is correct and registered with WhatsApp Business.';
      } else if (phoneError.error?.code === 190) {
        errorMessage += 'Access token is invalid or expired. Please generate a new token from Meta Business Manager.';
      } else if (phoneError.error?.message?.includes('does not exist')) {
        errorMessage += 'The specified phone number ID does not exist. Please check your WhatsApp Business configuration.';
      } else if (phoneError.error?.message?.includes('permissions')) {
        errorMessage += 'Missing permissions. Please ensure your app has WhatsApp Business API permissions enabled.';
      } else {
        errorMessage += phoneError.error?.message || 'Failed to verify phone number ID';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }

    // Format phone number
    const formattedPhone = validatedData.phone.startsWith('+') 
      ? validatedData.phone 
      : `+${validatedData.phone}`;

    // Prepare test message
    const testMessage = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: validatedData.message
      }
    };

    // Send message via Meta API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = 'WhatsApp API error: ';
      
      // Handle specific error codes
      if (errorData.error?.code === 100) {
        errorMessage += 'Unsupported request. Please verify your phone number is properly registered with WhatsApp Business.';
      } else if (errorData.error?.code === 200) {
        errorMessage += 'Permissions error. Please ensure your app has the necessary WhatsApp Business API permissions.';
      } else if (errorData.error?.code === 190) {
        errorMessage += 'Access token expired or invalid. Please generate a new token.';
      } else if (errorData.error?.type === 'OAuthException') {
        errorMessage += 'Authentication failed. Please check your access token and app permissions.';
      } else if (errorData.error?.message?.includes('does not exist')) {
        errorMessage += 'The specified object does not exist. Please check your WhatsApp Business configuration.';
      } else {
        errorMessage += errorData.error?.message || 'Failed to send WhatsApp message';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }

    const result = await response.json();
    
    console.log('✅ Test WhatsApp message sent:', {
      phone: formattedPhone,
      messageId: result.messages?.[0]?.id
    });

    return {
      success: true,
      message_id: result.messages?.[0]?.id
    };
  } catch (error) {
    console.error('❌ Test WhatsApp message failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Validate WhatsApp Business Account ID format
 */
export function validateWabaId(wabaId: string): boolean {
  // WhatsApp Business Account ID format: typically starts with a number
  const wabaRegex = /^\d{10,}$/;
  return wabaRegex.test(wabaId);
}

/**
 * Validate Phone Number ID format
 */
export function validatePhoneId(phoneId: string): boolean {
  // Phone Number ID format: typically starts with a number
  const phoneIdRegex = /^\d{10,}$/;
  return phoneIdRegex.test(phoneId);
}

/**
 * Validate Meta access token format
 */
export function validateAccessToken(token: string): boolean {
  // Meta access token format: typically starts with 'EAA' or similar
  const tokenRegex = /^[A-Za-z0-9]{100,}$/;
  return tokenRegex.test(token) && token.length >= 100;
}

/**
 * Check if access token might be expired based on format
 */
export function checkTokenExpirationRisk(token: string): { isValid: boolean; riskLevel: 'low' | 'medium' | 'high'; message: string } {
  if (!token || token.length < 50) {
    return {
      isValid: false,
      riskLevel: 'high',
      message: 'Token appears to be invalid or too short'
    };
  }

  if (!token.startsWith('EAA')) {
    return {
      isValid: false,
      riskLevel: 'high',
      message: 'Token should start with "EAA" for Meta Business API'
    };
  }

  // Check if token contains common expired token patterns
  const expiredPatterns = ['expired', 'invalid', 'session'];
  const hasExpiredPattern = expiredPatterns.some(pattern => token.toLowerCase().includes(pattern));
  
  if (hasExpiredPattern) {
    return {
      isValid: true,
      riskLevel: 'high',
      message: 'Token may be expired or invalid'
    };
  }

  return {
    isValid: true,
    riskLevel: 'low',
    message: 'Token format appears valid'
  };
}

/**
 * Mask sensitive token data for display
 */
export function maskToken(token: string): string {
  if (!token || token.length < 8) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

/**
 * Get connection status
 */
export async function getConnectionStatus(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    const settings = await getMetaSettings();
    if (!settings.success || !settings.data) {
      return 'disconnected';
    }

    // Test connection with a simple API call
    const config = settings.data;
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phone_id}?access_token=${config.token}`,
      { method: 'GET' }
    );

    if (response.ok) {
      return 'connected';
    } else {
      return 'error';
    }
  } catch (error) {
    console.error('❌ Connection status check failed:', error);
    return 'error';
  }
}