import { supabase } from './supabaseClient';

const PROFILE_API_BASE = 'http://localhost:3003';

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(
  endpoint: string, 
  options: RequestInit = {}
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

  return fetch(`${PROFILE_API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
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