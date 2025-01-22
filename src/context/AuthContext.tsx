import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

type AuthContextType = {
  user: User | null;
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // First, create the auth user
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

      // Create user profile using the security definer function
      const { error: profileError } = await supabase
        .rpc('create_customer_user', {
          user_id: data.user.id,
          user_email: data.user.email,
          user_full_name: fullName
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.signOut();
        return { user: null, error: profileError };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return { user: null, error: err as Error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
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