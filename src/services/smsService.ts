import { supabase } from '@/lib/supabaseClient';

// Get the API base URL from environment or use current origin
const getApiBaseUrl = () => {
  // In development, use the API server on port 3002
  if (import.meta.env.DEV) {
    return 'http://localhost:3002';
  }
  // In production, use the deployed URL or current origin
  return import.meta.env.VITE_VERCEL_URL || window.location.origin;
};

export const sendOtp = async (phone: string, type: 'login' | 'register' = 'login') => {
  try {
    const baseUrl = getApiBaseUrl();
    console.log('Sending OTP to:', `${baseUrl}/api/sms/sendOtp`);
    
    const response = await fetch(`${baseUrl}/api/sms/sendOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, purpose: type }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      return { data: null, error: { message: `HTTP ${response.status}: ${errorText || 'Failed to send OTP'}` } };
    }
    
    // Only try to parse JSON if content-type indicates JSON
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, error: null };
    } else {
      // If not JSON, return the text response
      const text = await response.text();
      console.log('Non-JSON response:', text);
      return { data: { message: text, status: 'sent' }, error: null };
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { data: null, error: { message: error instanceof Error ? error.message : 'Network error. Please check your connection.' } };
  }
};

export const verifyOtp = async (phone: string, requestId: string, otp: string) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/sms/verifyOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, request_id: requestId, otp }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Failed to verify OTP' } };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { data: null, error: { message: 'Network error. Please check your connection.' } };
  }
};

export const upsertAgentWithPhone = async (phone: string, name: string) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/upsert-agent-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, name }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Failed to create agent account' } };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating agent account:', error);
    return { data: null, error: { message: 'Network error. Please check your connection.' } };
  }
};

export const getSmsConfigStatus = async () => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/sms/config-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { ok: false, data: null, error: { message: data.error || 'Failed to get SMS config' } };
    }
    
    return { ok: true, data, error: null };
  } catch (error) {
    console.error('Error getting SMS config:', error);
    return { ok: false, data: null, error: { message: 'Network error. Please check your connection.' } };
  }
};

export const updateAccountEmail = async (userId: string, newEmail: string) => {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/update-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, new_email: newEmail }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Failed to update email' } };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating email:', error);
    return { data: null, error: { message: 'Network error. Please check your connection.' } };
  }
};
