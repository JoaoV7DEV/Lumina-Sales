'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLumina } from '@/context/LuminaContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Clock,
  Menu,
  Database,
  UserRoundPlus,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Sliders,
  ChevronDown,
  LogIn,
} from 'lucide-react';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenTimerModal: () => void;
}

export function TopHeader({ onOpenMobileSidebar, onOpenTimerModal }: TopHeaderProps) {
  const {
    state,
    openNewLeadModal,
    setIsSearchOpen,
    timerActive,
    timerSeconds,
    syncStatus,
    openMigrationModal,
    refreshCloudSync,
  } = useLumina();

  const { user, isAuthorized, isOfflineGuest, signInWithGoogle, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDemo = state.settings.isDemoData;

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formata os segundos do cronômetro mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSyncBadge = () => {
    if (user && isAuthorized) {
      if (syncStatus === 'syncing') {
        return (
          <button
            onClick={openMigrationModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-500 transition-all hover:bg-amber-500/20"
            title="Sincronizando com Firestore em tempo real"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden xl:inline">Sincronizando...</span>
          </button>
        );
      }
      if (syncStatus === 'offline') {
        return (
          <button
            onClick={openMigrationModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400 transition-all hover:bg-slate-500/20"
            title="Firestore offline temporariamente. Operando com dados locais."
          >
            <CloudOff className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline">Offline (Local)</span>
          </button>
        );
      }
      return (
        <button
          onClick={openMigrationModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/20"
          title="Nuvem ativa e sincronizada com Cloud Firestore. Clique para gerenciar migração."
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cloud className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden xl:inline">Nuvem ativa</span>
        </button>
      );
    }

    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/20"
        title="Modo local. Clique para conectar sua conta Google e ativar sincronização na nuvem."
      >
        <CloudOff className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Conectar Nuvem</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0d111a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 transition-colors">
      {/* Esquerda: Botão Menu (Mobile) + Barra de Busca Ampla */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-2xl min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0"
          title="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Input de Busca Largo e Agradável */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative flex-1 cursor-pointer group min-w-0"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 group-hover:text-[#C9A46B] transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Buscar contato por nome, Instagram ou telefone..."
            className="w-full h-10 bg-slate-100 dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-12 sm:pr-14 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 cursor-pointer focus:outline-none group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors truncate"
          />
          <div className="absolute right-2.5 top-2.5 hidden sm:flex items-center gap-1">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Direita: Status Nuvem + Modo Ativo + Cronômetro + Botão Novo Lead + Menu Usuário */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Badge Cloud Sync */}
        <div className="hidden md:flex">{getSyncBadge()}</div>

        {/* Badge Sutil de Modo Ativo (Base real vs Exemplo) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all">
          <Database className="w-3.5 h-3.5" />
          {isDemo ? (
            <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Modo Exemplo
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Base real
            </span>
          )}
        </div>

        {/* Cronômetro de Foco / Tempo */}
        <button
          onClick={onOpenTimerModal}
          className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 sm:gap-2 transition-all ${
            timerActive
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-[#161b26] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Cronômetro de produtividade e sessão de prospecção"
        >
          <Clock className={`w-3.5 h-3.5 ${timerActive ? 'animate-pulse text-amber-500' : ''}`} />
          <span className="tabular-nums">{formatTimer(timerSeconds)}</span>
        </button>

        {/* Botão + Novo Lead (Desktop) */}
        <button
          onClick={openNewLeadModal}
          className="hidden sm:flex h-9 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#111622] hover:bg-[#18202e] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-sm transition-all items-center gap-1.5 shrink-0"
          title="Cadastrar novo lead"
        >
          <UserRoundPlus className="w-4 h-4 stroke-[2.2]" />
          <span>Novo lead</span>
        </button>

        {/* Versão Mobile: Botão Quadrado Touch-friendly */}
        <button
          onClick={openNewLeadModal}
          className="flex sm:hidden w-9 h-9 rounded-xl bg-[#111622] hover:bg-[#18202e] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-sm transition-all items-center justify-center shrink-0 active:scale-95"
          title="Cadastrar novo lead"
          aria-label="Cadastrar novo lead"
        >
          <UserRoundPlus className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Menu do Usuário & Sincronização */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            title="Conta e Sincronização em Nuvem"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt="Foto do perfil"
                className="w-8 h-8 rounded-full border border-[#C9A46B]/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1e2738] border border-[#C9A46B]/40 flex items-center justify-center text-xs font-bold text-[#E6C387]">
                {user?.displayName ? user.displayName[0].toUpperCase() : 'L'}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {isAccountMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                <p className="text-xs font-bold truncate">
                  {user?.displayName || 'Proprietário Lumina'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'Modo Local (Offline)'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{user ? 'Cloud Firestore Ativo' : 'Armazenamento Local'}</span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    openMigrationModal();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <Sliders className="w-4 h-4 text-[#C9A46B]" />
                  <span>Sincronização & Migração</span>
                </button>

                {user && (
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      refreshCloudSync();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-500" />
                    <span>Recarregar da Nuvem</span>
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {user ? (
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 text-left flex items-center gap-2.5 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da conta</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      signInWithGoogle();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#C9A46B] text-left flex items-center gap-2.5 hover:bg-[#C9A46B]/10 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Entrar com Google</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default TopHeader;
