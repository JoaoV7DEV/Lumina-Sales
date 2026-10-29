'use client';

import React from 'react';
import { useLumina } from '@/context/LuminaContext';
import { BrandLogo } from '@/components/BrandLogo';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Send,
  FileText,
  Image as ImageIcon,
  FlaskConical,
  DollarSign,
  BarChart3,
  Settings,
  X,
  Database,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { activeTab, setActiveTab, state, toggleTheme, toggleDemoData, openMigrationModal, syncStatus } = useLumina();
  const { user, isAuthorized } = useAuth();

  const isDark = state.settings.theme === 'dark';
  const isDemo = state.settings.isDemoData;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, badge: state.leads.length },
    { id: 'crm', label: 'CRM', icon: Kanban },
    { id: 'prospecting', label: 'Atendimento', icon: Send },
    { id: 'scripts', label: 'Scripts', icon: FileText, badge: state.scripts.length },
    { id: 'creatives', label: 'Criativos', icon: ImageIcon, badge: state.creatives.length },
    { id: 'lab', label: 'Testes A/B', icon: FlaskConical },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Container da Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-[#0d111a] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 select-none ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed && !mobileOpen ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Topo: Logo & Botão de Recolher/Fechar */}
        <div className={`p-4 ${isCollapsed && !mobileOpen ? 'px-2 flex flex-col items-center gap-3' : 'px-5'} pb-3 border-b border-slate-800/60`}>
          {isCollapsed && !mobileOpen ? (
            <>
              <div
                onClick={() => handleSelectTab('dashboard')}
                className="cursor-pointer group flex items-center justify-center"
                title="Lumina Sales - Início"
              >
                <BrandLogo size="md" showText={false} />
              </div>
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Expandir menu lateral"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#C9A46B]" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => handleSelectTab('dashboard')}
                className="cursor-pointer group flex items-center min-w-0"
                title="Lumina Sales - Início"
              >
                <BrandLogo size="md" showText={true} />
              </div>

              {/* Botão de Fechar no Mobile */}
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
                title="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Botão de Recolher no Desktop */}
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title="Recolher menu lateral"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Navegação Principal */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isItemCollapsed = isCollapsed && !mobileOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={isItemCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isItemCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                } py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-slate-800/95 text-white font-semibold shadow-xs border border-slate-700/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className={`flex items-center ${isItemCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#C9A46B]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isItemCollapsed && <span>{item.label}</span>}
                </div>

                {/* Badge de Contagem */}
                {item.badge !== undefined && item.badge > 0 && (
                  isItemCollapsed ? (
                    <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#C9A46B]" />
                  ) : (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#C9A46B]/20 text-[#E6C387] font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Rodapé da Sidebar: Switchers de Base e Tema + Status */}
        <div className="p-3 border-t border-slate-800/80 space-y-3">
          {/* Seletor de Base Real vs Demonstração */}
          {(!isCollapsed || mobileOpen) ? (
            <div className="bg-[#141923] p-1 rounded-xl border border-slate-800/80 flex items-center">
              <button
                onClick={() => {
                  if (isDemo) toggleDemoData();
                }}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                  !isDemo
                    ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Base real
              </button>
              <button
                onClick={() => {
                  if (!isDemo) toggleDemoData();
                }}
                className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                  isDemo
                    ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Exemplo
              </button>
            </div>
          ) : (
            <button
              onClick={toggleDemoData}
              className={`w-full h-9 rounded-xl flex items-center justify-center border transition-all ${
                isDemo
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
              title={isDemo ? 'Modo Exemplo ativo (clique para alternar para Base real)' : 'Base real ativa (clique para alternar para Exemplo)'}
            >
              <Database className="w-4 h-4" />
            </button>
          )}

          {/* Alternância de Tema Claro / Escuro */}
          {(!isCollapsed || mobileOpen) ? (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors border border-slate-700/40"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Moon className="w-4 h-4 text-[#C9A46B]" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span>{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>
          ) : (
            <button
              onClick={toggleTheme}
              className="w-full h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-[#C9A46B]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Status dos Dados e Sincronização */}
          {(!isCollapsed || mobileOpen) ? (
            <div
              onClick={openMigrationModal}
              className="px-2 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-colors cursor-pointer group"
              title="Clique para abrir Central de Sincronização e Migração"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-white group-hover:text-[#E6C387] transition-colors">
                  {user && isAuthorized ? 'Cloud Sync Ativo' : 'Dados Locais'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 pl-4 mt-0.5">
                {user && isAuthorized
                  ? (syncStatus === 'syncing' ? 'Sincronizando Firestore...' : 'Firestore + IndexedDB')
                  : 'Salvos no navegador (IndexedDB)'}
              </p>
            </div>
          ) : (
            <div
              onClick={openMigrationModal}
              className="flex justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title={user && isAuthorized ? 'Cloud Sync Ativo (Firestore + IndexedDB)' : 'Dados locais (IndexedDB)'}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
