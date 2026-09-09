import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../api/axios";

export interface StudentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  place: string;
  board: string;
  course: string;
  currentClass?: string;
  neetExamYear?: number;
  role: "student" | "admin";
  progress: number;
  yneetSubscribed?: boolean;
}

interface AuthContextValue {
  user: StudentUser | null;
  loading: boolean;
  login: (token: string, user: StudentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ra_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("ra_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, user: StudentUser) => {
    localStorage.setItem("ra_token", token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("ra_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
