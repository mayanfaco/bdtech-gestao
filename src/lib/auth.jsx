import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.js';

const AuthContext = React.createContext(null);

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, display_name, active, roles(key, label)')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;

  const { data: perms } = await supabase
    .from('role_permissions')
    .select('module, action, allowed')
    .eq('role_id', data.role_id)
    .eq('allowed', true);

  return {
    displayName: data.display_name,
    active: data.active,
    roleKey: data.roles?.key ?? null,
    roleLabel: data.roles?.label ?? null,
    permissions: perms ?? [],
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = React.useState(undefined); // undefined = loading
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) { setProfile(null); return; }
    setProfileLoading(true);
    fetchProfile(userId).then((p) => { setProfile(p); setProfileLoading(false); });
  }, [session?.user?.id]);

  const can = React.useCallback((module, action) => {
    if (!profile) return false;
    return profile.permissions.some((p) => p.module === module && p.action === action);
  }, [profile]);

  const value = React.useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    profile,
    profileLoading,
    role: profile?.roleKey ?? null,
    can,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }), [session, profile, profileLoading, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
