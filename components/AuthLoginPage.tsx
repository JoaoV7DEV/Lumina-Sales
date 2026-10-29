'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from '@/components/BrandLogo';
import { ShieldAlert, LogOut, ArrowRight, Loader2, Lock } from 'lucide-react';

export function AuthLoginPage() {
  const { user, loading, isAuthorized, authError, signInWithGoogle, logout, continueOffline } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#090d14] text-slate-900 dark:text-white transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#0f141f] border border-slate-200 dark:border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glow sutil de fundo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C9A46B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Logo Lumina */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <BrandLogo size="lg" showText={false} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
              Lumina Sales
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A46B] mt-0.5">
              Gestão Comercial e Operacional
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
              Plataforma administrativa privada com sincronização em nuvem e segurança de dados.
            </p>
          </div>

          {/* Estado 1: Usuário logado mas NÃO autorizado */}
          {user && !isAuthorized && (
            <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left space-y-2 mt-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Acesso Não Autorizado</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                A conta <strong className="text-slate-900 dark:text-white">{user.email}</strong> não tem permissão para acessar este banco comercial privado.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da conta</span>
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="text-xs text-[#C9A46B] hover:underline font-semibold"
                >
                  Entrar com outra conta
                </button>
              </div>
            </div>
          )}

          {/* Erro de Autenticação */}
          {authError && !user && (
            <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs text-left">
              {authError}
            </div>
          )}

          {/* Botão Entrar com Google */}
          {!user && (
            <div className="w-full pt-4 space-y-3">
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full h-12 rounded-2xl font-bold text-sm bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#C9A46B]" />
                ) : (
                  <>
                    {/* SVG Oficial Google */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3" />
                <span>Acesso restrito ao proprietário da Lumina Studio</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={continueOffline}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                >
                  <span>Continuar com dados locais neste dispositivo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
