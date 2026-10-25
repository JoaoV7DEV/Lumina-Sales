'use client';

import React, { useState, useMemo } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Instagram,
  Phone,
  Eye,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Lead, LeadStatus, LeadPriority } from '@/lib/types';
import {
  formatDateBR,
  normalizePhoneDisplay,
  buildInstagramUrl,
  buildWhatsAppUrl,
  cleanDigits,
  normalizeInstagramHandle,
  FUNNEL_STAGES,
  EXCLUSION_STATUSES,
  getLeadStatusLabel,
  getLeadStatusBadgeClass,
} from '@/lib/formatters';

const PRIORITY_MAP: Record<LeadPriority, { label: string; text: string; bg: string }> = {
  low: { label: 'Baixa', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  medium: { label: 'Média', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  high: { label: 'Alta', text: 'text-rose-600 dark:text-rose-400 font-bold', bg: 'bg-rose-50 dark:bg-rose-900/30' },
};

export function LeadsView() {
  const {
    state,
    openNewLeadModal,
    openEditLeadModal,
    deleteLead,
    updateLeadStatus,
    exportCsv,
    addLead,
    showToast,
  } = useLumina();

  // Filter and search states
  const [search, setSearch] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'priority'>('createdAt');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CSV Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copiado para a área de transferência!');
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    return state.leads.filter((lead) => {
      // Search text
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const nameMatch = lead.name.toLowerCase().includes(query);
        const bizMatch = (lead.businessName || '').toLowerCase().includes(query);
        const igMatch = (lead.instagram || '').toLowerCase().includes(query);
        const phoneMatch = (lead.whatsapp || '').includes(query);
        const cityMatch = (lead.cityState || '').toLowerCase().includes(query);
        if (!nameMatch && !bizMatch && !igMatch && !phoneMatch && !cityMatch) {
          return false;
        }
      }

      // Niche
      if (selectedNiche !== 'ALL' && lead.niche !== selectedNiche) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && lead.status !== selectedStatus) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'ALL' && lead.priority !== selectedPriority) {
        return false;
      }

      // Source
      if (selectedSource !== 'ALL' && lead.source !== selectedSource) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priority') {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [state.leads, search, selectedNiche, selectedStatus, selectedPriority, selectedSource, sortBy]);

  // Bulk selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (status: LeadStatus) => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      updateLeadStatus(id, status, 'Atualização de etapa em lote');
    });
    showToast(`${selectedIds.length} lead(s) movidos para "${getLeadStatusLabel(status)}".`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    selectedIds.forEach((id) => deleteLead(id));
    setSelectedIds([]);
    showToast(`${count} lead(s) excluído(s).`);
  };

  // CSV Import handler
  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    try {
      const lines = csvText.trim().split('\n');
      let count = 0;
      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('nome') || line.toLowerCase().includes('nicho'))) {
          return;
        }
        const delimiter = line.includes(';') ? ';' : ',';
        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 2 && cols[0]) {
          addLead({
            name: cols[0],
            niche: cols[1] || 'Empresários e executivos',
            instagram: normalizeInstagramHandle(cols[2] || ''),
            whatsapp: cleanDigits(cols[3] || '') || undefined,
            cityState: cols[4] || undefined,
            source: 'Importação CSV',
            status: 'novo_lead',
            priority: 'medium',
            notes: cols[5] || 'Importado via CSV.',
            opportunities: {
              noProfessionalPhotos: false,
              limitedPhotos: false,
              noBioLink: false,
              poorBioLink: false,
              noWebsite: false,
              poorWebsite: false,
              needsBranding: false,
              complementaryServices: false,
            },
          });
          count++;
        }
      });

      showToast(`${count} contato(s) importado(s) com sucesso!`);
      setCsvText('');
      setIsImportModalOpen(false);
    } catch {
      showToast('Erro ao processar CSV. Verifique a formatação do arquivo.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-3">
            <Users className="w-7 h-7 text-[#C9A46B]" />
            <span>Base Geral de Leads</span>
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              · {filteredLeads.length} de {state.leads.length} contato(s)
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gerenciamento completo, qualificação rápida e histórico de contatos da Lumina Studio
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            title="Importar contatos de arquivo CSV"
          >
            <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={exportCsv}
            className="h-10 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            title="Exportar base completa para planilha CSV"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={openNewLeadModal}
            className="h-10 px-5 text-sm font-bold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] active:scale-[0.98] rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#151922] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, empresa, @instagram, telefone..."
              className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-12 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C9A46B] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white absolute right-3.5 top-3 font-medium"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Niche Filter */}
          <div>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#C9A46B]"
            >
              <option value="ALL">Todos os 13 Nichos</option>
              {state.settings.customNiches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (14 stages + exclusions) */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#C9A46B]"
            >
              <option value="ALL">Todas as 14 Etapas</option>
              <optgroup label="Etapas do Processo">
                {FUNNEL_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.order}. {s.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Situações Especiais">
                {EXCLUSION_STATUSES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#C9A46B]"
            >
              <option value="ALL">Todas as Prioridades</option>
              <option value="high">Alta Prioridade</option>
              <option value="medium">Média Prioridade</option>
              <option value="low">Baixa Prioridade</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip if selection exists */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-[#1B2332] rounded-xl border border-[#C9A46B]/50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-[#E6C387]">
              <span className="font-bold text-sm">{selectedIds.length}</span> lead(s) selecionado(s)
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-600 dark:text-slate-300 hidden sm:inline">Mover etapa:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as LeadStatus);
                    e.target.value = '';
                  }
                }}
                className="h-9 bg-white dark:bg-[#111620] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 text-xs text-slate-800 dark:text-white"
                defaultValue=""
              >
                <option value="" disabled>
                  Alterar etapa em lote...
                </option>
                {FUNNEL_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.order}. {s.label}
                  </option>
                ))}
                {EXCLUSION_STATUSES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkDelete}
                className="h-9 px-3 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-300 dark:border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Excluir selecionados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-[#18202E] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.length > 0 && selectedIds.length === filteredLeads.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-[#C9A46B] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 text-slate-900 dark:text-white font-bold">Contato & Profissão</th>
                <th className="py-3.5 px-4">Nicho</th>
                <th className="py-3.5 px-4">WhatsApp & Instagram</th>
                <th className="py-3.5 px-4">Etapa do Funil (14 Etapas)</th>
                <th className="py-3.5 px-4">Prioridade</th>
                <th className="py-3.5 px-4">Oportunidades</th>
                <th className="py-3.5 px-4">Próximo Retorno</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                      Nenhum contato encontrado com os filtros aplicados.
                    </p>
                    <button
                      onClick={openNewLeadModal}
                      className="mt-4 px-5 py-2.5 text-xs font-bold bg-[#C9A46B] text-slate-950 rounded-xl hover:bg-[#D8B47E] shadow-sm transition-all"
                    >
                      Cadastrar Novo Lead
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const priorityInfo = PRIORITY_MAP[lead.priority] || PRIORITY_MAP.medium;
                  const oppCount = Object.values(lead.opportunities || {}).filter(Boolean).length;
                  const statusLabel = getLeadStatusLabel(lead.status);
                  const statusBadgeClass = getLeadStatusBadgeClass(lead.status);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50 dark:hover:bg-[#1A2230] transition-colors ${
                        isSelected ? 'bg-amber-50/40 dark:bg-[#C9A46B]/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="rounded text-[#C9A46B] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Name & Business */}
                      <td className="py-3.5 px-4 font-medium">
                        <div
                          onClick={() => openEditLeadModal(lead.id)}
                          className="cursor-pointer group"
                        >
                          <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#9A743E] dark:group-hover:text-[#C9A46B] transition-colors">
                            {lead.name}
                          </div>
                          {lead.businessName && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                              {lead.businessName}
                            </div>
                          )}
                          {lead.cityState && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              {lead.cityState}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Niche */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {lead.niche}
                        </span>
                        <div className="text-[10px] text-slate-400">{lead.source}</div>
                      </td>

                      {/* Contact Channels */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5">
                          {lead.whatsapp ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <a
                                href={buildWhatsAppUrl(lead.whatsapp)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1.5 tabular-nums"
                                title="Abrir conversa no WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{normalizePhoneDisplay(lead.whatsapp)}</span>
                              </a>
                              <button
                                onClick={() => copyToClipboard(lead.whatsapp || '', `${lead.id}-wa`)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                title="Copiar telefone"
                              >
                                {copiedId === `${lead.id}-wa` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : null}

                          {lead.instagram ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <a
                                href={buildInstagramUrl(lead.instagram)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-700 dark:text-slate-300 hover:text-[#9A743E] dark:hover:text-[#C9A46B] flex items-center gap-1.5 truncate max-w-[140px]"
                                title="Abrir perfil no Instagram"
                              >
                                <Instagram className="w-3.5 h-3.5 text-[#C9A46B] shrink-0" />
                                <span className="truncate">{lead.instagram}</span>
                              </a>
                              <button
                                onClick={() => copyToClipboard(lead.instagram, `${lead.id}-ig`)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                title="Copiar usuário"
                              >
                                {copiedId === `${lead.id}-ig` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            !lead.whatsapp && <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>

                      {/* Status / Funnel Stage */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${priorityInfo.bg} ${priorityInfo.text}`}>
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Opportunities */}
                      <td className="py-3.5 px-4">
                        {oppCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#C9A46B]/15 text-[#9A743E] dark:text-[#E6C387] border border-[#C9A46B]/30"
                            title="Oportunidades identificadas para abordagem"
                          >
                            <Sparkles className="w-3 h-3 text-[#C9A46B]" />
                            {oppCount} ponto(s)
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Next Return / Action */}
                      <td className="py-3.5 px-4">
                        {lead.nextFollowUpDate ? (
                          <div>
                            <span className="text-amber-600 dark:text-amber-400 font-mono text-xs font-bold tabular-nums block">
                              {formatDateBR(lead.nextFollowUpDate)}
                            </span>
                            {lead.nextAction && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 truncate max-w-[140px] block">
                                {lead.nextAction}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditLeadModal(lead.id)}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Ver ou editar ficha do contato"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteLead(lead.id);
                              showToast(`Lead "${lead.name}" excluído.`);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#C9A46B]" />
              Importar Contatos via CSV
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Cole o conteúdo do arquivo CSV abaixo. Formato esperado por linha:
              <br />
              <code className="text-[#9A743E] dark:text-[#E6C387] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-xs block mt-1.5 font-mono">
                Nome; Nicho; Instagram; WhatsApp; Cidade/UF; Observações
              </code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Exemplo:&#10;Dra. Mariana Costa;Nutricionistas;@dramarianacosta;11999998888;São Paulo - SP;Lead frio&#10;Dr. Lucas Rezende;Médicos e biomédicos;@drlucasrezende;21988887777;Rio de Janeiro - RJ;"
              className="w-full mt-3 bg-slate-50 dark:bg-[#111620] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:border-[#C9A46B]"
            />

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setCsvText('');
                }}
                className="h-10 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportCsv}
                disabled={!csvText.trim()}
                className="h-10 px-5 text-xs font-bold bg-[#C9A46B] text-slate-950 rounded-xl hover:bg-[#D8B47E] disabled:opacity-50 transition-all shadow-sm"
              >
                Processar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
