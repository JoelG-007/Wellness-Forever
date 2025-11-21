import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initializeDatabase } from "../utils/supabase/client";

interface PharmacistUser {
  id: string;
  email: string;
  name: string;
  role: string;
  pharmacy: string;
  initials: string;
}

interface AuthContextType {
  user: PharmacistUser | null;
  login: (user: PharmacistUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PharmacistUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('wellnessForever_currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('wellnessForever_currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (userData: PharmacistUser) => {
    setUser(userData);
    localStorage.setItem('wellnessForever_currentUser', JSON.stringify(userData));
    
    // Initialize database when user logs in
    try {
      await initializeDatabase();
    } catch (error) {
      console.warn("Database initialization failed, using local storage:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wellnessForever_currentUser');
    // Clear any other user-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wellnessForever_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      if (key !== 'wellnessForever_currentUser') {
        localStorage.removeItem(key);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}