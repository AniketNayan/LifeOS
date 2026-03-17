import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextType = {
  currentUser: AuthUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<AuthResult>;
  getGoogleAuthUrl: () => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function parseError(response: Response) {
  try {
    const data = await response.json();
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return String(data.message[0]);
    }
  } catch {
    // ignore parse errors
  }

  return 'Request failed.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const hydrateSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        setCurrentUser(null);
        return;
      }

      const data = await response.json() as { user?: AuthUser };
      setCurrentUser(data.user ?? null);
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await hydrateSession();
      if (!cancelled) {
        setIsReady(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        return { ok: false, error: await parseError(response) };
      }

      const data = await response.json() as { user: AuthUser };
      setCurrentUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to sign in.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        return { ok: false, error: await parseError(response) };
      }

      const data = await response.json() as { user: AuthUser };
      setCurrentUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to create account.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setCurrentUser(null);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return { ok: false, error: await parseError(response) };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to send reset email.' };
    }
  };

  const resetPassword = async (email: string, token: string, newPassword: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, newPassword }),
      });

      if (!response.ok) {
        return { ok: false, error: await parseError(response) };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to reset password.' };
    }
  };

  const getGoogleAuthUrl = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/url`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return { ok: false as const, error: await parseError(response) };
      }

      const data = await response.json() as { url?: string };

      if (!data.url) {
        return { ok: false as const, error: 'Google sign-in is unavailable.' };
      }

      return { ok: true as const, url: data.url };
    } catch {
      return { ok: false as const, error: 'Unable to start Google sign-in.' };
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    currentUser,
    isReady,
    isAuthenticated: Boolean(currentUser),
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    getGoogleAuthUrl,
  }), [currentUser, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
