'use client';

import React, { useState } from 'react';
import { LuminaProvider, useLumina } from '@/context/LuminaContext';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { LeadDrawerModal } from '@/components/LeadDrawerModal';
import { ProductivityTimerModal } from '@/components/ProductivityTimerModal';
import { DashboardView } from '@/components/views/DashboardView';
import { LeadsView } from '@/components/views/LeadsView';
import { CrmKanbanView } from '@/components/views/CrmKanbanView';
import { ProspectingView } from '@/components/views/ProspectingView';
import { CommercialLabView } from '@/components/views/CommercialLabView';
import { FinancialView } from '@/components/views/FinancialView';
import { ReportsAndTasksView } from '@/components/views/ReportsAndTasksView';
import { CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

function AppContent() {
  const { activeTab, loading, toastMessage, state, updateSettings } = useLumina();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  const isSidebarCollapsed = Boolean(state.settings?.sidebarCollapsed);

  const handleToggleSidebarCollapse = () => {
    updateSettings({ sidebarCollapsed: !isSidebarCollapsed });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d111a] flex flex-col items-center justify-center p-4">
        <BrandLogo size="lg" showText={false} className="animate-pulse" />
        <p className="text-base font-semibold text-white mt-4 tracking-wide">
          Carregando Lumina Sales...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Inicializando banco local IndexedDB e configurações
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 transition-colors selection:bg-[#C9A46B]/30 selection:text-white">
      {/* Menu Lateral na Esquerda (Sidebar Desktop Recolhível & Drawer Mobile) */}
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* Conteúdo Principal com TopHeader e Views */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Barra Superior Ampla e Elegante */}
        <TopHeader
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenTimerModal={() => setIsTimerModalOpen(true)}
        />

        {/* Visualização da Aba Ativa */}
        <main className="flex-1 w-full max-w-[1580px] mx-auto p-3.5 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'crm' && <CrmKanbanView />}
          {(activeTab === 'prospecting' || activeTab === 'scripts' || activeTab === 'creatives') && (
            <ProspectingView />
          )}
          {activeTab === 'lab' && <CommercialLabView />}
          {activeTab === 'financial' && <FinancialView />}
          {(activeTab === 'reports' || activeTab === 'settings') && <ReportsAndTasksView />}
        </main>
      </div>

      {/* Modais Globais e Drawers */}
      <LeadDrawerModal />
      <GlobalSearchModal />
      <ProductivityTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />

      {/* Notificação Toast Elegante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-[#171E2C] text-slate-900 dark:text-white px-4 py-3 rounded-xl border border-slate-200 dark:border-[#C9A46B]/40 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export function LuminaApp() {
  return (
    <LuminaProvider>
      <AppContent />
    </LuminaProvider>
  );
}
export default LuminaApp;
