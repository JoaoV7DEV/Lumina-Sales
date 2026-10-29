'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { syncAccountOwner } from '@/lib/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  isOfflineGuest: boolean;
  authorizedEmail: string;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  continueOffline: () => void;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// E-mail padrão configurado para o proprietário da Lumina Studio
const DEFAULT_OWNER_EMAIL = (
  process.env.NEXT_PUBLIC_AUTHORIZED_OWNER_EMAIL || 'joaoincrivel.7000@gmail.com'
).toLowerCase().trim();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isOfflineGuest, setIsOfflineGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const continueOffline = useCallback(() => {
    setIsOfflineGuest(true);
  }, []);

  // Validação de Autorização por UID ou E-mail da Conta Proprietária
  const verifyAuthorization = useCallback((currentUser: User | null): boolean => {
    if (!currentUser) return false;

    const userEmail = (currentUser.email || '').toLowerCase().trim();

    // 1. Verificar se coincide com o e-mail oficial do proprietário
    if (userEmail === DEFAULT_OWNER_EMAIL) {
      return true;
    }

    // 2. Verificar se o UID foi previamente autenticado como proprietário no armazenamento local
    if (typeof window !== 'undefined') {
      const storedOwnerUid = localStorage.getItem('lumina_authorized_owner_uid');
      if (storedOwnerUid && storedOwnerUid === currentUser.uid) {
        return true;
      }
    }

    // Se nenhuma regra for correspondida, o acesso aos dados comerciais privados é negado por padrão
    return false;
  }, []);

  // Monitorar estado da autenticação Firebase
  useEffect(() => {
    // Verificar resultado de redirecionamento (caso o navegador bloqueie popup no mobile)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const authOk = verifyAuthorization(result.user);
          if (authOk) {
            await syncAccountOwner(result.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('lumina_authorized_owner_uid', result.user.uid);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Erro ao processar redirecionamento de login:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const authorized = verifyAuthorization(currentUser);
        setIsAuthorized(authorized);

        if (authorized) {
          try {
            await syncAccountOwner(currentUser);
            if (typeof window !== 'undefined') {
              localStorage.setItem('lumina_authorized_owner_uid', currentUser.uid);
            }
          } catch (syncErr) {
            console.warn('Aviso ao sincronizar perfil do proprietário:', syncErr);
          }
        } else {
          setAuthError(
            `A conta ${currentUser.email} não está autorizada como proprietária do Lumina Sales.`
          );
        }
      } else {
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [verifyAuthorization]);

  // Login com Google
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setLoading(true);

    try {
      // Tenta popup primeiro
      const result = await signInWithPopup(auth, googleProvider);
      const authorized = verifyAuthorization(result.user);
      setIsAuthorized(authorized);

      if (authorized) {
        await syncAccountOwner(result.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lumina_authorized_owner_uid', result.user.uid);
        }
      } else {
        setAuthError(
          `Acesso não autorizado: ${result.user.email} não possui permissão para acessar este banco comercial.`
        );
      }
    } catch (error: any) {
      console.warn('Falha no popup de login, tentando redirecionamento:', error);
      // Se popup for bloqueado pelo navegador (especialmente no Safari iOS ou Chrome Android), tenta redirect
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError: any) {
          setAuthError(`Erro ao autenticar: ${redirectError.message}`);
        }
      } else {
        setAuthError(`Erro ao conectar com Google: ${error.message || 'Tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [verifyAuthorization]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAuthorized(false);
      setAuthError(null);
    } catch (err: any) {
      console.error('Erro ao sair da conta:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthorized,
        isOfflineGuest,
        authorizedEmail: DEFAULT_OWNER_EMAIL,
        authError,
        signInWithGoogle,
        logout,
        continueOffline,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
