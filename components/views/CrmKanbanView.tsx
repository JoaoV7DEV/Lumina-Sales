'use client';

import React, { useState, useMemo } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  Kanban,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Eye,
  Filter,
  ShieldAlert,
  Archive,
  Sparkles,
  Phone,
  Instagram,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { Lead, LeadStatus, FunnelPhaseGroup } from '@/lib/types';
import {
  FUNNEL_STAGES,
  FUNNEL_PHASE_GROUPS,
  EXCLUSION_STATUSES,
  formatDateTimeBR,
  normalizePhoneDisplay,
  buildWhatsAppUrl,
  buildInstagramUrl,
  getLeadStatusBadgeClass,
} from '@/lib/formatters';
import { OFFICIAL_NICHES } from '@/lib/seed-data';

export function CrmKanbanView() {
  const { state, openEditLeadModal, openNewLeadModal, updateLeadStatus } = useLumina();
  const [selectedNiche, setSelectedNiche] = useState('ALL');
  const [activePhaseTab, setActivePhaseTab] = useState<FunnelPhaseGroup | 'all'>('prospeccao');
  const [activeExclusionTab, setActiveExclusionTab] = useState<LeadStatus | null>(null);

  // Filtrar leads por nicho
  const visibleLeads = useMemo(() => {
    return state.leads.filter((l) => {
      if (selectedNiche !== 'ALL' && l.niche !== selectedNiche) {
        return false;
      }
      return true;
    });
  }, [state.leads, selectedNiche]);

  // Colunas ativas no Kanban baseado na aba de fase selecionada
  const activeColumns = useMemo(() => {
    if (activePhaseTab === 'all') {
      return FUNNEL_STAGES;
    }
    const group = FUNNEL_PHASE_GROUPS.find((g) => g.id === activePhaseTab);
    if (!group) return FUNNEL_STAGES;
    return FUNNEL_STAGES.filter((s) => group.stageIds.includes(s.id));
  }, [activePhaseTab]);

  // Leads em estados de exclusão
  const exclusionLeads = useMemo(() => {
    if (!activeExclusionTab) return [];
    return visibleLeads.filter((l) => l.status === activeExclusionTab);
  }, [visibleLeads, activeExclusionTab]);

  // Avançar ou recuar lead no funil
  const moveLead = (lead: Lead, direction: 'next' | 'prev') => {
    const currentIndex = FUNNEL_STAGES.findIndex((c) => c.id === lead.status);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < FUNNEL_STAGES.length - 1) {
      const nextStage = FUNNEL_STAGES[currentIndex + 1];
      updateLeadStatus(lead.id, nextStage.id, `Avançado para ${nextStage.label}`);
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevStage = FUNNEL_STAGES[currentIndex - 1];
      updateLeadStatus(lead.id, prevStage.id, `Retornado para ${prevStage.label}`);
    }
  };

  // Drag-and-drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      updateLeadStatus(leadId, targetStatus, `Movido via arrasto no Kanban`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2.5">
            <Kanban className="w-7 h-7 text-[#C9A46B]" />
            <span>CRM Comercial · Funil 14 Etapas</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe a jornada completa: da prospecção e referências à produção de fotos, prévia, pagamento e pós-venda
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro por Nicho */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#151922] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Todos os Nichos ({visibleLeads.length})</option>
              {OFFICIAL_NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openNewLeadModal}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas das Fases do Funil */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {FUNNEL_PHASE_GROUPS.map((group) => {
            const count = visibleLeads.filter((l) => group.stageIds.includes(l.status)).length;
            const isActive = activePhaseTab === group.id && !activeExclusionTab;
            return (
              <button
                key={group.id}
                onClick={() => {
                  setActivePhaseTab(group.id);
                  setActiveExclusionTab(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#C9A46B] text-slate-950 font-bold shadow-md'
                    : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{group.title}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setActivePhaseTab('all');
              setActiveExclusionTab(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              activePhaseTab === 'all' && !activeExclusionTab
                ? 'bg-[#C9A46B] text-slate-950 font-bold shadow-md'
                : 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas as 14 Etapas</span>
          </button>
        </div>

        {/* Abas Secundárias de Exclusão */}
        <div className="flex items-center gap-1.5 pt-2 sm:pt-0">
          {EXCLUSION_STATUSES.map((excl) => {
            const count = visibleLeads.filter((l) => l.status === excl.id).length;
            const isExclActive = activeExclusionTab === excl.id;
            return (
              <button
                key={excl.id}
                onClick={() => setActiveExclusionTab(isExclActive ? null : excl.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                  isExclActive
                    ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{excl.label}</span>
                {count > 0 && <span className="text-[10px] tabular-nums font-bold">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção de Leads em Exclusão / Arquivo Selecionada */}
      {activeExclusionTab && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-400" />
              <span>Contatos com status &quot;{EXCLUSION_STATUSES.find((e) => e.id === activeExclusionTab)?.label}&quot;</span>
            </h3>
            <button
              onClick={() => setActiveExclusionTab(null)}
              className="text-xs text-[#9A743E] dark:text-[#C9A46B] hover:underline"
            >
              Voltar ao Funil Ativo
            </button>
          </div>

          {exclusionLeads.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">Nenhum contato nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {exclusionLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{lead.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {lead.niche}
                    </span>
                  </div>
                  {lead.notes && <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{lead.notes}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => openEditLeadModal(lead.id)}
                      className="text-[#9A743E] dark:text-[#C9A46B] font-medium hover:underline"
                    >
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => updateLeadStatus(lead.id, 'novo_lead', 'Reativado para o funil')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                      Reativar Lead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grade do Funil Kanban Principal */}
      {!activeExclusionTab && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start scrollbar-thin">
          {activeColumns.map((col) => {
            const columnLeads = visibleLeads.filter((l) => l.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="w-80 shrink-0 bg-slate-100/70 dark:bg-[#151922] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-col min-h-[500px] shadow-sm transition-colors"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C9A46B]" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {col.order}. {col.label}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold tabular-nums border border-slate-200 dark:border-slate-700">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Lista de Cartões de Leads */}
                <div className="space-y-3 flex-1">
                  {columnLeads.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Nenhum lead nesta etapa</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">Arraste um cartão para cá</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-3"
                      >
                        {/* Nome e Ações Rápidas */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              onClick={() => openEditLeadModal(lead.id)}
                              className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#C9A46B] text-left transition-colors"
                            >
                              {lead.name}
                            </button>
                            {lead.businessName && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {lead.businessName}
                              </p>
                            )}
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium shrink-0">
                            {lead.niche}
                          </span>
                        </div>

                        {/* Metadados de Contato & Oportunidades */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {lead.whatsapp && (
                            <a
                              href={buildWhatsAppUrl(lead.whatsapp)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[11px]">{normalizePhoneDisplay(lead.whatsapp)}</span>
                            </a>
                          )}

                          {lead.instagram && (
                            <a
                              href={buildInstagramUrl(lead.instagram)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 hover:text-pink-500 transition-colors"
                              title="Abrir Instagram"
                            >
                              <Instagram className="w-3.5 h-3.5 text-pink-500" />
                              <span className="text-[11px]">{lead.instagram}</span>
                            </a>
                          )}
                        </div>

                        {/* Tags e Oportunidades */}
                        {lead.opportunities && Object.values(lead.opportunities).filter(Boolean).length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#9A743E] dark:text-[#C9A46B]">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{Object.values(lead.opportunities).filter(Boolean).length} oportunidades na bio/site</span>
                          </div>
                        )}

                        {lead.nextAction && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Ação:</span> {lead.nextAction}
                          </div>
                        )}

                        {/* Barra de Movimentação do Cartão */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <button
                            onClick={() => moveLead(lead, 'prev')}
                            disabled={col.order === 1}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Recuar etapa"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditLeadModal(lead.id)}
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#C9A46B] transition-colors"
                          >
                            Abrir Ficha
                          </button>

                          <button
                            onClick={() => moveLead(lead, 'next')}
                            disabled={col.order === FUNNEL_STAGES.length}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Avançar etapa"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
