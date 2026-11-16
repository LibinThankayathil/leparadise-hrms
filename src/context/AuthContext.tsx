'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string;
    department?: { id: string; name: string };
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

// In-memory cache so transitions between pages are instant with 0 flicker
let cachedUser: User | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);

  const fetchUser = async (isInitial = false) => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        cachedUser = null;
        setUser(null);
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        cachedUser = null;
        setUser(null);
        router.push('/login');
        return;
      }
      cachedUser = data.user;
      setUser(data.user);
    } catch (err) {
      console.error('Auth verification error:', err);
      cachedUser = null;
      setUser(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedUser) {
      fetchUser(true);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: () => fetchUser(false) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

