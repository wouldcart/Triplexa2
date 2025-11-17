import { supabase } from './supabaseClient';

const PROFILE_API_BASE = 'http://localhost:3003';

// Helper function to get auth token
const MAX_RETRIES = 1; // Only retry once

// Helper function to get auth token, ensuring it's fresh
async function getAuthToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  if (session) {
    // Check if the token is expired or about to expire (e.g., within 60 seconds)
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const expiresIn = expiresAt - now;

    if (expiresIn < 60000) { // If token expires in less than 60 seconds
      console.log("Access token is about to expire or has expired, refreshing session...");
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
        return null;
      }
      if (refreshedSession) {
        console.log("Session refreshed successfully.");
        return refreshedSession.access_token;
      }
    }
    return session.access_token;
  }
  return null;
}

// Helper function to make authenticated requests with retry logic
async function makeAuthenticatedRequest(
  endpoint: string, 
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(`${PROFILE_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok && response.status === 401 && retryCount < MAX_RETRIES) {
      console.warn("Authentication failed, attempting to refresh token and retry...");
      // Force a session refresh before retrying
      await supabase.auth.refreshSession(); 
      return makeAuthenticatedRequest(endpoint, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  phone?: string;
  department?: string;
  position?: string;
  employee_id?: string;
  company_name?: string;
  city?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  name?: string;
  role?: 'user' | 'admin' | 'super_admin';
  phone?: string;
  department?: string;
  position?: string;
  employee_id?: string;
  company_name?: string;
  city?: string;
  country?: string;
}

export interface UpdateProfileData {
  name?: string;
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'inactive';
  phone?: string;
  department?: string;
  position?: string;
  employee_id?: string;
  company_name?: string;
  city?: string;
  country?: string;
}

export class ProfileApiClient {
  // Get current user's profile
  static async getCurrentProfile(): Promise<Profile> {
    const response = await makeAuthenticatedRequest('/api/profile');
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch profile' }));
      throw new Error(error.error || 'Failed to fetch profile');
    }
    
    return response.json();
  }

  // Create or update current user's profile
  static async createOrUpdateProfile(data: CreateProfileData): Promise<Profile> {
    const response = await makeAuthenticatedRequest('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save profile' }));
      throw new Error(error.error || 'Failed to save profile');
    }
    
    return response.json();
  }

  // Update current user's profile
  static async updateProfile(data: UpdateProfileData): Promise<Profile> {
    const response = await makeAuthenticatedRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(error.error || 'Failed to update profile');
    }
    
    return response.json();
  }

  // Get all profiles (admin only)
  static async getAllProfiles(): Promise<Profile[]> {
    const response = await makeAuthenticatedRequest('/api/profiles');
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch profiles' }));
      throw new Error(error.error || 'Failed to fetch profiles');
    }
    
    return response.json();
  }

  // Get profiles by role (admin only)
  static async getProfilesByRole(role: string): Promise<Profile[]> {
    const response = await makeAuthenticatedRequest(`/api/profiles?role=${encodeURIComponent(role)}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch profiles' }));
      throw new Error(error.error || 'Failed to fetch profiles');
    }
    
    return response.json();
  }

  // Update any profile by ID (admin only)
  static async updateProfileById(profileId: string, data: UpdateProfileData): Promise<Profile> {
    const response = await makeAuthenticatedRequest(`/api/profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(error.error || 'Failed to update profile');
    }
    
    return response.json();
  }

  // Delete profile by ID (admin only)
  static async deleteProfileById(profileId: string): Promise<{ message: string; profile: Profile }> {
    const response = await makeAuthenticatedRequest(`/api/profiles/${profileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete profile' }));
      throw new Error(error.error || 'Failed to delete profile');
    }
    
    return response.json();
  }

  // Create profile after signup (public endpoint)
  static async createProfileAfterSignup(userId: string, email: string, name?: string): Promise<Profile> {
    const response = await fetch(`${PROFILE_API_BASE}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        name,
        role: 'user',
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create profile' }));
      throw new Error(error.error || 'Failed to create profile');
    }
    
    return response.json();
  }

  // Check if profile API is available
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${PROFILE_API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Hook for React components
export function useProfileApi() {
  return {
    getCurrentProfile: ProfileApiClient.getCurrentProfile,
    createOrUpdateProfile: ProfileApiClient.createOrUpdateProfile,
    updateProfile: ProfileApiClient.updateProfile,
    getAllProfiles: ProfileApiClient.getAllProfiles,
    getProfilesByRole: ProfileApiClient.getProfilesByRole,
    updateProfileById: ProfileApiClient.updateProfileById,
    deleteProfileById: ProfileApiClient.deleteProfileById,
    createProfileAfterSignup: ProfileApiClient.createProfileAfterSignup,
    checkHealth: ProfileApiClient.checkHealth,
  };
}