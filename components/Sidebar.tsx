'use client';

import React from 'react';
import { useLumina } from '@/context/LuminaContext';
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
  Flame,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeTab, setActiveTab, state } = useLumina();

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

      {/* Container da Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0d111a] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Topo: Logo e Fechar Mobile */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E6C387] to-[#C9A46B] flex items-center justify-center text-slate-950 font-black text-lg font-serif shadow-md shadow-[#C9A46B]/20 group-hover:scale-105 transition-transform">
                L
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">Lumina</span>
                <span className="text-sm font-light text-slate-400">Sales</span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Navegação Principal */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white font-semibold shadow-xs border border-slate-700/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#C9A46B]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#C9A46B]/20 text-[#E6C387] font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Rodapé da Sidebar: Dados Locais / Status */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-white">Dados locais</span>
          </div>
          <p className="text-[11px] text-slate-400 pl-4">
            Salvos neste navegador (IndexedDB)
          </p>
        </div>
      </aside>
    </>
  );
}
