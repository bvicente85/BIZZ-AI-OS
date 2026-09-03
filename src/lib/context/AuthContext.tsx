'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  workspaceId: string | null;
  workspaceRole: string | null;
  workspaceName: string | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userId: null,
  workspaceId: null,
  workspaceRole: null,
  workspaceName: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = useCallback(async (currentUserId: string) => {
    try {
      // Resolve user's workspace dynamically from workspace_members
      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(id, name)')
        .eq('user_id', currentUserId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error resolving workspace membership:', error);
        return;
      }

      if (data) {
        setWorkspaceId(data.workspace_id);
        setWorkspaceRole(data.role);
        // Handle join data safely
        const ws = data.workspaces as unknown as { id: string; name: string } | null;
        setWorkspaceName(ws?.name || 'Workspace Principal');
      } else {
        setWorkspaceId(null);
        setWorkspaceRole(null);
        setWorkspaceName(null);
      }
    } catch (err) {
      console.error('Failed to fetch workspace:', err);
    }
  }, [supabase]);

  const refreshAuth = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        await fetchWorkspace(currentSession.user.id);
      } else {
        setWorkspaceId(null);
        setWorkspaceRole(null);
        setWorkspaceName(null);
      }
    } catch (err) {
      console.error('Error refreshing auth:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchWorkspace]);

  useEffect(() => {
    refreshAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          await fetchWorkspace(newSession.user.id);
        } else {
          setWorkspaceId(null);
          setWorkspaceRole(null);
          setWorkspaceName(null);
        }

        setLoading(false);

        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshAuth, fetchWorkspace, router]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setWorkspaceId(null);
      setWorkspaceRole(null);
      setWorkspaceName(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id || null,
        workspaceId,
        workspaceRole,
        workspaceName,
        session,
        loading,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
