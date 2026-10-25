import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserProfile } from '../services/authService';
import { storageAdapter } from '../services/storageAdapter';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(authService.getCachedUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  const refreshUser = async () => {
    try {
      const u = await authService.fetchCurrentUser();
      setUser(u);
      if (u) {
        // Sync local saved properties with user account
        const localSaved = storageAdapter.getSavedPropertyIds();
        if (localSaved.length > 0) {
          const synced = await authService.syncSavedProperties(localSaved);
          synced.forEach((id) => storageAdapter.savePropertyId(id));
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthChange = () => {
      setUser(authService.getCachedUser());
    };

    window.addEventListener('ast_xgb_auth_change', handleAuthChange);
    return () => window.removeEventListener('ast_xgb_auth_change', handleAuthChange);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    setUser(res.user);
    setIsAuthModalOpen(false);

    // Sync saved items
    const localSaved = storageAdapter.getSavedPropertyIds();
    if (localSaved.length > 0) {
      await authService.syncSavedProperties(localSaved);
    }
  };

  const signup = async (data: { email: string; password: string; name: string; phone?: string; role?: string }) => {
    const res = await authService.signup(data);
    setUser(res.user);
    setIsAuthModalOpen(false);

    // Sync saved items
    const localSaved = storageAdapter.getSavedPropertyIds();
    if (localSaved.length > 0) {
      await authService.syncSavedProperties(localSaved);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
  };

  const openAuthModal = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        login,
        signup,
        logout,
        updateProfile,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
