import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types/User';
import { supabase } from '@/lib/supabaseClient';
import { userTrackingService } from '../services/userTrackingService';

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: any) => Promise<{ user: User | null; error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      // Check for existing session on mount
      try {
        const { user: sessionUser, session: currentSession, error } = await AuthService.getCurrentSession();
        
        if (!mounted) return;
        
        if (sessionUser && currentSession && !error) {
          setUser(sessionUser);
          setSession(currentSession);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          // User signed in, get their profile
          const { user: sessionUser, error } = await AuthService.getCurrentSession();
          if (!error && sessionUser) {
            setUser(sessionUser);
            setSession(session);
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          setUser(null);
          setSession(null);
          localStorage.removeItem('user_permissions');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed, update session
          setSession(session);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Sync user with userTrackingService whenever user state changes
  useEffect(() => {
    userTrackingService.setCurrentUser(user);
    console.log('🔄 UserTrackingService updated with user:', user?.name || 'null');
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await AuthService.signIn(email, password);
      
      if (response.error) {
        return { user: null, error: response.error };
      }
      
      if (response.user) {
        setUser(response.user);
        setSession(response.session);
        return { user: response.user, error: null };
      }
      
      return { user: null, error: 'Authentication failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const response = await AuthService.signUp(email, password, userData);
      
      if (response.error) {
        return { user: null, error: response.error };
      }
      
      if (response.user) {
        setUser(response.user);
        setSession(response.session);
        return { user: response.user, error: null };
      }
      
      return { user: null, error: 'Registration failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      setUser(null);
      setSession(null);
      
      // Clear any stored permissions
      localStorage.removeItem('user_permissions');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await AuthService.resetPassword(email);
      return { error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { error: errorMessage };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const response = await AuthService.updatePassword(newPassword);
      return { error: response.error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      return { error: errorMessage };
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) {
        return { user: null, error: 'No user logged in' };
      }
      
      const response = await AuthService.updateProfile(user.id, updates);
      
      if (response.error) {
        return { user: null, error: response.error };
      }
      
      if (response.user) {
        setUser(response.user);
        return { user: response.user, error: null };
      }
      
      return { user: null, error: 'Profile update failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { user: null, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};