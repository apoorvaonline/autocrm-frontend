import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

type UserRole = 'customer' | 'employee' | 'admin';

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    user: User | null;
  }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{
    error: Error | null;
    user: User | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider rendered');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    // Try to get the role from localStorage on initial render
    const storedRole = localStorage.getItem('userRole');
    return storedRole ? JSON.parse(storedRole) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId: string) => {
    console.log('fetchUserRole called for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setLoading(false);
        return;
      }

      console.log('User role fetched:', data?.role);
      const role = data.role as UserRole;
      // Store the role in localStorage
      localStorage.setItem('userRole', JSON.stringify(role));
      setUserRole(role);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error fetching user role:', err);
      setLoading(false);
    }
  }, []);

  const handleAuthStateChange = useCallback(async (session: { user: User } | null) => {
    console.log('handleAuthStateChange called with session:', session ? 'exists' : 'null');
    setLoading(true);

    if (session?.user) {
      console.log('Setting user and fetching role');
      setUser(session.user);
      // Only fetch role if we don't have it in state
      if (!userRole) {
        await fetchUserRole(session.user.id);
      } else {
        console.log('Using cached role:', userRole);
        setLoading(false);
      }
    } else {
      console.log('No user, clearing state');
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('userRole');
      setLoading(false);
    }
  }, [fetchUserRole, userRole]);

  useEffect(() => {
    console.log('AuthProvider useEffect triggered');
    let mounted = true;

    async function initializeAuth() {
      console.log('initializeAuth started');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session retrieved:', session ? 'exists' : 'null');
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // Only fetch role if we don't have it in state
          if (!userRole) {
            await fetchUserRole(session.user.id);
          } else {
            console.log('Using cached role:', userRole);
            setLoading(false);
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('userRole');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (!mounted) return;
      await handleAuthStateChange(session);
    });

    return () => {
      console.log('AuthProvider cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, fetchUserRole, userRole]);

  useEffect(() => {
    console.log('Current auth state:', {
      user: user ? 'exists' : 'null',
      userRole,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [user, userRole, loading]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Refresh session to get latest metadata
      await supabase.auth.refreshSession();
      
      return { error: null, user: data.user };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('signUp started');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        return { user: null, error: signUpError };
      }

      if (!data.user) {
        console.error('No user data returned from auth signup');
        return { user: null, error: new Error('Failed to create user') };
      }

      console.log('Auth signup successful, creating user profile');
      const { error: profileError } = await supabase
        .rpc('create_customer_user', {
          user_id: data.user.id,
          user_email: data.user.email,
          user_full_name: fullName
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await supabase.auth.signOut();
        return { user: null, error: profileError };
      }

      console.log('User profile created successfully');
      return { user: data.user, error: null };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return { user: null, error: err as Error };
    }
  };

  const signOut = async () => {
    console.log('signOut started');
    try {
      const { error } = await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      console.log('Sign out completed', error ? 'with error' : 'successfully');
      return { error };
    } catch (err) {
      console.error('Error signing out:', err);
      return { error: err as Error };
    }
  };

  // Add a function to manually refresh the session
  const refreshSession = async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (!error && session) {
      setUser(session.user);
    }
    return { error };
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 