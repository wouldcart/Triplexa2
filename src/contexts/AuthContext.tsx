import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types/User';
import { supabase } from '@/lib/supabaseClient';
import { recordStaffLogin, recordStaffLogout, isStaffCurrentlyActive } from '@/services/loginRecordService';
import { userTrackingService } from '../services/userTrackingService';
import { SessionManager, handleSessionError } from '../utils/sessionManager';
import { autoReloginFlow } from '../utils/autoReloginFlow';

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ user: User | null; error: string | null }>;
  signInWithGoogle: (role?: string) => Promise<{ user: User | null; error: string | null }>;
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
    let validationInterval: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      // Check for existing session on mount with validation
      try {
        const validationResult = await SessionManager.validateSession();
        
        if (!mounted) return;
        
        if (validationResult.shouldSignOut) {
          // Session is invalid, clear everything
          setUser(null);
          setSession(null);
          await SessionManager.clearSession();
        } else if (validationResult.isValid) {
          // Session is valid, get user profile
          const { user: sessionUser, session: currentSession, error } = await AuthService.getCurrentSession();
          
          if (sessionUser && currentSession && !error) {
            setUser(sessionUser);
            setSession(currentSession);
          } else {
            setUser(null);
            setSession(null);
          }
        } else {
          // No session or needs refresh
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
        
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          // User signed in, get their profile
          console.log('🎉 SIGNED_IN event detected, getting current session for user:', session.user?.email);
          const { user: sessionUser, error } = await AuthService.getCurrentSession();
          if (!error && sessionUser) {
            console.log('✅ Session user retrieved:', sessionUser.id, 'with role:', sessionUser.role);
            setUser(sessionUser);
            setSession(session);
            // Record staff login
            if (sessionUser.role === 'staff' && sessionUser.id) {
              try {
                recordStaffLogin(sessionUser.id, sessionUser.name || session.user?.email || sessionUser.id);
              } catch (e) {
                console.warn('Staff login recording failed on SIGNED_IN:', e);
              }
            }
          } else {
            console.log('❌ Error getting session user:', error);
          }
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session state on subscription setup
          if (session && session.user) {
            const { user: sessionUser, error } = await AuthService.getCurrentSession();
            if (!error && sessionUser) {
              setUser(sessionUser);
              setSession(session);
            } else {
              setUser(null);
              setSession(null);
            }
          } else {
            // No session on init; keep state cleared without triggering cleanup
            setUser(null);
            setSession(null);
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          // Record staff logout if applicable
          try {
            if (user?.role === 'staff' && user?.id && isStaffCurrentlyActive(user.id)) {
              recordStaffLogout(user.id);
            }
          } catch (e) {
            console.warn('Staff logout recording failed on SIGNED_OUT:', e);
          }
          setUser(null);
          setSession(null);
          // Avoid redundant cleanup on initial load when there was no prior session
          if (user) {
            await SessionManager.clearSession();
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed, update session
          console.log('Token refreshed successfully');
          setSession(session);
        }
      });

      // Set up periodic session validation
      validationInterval = setInterval(() => {
        if (mounted) {
          SessionManager.periodicValidation();
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => {
        subscription.unsubscribe();
        if (validationInterval) {
          clearInterval(validationInterval);
        }
      };
    };

    initializeAuth();
    
    return () => {
      mounted = false;
      if (validationInterval) {
        clearInterval(validationInterval);
      }
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
        
        // Store credentials for auto re-login (only in memory for security)
        autoReloginFlow.storeCredentials(email, password);
        
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

  const signInWithGoogle = async (role: string = 'agent') => {
    try {
      setLoading(true);
      const response = await AuthService.signInWithGoogle(role);
      
      if (response.error) {
        return { user: null, error: response.error };
      }
      
      // Google OAuth will redirect, so we don't set user/session here
      // The auth state change listener will handle the session after redirect
      return { user: null, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Record staff logout before actual sign out
      try {
        if (user?.role === 'staff' && user?.id && isStaffCurrentlyActive(user.id)) {
          recordStaffLogout(user.id);
        }
      } catch (e) {
        console.warn('Staff logout recording failed during signOut:', e);
      }
      await AuthService.signOut();
      setUser(null);
      setSession(null);
      
      // Use SessionManager for comprehensive cleanup
      await SessionManager.clearSession();
      
      // Clear stored credentials for auto re-login
      autoReloginFlow.clearCredentials();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state
      await SessionManager.clearSession();
      autoReloginFlow.clearCredentials();
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
    signInWithGoogle,
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