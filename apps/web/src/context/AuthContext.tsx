"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";
import { getSocket, disconnectSocket } from "../lib/socket";

export type BusinessType = "retail" | "wholesale" | "services";

export interface User {
  id: string;
  actorId?: string;
  name: string;
  email: string;
  role: "admin" | "user" | "staff";
  businessType: BusinessType;
  plan?: "free" | "pro";
  staffPermissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, businessType: BusinessType, phone?: string) => Promise<void>;
  updateUserLocal: (patch: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("giniespace_token");
    const savedUser = localStorage.getItem("giniespace_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        getSocket();
      } catch {
        localStorage.removeItem("giniespace_token");
        localStorage.removeItem("giniespace_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem("giniespace_token", receivedToken);
    localStorage.setItem("giniespace_user", JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    getSocket();
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    businessType: BusinessType,
    phone?: string
  ) => {
    const res = await api.post("/api/auth/signup", {
      name,
      email,
      password,
      businessType,
      phone,
    });
    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem("giniespace_token", receivedToken);
    localStorage.setItem("giniespace_user", JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    getSocket();
  };

  const updateUserLocal = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem("giniespace_user", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("giniespace_token");
    localStorage.removeItem("giniespace_user");
    setToken(null);
    setUser(null);
    disconnectSocket();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, updateUserLocal, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}