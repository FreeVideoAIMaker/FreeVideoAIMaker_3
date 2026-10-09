import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { fetchCurrentUser, loginUser, registerUser } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateUserQuota: (generationsToday: number, maxDailyGenerations: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const refreshUser = async () => {
    const token = localStorage.getItem('fva_user_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch {
      localStorage.removeItem('fva_user_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signIn = async (email: string, password: string) => {
    const { token, user: userProfile } = await loginUser(email, password);
    localStorage.setItem('fva_user_token', token);
    setUser(userProfile);
    closeAuthModal();
  };

  const signUp = async (username: string, email: string, password: string) => {
    const { token, user: userProfile } = await registerUser(username, email, password);
    localStorage.setItem('fva_user_token', token);
    setUser(userProfile);
    closeAuthModal();
  };

  const signOut = () => {
    localStorage.removeItem('fva_user_token');
    setUser(null);
  };

  const updateUserQuota = (generationsToday: number, maxDailyGenerations: number) => {
    if (user) {
      setUser({
        ...user,
        generationsToday,
        maxDailyGenerations,
        totalGenerations: user.totalGenerations + 1,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        updateUserQuota,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
