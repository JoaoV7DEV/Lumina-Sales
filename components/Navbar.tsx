'use client';

import React from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Send,
  FlaskConical,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Search,
  Moon,
  Sun,
  Timer,
  Database,
} from 'lucide-react';

interface NavbarProps {
  onOpenTimerModal?: () => void;
}

export function Navbar({ onOpenTimerModal }: NavbarProps) {
  const {
    activeTab,
    setActiveTab,
    openNewLeadModal,
    setIsSearchOpen,
    state,
    timerActive,
    timerSeconds,
    toggleDemoData,
    theme,
    toggleTheme,
  } = useLumina();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, count: state.leads.length },
    { id: 'crm', label: 'CRM Funil', icon: Kanban },
    { id: 'prospecting', label: 'Prospecção & Scripts', icon: Send },
    { id: 'lab', label: 'Testes A/B', icon: FlaskConical },
    { id: 'financial', label: 'Vendas & Finanças', icon: DollarSign },
    { id: 'reports', label: 'Relatórios & Tarefas', icon: FileSpreadsheet },
  ];

  const formatTimerTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDarkMode = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Zona 1: Identidade da Marca Lumina */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46B] rounded-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A46B] to-[#9A743E] flex items-center justify-center shadow-md shadow-[#C9A46B]/20 group-hover:scale-105 transition-transform">
                <span className="text-slate-950 font-bold text-xl font-serif">L</span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  Lumina Sales
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#C9A46B]/15 text-[#9A743E] dark:text-[#C9A46B] border border-[#C9A46B]/30">
                    V1.2
                  </span>
                </span>
                <span className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Lumina Studio · Operação Comercial
                </span>
              </div>
            </button>
          </div>

          {/* Zona 2: Navegação Primária (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#C9A46B]/15 text-[#9A743E] dark:text-[#E6C387] border border-[#C9A46B]/40 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9A46B]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums font-semibold">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zona 3: Ações e Ferramentas Globais */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Busca Rápida ⌘K */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar contatos"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs"
              title="Buscar contatos (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              <span className="text-[11px] hidden md:inline text-slate-500 dark:text-slate-400">Buscar...</span>
              <kbd className="hidden xl:inline text-[9px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Cronômetro de Foco */}
            <button
              onClick={onOpenTimerModal}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border transition-all ${
                timerActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title="Cronômetro de prospecção focada"
            >
              <Timer className={`w-4 h-4 ${timerActive ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="tabular-nums font-mono text-xs font-medium">
                {formatTimerTime(timerSeconds)}
              </span>
            </button>

            {/* Alternador de Base (Demonstração vs Real) */}
            <button
              onClick={toggleDemoData}
              className={`px-2.5 py-2 text-xs rounded-lg border font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                state.settings.isDemoData
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title={
                state.settings.isDemoData
                  ? 'Modo Demonstração ativo. Clique para alternar para a base real limpa.'
                  : 'Modo Real ativo. Clique para recarregar dados de exemplo.'
              }
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{state.settings.isDemoData ? 'Dados Exemplo' : 'Base Real'}</span>
            </button>

            {/* Alternador de Tema Claro / Escuro */}
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema claro/escuro"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
              title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Botão de Cadastro de Lead */}
            <button
              onClick={openNewLeadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] active:scale-[0.98] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Cadastrar Lead</span>
            </button>
          </div>
        </div>

        {/* Sub-Navegação Mobile com rolagem suave */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2.5 gap-1.5 border-t border-slate-200 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#C9A46B]/20 text-[#9A743E] dark:text-[#E6C387] border border-[#C9A46B]/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
