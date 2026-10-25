'use client';

import React from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  Search,
  Clock,
  Sun,
  Moon,
  Plus,
  Menu,
  Database,
  Flame,
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
    toggleTheme,
    toggleDemoData,
    timerActive,
    timerSeconds,
  } = useLumina();

  const isDark = state.settings.theme === 'dark';

  // Formata os segundos do cronômetro mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#0d111a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Botão Hamburger (Mobile) + Barra de Busca Ampla */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Input de Busca Largo e Agradável */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative flex-1 cursor-pointer group"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 group-hover:text-[#C9A46B] transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Buscar contato por nome, Instagram ou telefone..."
            className="w-full h-10 bg-slate-100 dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-14 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 cursor-pointer focus:outline-none group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors"
          />
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
            <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Ações da Direita: Base Real/Exemplo, Cronômetro, Tema, + Novo Lead */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Switch Duplo: Base real vs Exemplo */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#161b26] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              if (state.settings.isDemoData) toggleDemoData();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !state.settings.isDemoData
                ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Base real
          </button>
          <button
            onClick={() => {
              if (!state.settings.isDemoData) toggleDemoData();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              state.settings.isDemoData
                ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Exemplo
          </button>
        </div>

        {/* Cronômetro de Foco / Tempo */}
        <button
          onClick={onOpenTimerModal}
          className={`h-9 px-3 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
            timerActive
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-[#161b26] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Cronômetro de produtividade e sessão de prospecção"
        >
          <Clock className={`w-3.5 h-3.5 ${timerActive ? 'animate-pulse text-amber-500' : ''}`} />
          <span className="tabular-nums">{formatTimer(timerSeconds)}</span>
        </button>

        {/* Botão de Alternância de Tema Claro / Escuro */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#C9A46B]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Botão + Novo Lead */}
        <button
          onClick={openNewLeadModal}
          className="h-9 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#111622] hover:bg-[#18202e] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo lead</span>
        </button>
      </div>
    </header>
  );
}
