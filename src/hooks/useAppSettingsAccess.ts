import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const ALLOWED_ROLES = ['super_admin', 'manager'];
// Allow a safe dev bypass so the App Settings UI can be tested locally
const DEV_BYPASS = (import.meta.env.MODE === 'development') && (import.meta.env.VITE_APPSETTINGS_DEV_BYPASS !== 'false');

export const useAppSettingsAccess = () => {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        if (DEV_BYPASS) {
          setHasAccess(true);
          setUserRole('dev_bypass');
        } else {
          setHasAccess(false);
          setUserRole(null);
        }
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        let role: string | null = null;

        // Use the get_current_user_role function to get the user's role
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_current_user_role');

        if (!roleError && roleData) {
          role = roleData;
        } else {
          // Fallback to profiles table if the function fails
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData?.role) {
            role = profileData.role;
          } else {
            setHasAccess(false);
            setUserRole(null);
            setError('Unable to verify user permissions');
            setIsLoading(false);
            return;
          }
        }

        setUserRole(role);

        // Check if user has required role
        const hasRequiredRole = role && ALLOWED_ROLES.includes(role);
        setHasAccess(!!hasRequiredRole);

        if (!hasRequiredRole && !DEV_BYPASS) {
          setError(`Access denied. Required roles: ${ALLOWED_ROLES.join(', ')}. Your role: ${role || 'None'}`);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access App Settings. Only Super Admin and Manager roles are allowed.",
            variant: "destructive",
          });
        }
        // In dev bypass mode, allow access even if role isn't one of the allowed roles
        setHasAccess(hasRequiredRole || DEV_BYPASS);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error checking app settings access:', err);
        setHasAccess(false);
        setUserRole(null);
        setError(errorMessage);
        
        toast({
          title: "Access Check Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkAccess();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  return {
    hasAccess,
    isLoading,
    userRole,
    error,
  };
};