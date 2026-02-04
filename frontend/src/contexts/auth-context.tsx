"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient, ApiError } from "@/lib/api-client";

interface User {
  _id: string;
  name: string;
  email: string;
  verified: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const response: any = await apiClient.getCurrentUser();
      setUser(response);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status !== 401) {
        setError(apiError.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response: any = await apiClient.login(email, password);
      setUser(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response: any = await apiClient.register(email, name, password);
      setUser(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
