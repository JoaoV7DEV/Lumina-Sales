'use client';

import React, { useState, useEffect } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  X,
  User,
  Instagram,
  Phone,
  MapPin,
  AlertTriangle,
  Calendar,
  Clock,
  Trash2,
  Save,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { LeadStatus, LeadPriority, LeadOpportunities } from '@/lib/types';
import {
  FUNNEL_STAGES,
  EXCLUSION_STATUSES,
  normalizeInstagramHandle,
  normalizePhoneDisplay,
  cleanDigits,
  buildInstagramUrl,
  buildWhatsAppUrl,
  formatDateTimeBR,
} from '@/lib/formatters';
import { OFFICIAL_NICHES } from '@/lib/seed-data';

const DEFAULT_OPPORTUNITIES: LeadOpportunities = {
  noProfessionalPhotos: false,
  limitedPhotos: false,
  noBioLink: false,
  poorBioLink: false,
  noWebsite: false,
  poorWebsite: false,
  needsBranding: false,
  complementaryServices: false,
};

function LeadDrawerForm() {
  const {
    editingLeadId,
    closeLeadModal,
    state,
    addLead,
    updateLead,
    deleteLead,
    addTimelineEvent,
    checkDuplicateLead,
    showToast,
  } = useLumina();

  const isEditing = Boolean(editingLeadId);
  const existingLead = state.leads.find((l) => l.id === editingLeadId);

  // Modo do formulário: rápido (padrão para novos) ou completo
  const [formMode, setFormMode] = useState<'fast' | 'full'>(isEditing ? 'full' : 'fast');

  // Campos do formulário
  const [name, setName] = useState(existingLead ? existingLead.name : '');
  const [businessName, setBusinessName] = useState(existingLead?.businessName || '');
  const [niche, setNiche] = useState(existingLead ? existingLead.niche : OFFICIAL_NICHES[0]);
  const [customNicheInput, setCustomNicheInput] = useState('');
  const [isAddingNewNiche, setIsAddingNewNiche] = useState(false);
  const [instagram, setInstagram] = useState(existingLead?.instagram || '');
  const [whatsapp, setWhatsapp] = useState(existingLead?.whatsapp || '');
  const [cityState, setCityState] = useState(existingLead?.cityState || '');
  const [source, setSource] = useState(existingLead?.source || 'Prospecção Ativa Instagram');
  const [status, setStatus] = useState<LeadStatus>(existingLead?.status || 'novo_lead');
  const [priority, setPriority] = useState<LeadPriority>(existingLead?.priority || 'medium');
  const [notes, setNotes] = useState(existingLead?.notes || '');
  const [nextAction, setNextAction] = useState(existingLead?.nextAction || '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(existingLead?.nextFollowUpDate || '');
  const [scriptId, setScriptId] = useState(existingLead?.scriptId || '');
  const [creativeId, setCreativeId] = useState(existingLead?.creativeId || '');
  const [packageInterestId, setPackageInterestId] = useState(existingLead?.packageInterestId || '');
  const [priceTablePresented, setPriceTablePresented] = useState<'tabela_1' | 'tabela_2' | undefined>(
    existingLead?.priceTablePresented
  );
  const [opportunities, setOpportunities] = useState<LeadOpportunities>(
    existingLead?.opportunities || DEFAULT_OPPORTUNITIES
  );

  // Linha do tempo e nova nota
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'opportunities' | 'timeline'>('info');

  // Checagem de duplicidade em tempo real
  const duplicateCheck = checkDuplicateLead(whatsapp, instagram, editingLeadId || undefined);

  const handleToggleOpportunity = (key: keyof LeadOpportunities) => {
    setOpportunities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetForm = () => {
    setName('');
    setBusinessName('');
    setNiche(OFFICIAL_NICHES[0]);
    setInstagram('');
    setWhatsapp('');
    setCityState('');
    setNotes('');
    setNextAction('');
    setNextFollowUpDate('');
    setStatus('novo_lead');
    setPriority('medium');
    setOpportunities(DEFAULT_OPPORTUNITIES);
  };

  const handleSave = (keepOpenAfterSave = false) => {
    if (!name.trim()) {
      showToast('Por favor, informe ao menos o nome do lead.');
      return;
    }

    const finalNiche = isAddingNewNiche && customNicheInput.trim() ? customNicheInput.trim() : niche;
    const finalInstagram = instagram.trim() ? normalizeInstagramHandle(instagram) : '';

    const payload = {
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      niche: finalNiche,
      instagram: finalInstagram,
      whatsapp: cleanDigits(whatsapp) || undefined,
      cityState: cityState.trim() || undefined,
      source,
      status,
      priority,
      notes: notes.trim(),
      nextAction: nextAction.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      scriptId: scriptId || undefined,
      creativeId: creativeId || undefined,
      packageInterestId: packageInterestId || undefined,
      priceTablePresented,
      opportunities,
    };

    if (isEditing && editingLeadId) {
      updateLead(editingLeadId, payload);
      closeLeadModal();
    } else {
      addLead(payload);
      if (keepOpenAfterSave) {
        resetForm();
        showToast('Lead salvo! Pronto para o próximo cadastro.');
      } else {
        closeLeadModal();
      }
    }
  };

  const handleAddTimelineNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineNote.trim() || !editingLeadId) return;

    addTimelineEvent(editingLeadId, {
      type: 'note_added',
      title: 'Nota operacional adicionada',
      description: newTimelineNote.trim(),
    });
    setNewTimelineNote('');
    showToast('Anotação adicionada ao histórico');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#151922] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header do Drawer */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-[#C9A46B]" />
            <span>{isEditing ? `Editar: ${existingLead?.name}` : 'Cadastrar Novo Lead'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditing ? 'Atualize os dados, oportunidades e histórico' : 'Cadastre contatos rapidamente para sua fila'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setFormMode(formMode === 'fast' ? 'full' : 'fast')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>{formMode === 'fast' ? 'Modo Completo' : 'Modo Rápido'}</span>
            </button>
          )}

          <button
            onClick={closeLeadModal}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alerta de Duplicidade em Tempo Real */}
      {duplicateCheck.isDuplicate && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-semibold">Aviso de duplicidade:</span> {duplicateCheck.reason}.
            {duplicateCheck.existingLead && (
              <span className="block mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                Lead já cadastrado em {formatDateTimeBR(duplicateCheck.existingLead.createdAt)} com status &quot;{duplicateCheck.existingLead.status}&quot;.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Abas Superiores no Modo Completo ou Edição */}
      {(formMode === 'full' || isEditing) && (
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#C9A46B] text-[#9A743E] dark:text-[#E6C387] font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Informações
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'opportunities'
                ? 'border-[#C9A46B] text-[#9A743E] dark:text-[#E6C387] font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A46B]" />
            <span>Oportunidades</span>
            {Object.values(opportunities).filter(Boolean).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#C9A46B]/20 text-[#9A743E] dark:text-[#C9A46B] font-bold">
                {Object.values(opportunities).filter(Boolean).length}
              </span>
            )}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-[#C9A46B] text-[#9A743E] dark:text-[#E6C387] font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Histórico ({existingLead?.timeline?.length || 0})
            </button>
          )}
        </div>
      )}

      {/* Conteúdo com Rolagem */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* ================================================= */}
        {/* MODO RÁPIDO: Apenas 4 campos principais */}
        {/* ================================================= */}
        {formMode === 'fast' && !isEditing && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Modo Cadastro Rápido ativo</span>
              <button
                type="button"
                onClick={() => setFormMode('full')}
                className="text-[#9A743E] dark:text-[#C9A46B] font-medium hover:underline"
              >
                Preencher campos detalhados
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Lead *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dra. Camila Alencar"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="11988881234"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@perfil.profissional"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nicho Profissional (Página 22) *
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
              >
                {OFFICIAL_NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anotações Rápidas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Vi fotos antigas de formatura, perfil receptivo..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
              />
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* MODO COMPLETO: Abas de Informações, Oportunidades e Histórico */}
        {/* ================================================= */}
        {(formMode === 'full' || isEditing) && activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Pessoa *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dra. Camila Alencar"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
              />
            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="11988881234"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@perfil"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nicho Profissional *
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                >
                  {OFFICIAL_NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  {state.settings.customNiches.map((n) => (
                    <option key={n} value={n}>
                      {n} (Personalizado)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Etapa no Funil Comercial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                >
                  <optgroup label="14 Etapas Oficiais">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LeadPriority)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                >
                  <option value="high">Alta (Quente / Perfil Alinhado)</option>
                  <option value="medium">Média (Padrão)</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tabela Comercial Apresentada
                </label>
                <select
                  value={priceTablePresented || ''}
                  onChange={(e) =>
                    setPriceTablePresented((e.target.value as 'tabela_1' | 'tabela_2') || undefined)
                  }
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                >
                  <option value="">Nenhuma tabela enviada ainda</option>
                  <option value="tabela_1">Tabela 1: R$ 29,30 a R$ 139,90</option>
                  <option value="tabela_2">Tabela 2: R$ 34,90 a R$ 547,90 (+ Brindes/Bio)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Próxima Ação
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Ex: Mandar Follow-up 1 (24h)"
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Retorno (Follow-up)
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Detalhes sobre a conversa, dores relatadas, fotos enviadas..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
              />
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* CHECKLIST DE OPORTUNIDADES VISUAIS (Bio, Site, Fotos) */}
        {/* ================================================= */}
        {(formMode === 'full' || isEditing) && activeTab === 'opportunities' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identifique brechas visuais no perfil para calibrar a abordagem e justificar a necessidade do ensaio ou serviços digitais complementares:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { key: 'noProfessionalPhotos', label: 'Não possui fotos profissionais' },
                { key: 'limitedPhotos', label: 'Fotos limitadas ou antigas' },
                { key: 'noBioLink', label: 'Não possui link na bio' },
                { key: 'poorBioLink', label: 'Link na bio pode ser melhorado' },
                { key: 'noWebsite', label: 'Não possui site institucional' },
                { key: 'poorWebsite', label: 'Site pode ser melhorado' },
                { key: 'needsBranding', label: 'Potencial para identidade visual' },
                { key: 'complementaryServices', label: 'Interesse em serviços digitais' },
              ].map((item) => {
                const checked = opportunities[item.key as keyof LeadOpportunities];
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? 'bg-[#C9A46B]/10 border-[#C9A46B]/40 text-[#9A743E] dark:text-[#E6C387] font-medium'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleOpportunity(item.key as keyof LeadOpportunities)}
                      className="rounded border-slate-400 text-[#C9A46B] focus:ring-[#C9A46B]"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* HISTÓRICO DE ATIVIDADES / TIMELINE */}
        {/* ================================================= */}
        {isEditing && activeTab === 'timeline' && (
          <div className="space-y-4">
            <form onSubmit={handleAddTimelineNote} className="space-y-2">
              <textarea
                value={newTimelineNote}
                onChange={(e) => setNewTimelineNote(e.target.value)}
                placeholder="Adicionar nota rápida de acompanhamento..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A46B]"
              />
              <button
                type="submit"
                className="text-xs px-3 py-1.5 font-medium bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800"
              >
                Registrar no histórico
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {existingLead?.timeline?.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{event.title}</span>
                    <span>{formatDateTimeBR(event.timestamp)}</span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé de Ações do Drawer */}
      <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] flex items-center justify-between gap-3">
        {isEditing ? (
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir este lead permanentemente?')) {
                deleteLead(existingLead!.id);
                closeLeadModal();
              }
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Lead</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
          >
            <PlusCircle className="w-4 h-4 text-[#C9A46B]" />
            <span>Salvar e Adicionar Outro</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={closeLeadModal}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md transition-transform active:scale-[0.98] flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Salvar Alterações' : 'Salvar Lead'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeadDrawerModal() {
  const { isLeadDrawerOpen, closeLeadModal } = useLumina();

  if (!isLeadDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeLeadModal}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl h-full shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        <LeadDrawerForm />
      </div>
    </div>
  );
}
