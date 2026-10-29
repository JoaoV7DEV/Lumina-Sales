'use client';

import React from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  Search,
  Clock,
  Menu,
  Database,
  UserRoundPlus,
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
  } = useLumina();

  const isDemo = state.settings.isDemoData;

  // Formata os segundos do cronômetro mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

      {/* Direita: Badge de Modo Ativo + Cronômetro + Botão Novo Lead */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

        {/* Botão + Novo Lead (Desktop: Completo | Mobile: Botão Dedicado Quadrado Arredondado com UserRoundPlus) */}
        <button
          onClick={openNewLeadModal}
          className="hidden sm:flex h-9 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#111622] hover:bg-[#18202e] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-sm transition-all items-center gap-1.5 shrink-0"
          title="Cadastrar novo lead"
        >
          <UserRoundPlus className="w-4 h-4 stroke-[2.2]" />
          <span>Novo lead</span>
        </button>

        {/* Versão Mobile: Botão Dedicado Quadrado Arredondado com Ícone UserRoundPlus (Touch-friendly 40px) */}
        <button
          onClick={openNewLeadModal}
          className="flex sm:hidden w-10 h-10 rounded-xl bg-[#111622] hover:bg-[#18202e] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-sm transition-all items-center justify-center shrink-0 active:scale-95"
          title="Cadastrar novo lead"
          aria-label="Cadastrar novo lead"
        >
          <UserRoundPlus className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
}
