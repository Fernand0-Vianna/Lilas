import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  apelido: string;
  avatar_url: string | null;
  bio: string | null;
  cover_url?: string | null;
  banner_url?: string | null;
  is_admin?: boolean;
  created_at?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);
const PROFILE_SELECT = 'id, apelido, avatar_url, bio, is_admin, created_at';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .eq('id', data.session.user.id)
          .maybeSingle();
        setProfile(p as Profile | null);
      }
      setLoading(false);
    };
    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    if (profile?.id === session.user.id) return;
    supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [session?.user?.id]);

  const refreshProfile = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', session.user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, refreshProfile, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
