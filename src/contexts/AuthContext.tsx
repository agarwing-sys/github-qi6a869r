import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si le profil n'existe pas encore, ce n'est pas une erreur critique
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          setProfile(null);
        } else {
          console.error('Error loading profile:', error);
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithOTP = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    
    if (error) throw error;
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!profile) throw new Error('No profile loaded');

    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) throw error;

    // Reload profile
    await loadProfile(profile.user_id);
  };

  const value = {
    user,
    profile,
    loading,
    signInWithOTP,
    verifyOTP,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}