import { useState, useEffect, useCallback, useRef } from 'react';
import { seoService, EnhancedProfile, ProfileActivityLog } from '@/services/seoService';

export function useEnhancedProfile(userId?: string) {
  const [profile, setProfile] = useState<EnhancedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Auto-save functionality
  const autoSaveRef = useRef<((data: Partial<EnhancedProfile>) => void) | null>(null);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const profileData = await seoService.getEnhancedProfile(userId);
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save profile
  const saveProfile = useCallback(async (updates: Partial<EnhancedProfile>) => {
    if (!userId) return null;
    
    try {
      setSaving(true);
      setError(null);
      
      const updatedProfile = await seoService.upsertEnhancedProfile({
        ...updates,
        user_id: userId
      });
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        setLastSaved(new Date());
        return updatedProfile;
      }
      throw new Error('Failed to save profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Auto-save with debouncing
  const autoSave = useCallback((updates: Partial<EnhancedProfile>) => {
    if (autoSaveRef.current) {
      autoSaveRef.current(updates);
    }
  }, []);

  // Update profile field (with auto-save)
  const updateField = useCallback((field: keyof EnhancedProfile, value: any) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);
    
    // Trigger auto-save
    autoSave({ [field]: value });
  }, [profile, autoSave]);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<EnhancedProfile>) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    // Trigger auto-save
    autoSave(updates);
  }, [profile, autoSave]);

  // Initialize auto-save
  useEffect(() => {
    if (userId) {
      autoSaveRef.current = seoService.createAutoSave(
        `profile_${userId}`,
        saveProfile,
        1500 // 1.5 second debounce
      );
    }
  }, [userId, saveProfile]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const subscription = seoService.subscribeToEnhancedProfile(userId, (updatedProfile) => {
      setProfile(updatedProfile);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    profile,
    loading,
    saving,
    error,
    lastSaved,
    saveProfile,
    updateField,
    updateFields,
    refreshProfile: loadProfile
  };
}

export function useProfileActivity(userId?: string, limit: number = 50) {
  const [activityLog, setActivityLog] = useState<ProfileActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivityLog = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const logs = await seoService.getProfileActivityLog(userId, limit);
      setActivityLog(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    loadActivityLog();
  }, [loadActivityLog]);

  return {
    activityLog,
    loading,
    error,
    refreshActivityLog: loadActivityLog
  };
}

// Hook for form validation and enhanced features
export function useProfileValidation() {
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, []);

  const validateRequired = useCallback((value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  }, []);

  const validateProfile = useCallback((profile: Partial<EnhancedProfile>) => {
    const errors: Record<string, string> = {};

    if (profile.first_name && profile.first_name.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }

    if (profile.last_name && profile.last_name.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }

    if (profile.phone && !validatePhone(profile.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (profile.bio && profile.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [validatePhone]);

  return {
    validateEmail,
    validatePhone,
    validateRequired,
    validateProfile
  };
}