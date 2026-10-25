'use client';

import React, { useState, useMemo } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  FileSpreadsheet,
  CheckSquare,
  Settings,
  Download,
  Upload,
  Database,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Tag,
  User,
  BadgeDollarSign,
} from 'lucide-react';
import { TaskItem, LeadPriority } from '@/lib/types';
import { formatBRL, formatDateBR, formatPercent } from '@/lib/formatters';

export function ReportsAndTasksView() {
  const {
    state,
    activeTab,
    addTask,
    toggleTask,
    deleteTask,
    updateSettings,
    exportBackup,
    importBackup,
    toggleDemoData,
    exportCsv,
    showToast,
  } = useLumina();

  // Sub-tabs: 'tasks' | 'reports' | 'backup_settings'
  const [userSubTab, setUserSubTab] = useState<'tasks' | 'reports' | 'backup_settings' | null>(null);
  const subTab = userSubTab || (activeTab === 'settings' ? 'backup_settings' : 'tasks');
  const setSubTab = (tab: 'tasks' | 'reports' | 'backup_settings') => setUserSubTab(tab);

  // Tasks filter: 'all' | 'today' | 'overdue' | 'upcoming' | 'completed'
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed'>('all');

  // New task form state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskLeadId, setTaskLeadId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<LeadPriority>('medium');
  const [taskNotes, setTaskNotes] = useState('');

  // Settings form states
  const [newNicheText, setNewNicheText] = useState('');
  const [attendantNameSetting, setAttendantNameSetting] = useState(state.settings.attendantName || 'João');
  const [goalSetting, setGoalSetting] = useState(state.settings.dailyGoal.toString());
  const [tableSetting, setTableSetting] = useState<'tabela_1' | 'tabela_2'>(state.settings.defaultPriceTable || 'tabela_1');

  // Today reference date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      if (taskFilter === 'completed') return t.completed;
      if (t.completed && taskFilter !== 'all') return false;

      if (taskFilter === 'today') return t.dueDate === todayStr;
      if (taskFilter === 'overdue') return t.dueDate < todayStr && !t.completed;
      if (taskFilter === 'upcoming') return t.dueDate > todayStr;
      return true;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [state.tasks, taskFilter, todayStr]);

  // Handle add task
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) return;

    const lead = state.leads.find((l) => l.id === taskLeadId);

    addTask({
      title: taskTitle.trim(),
      leadId: taskLeadId || undefined,
      leadName: lead?.name,
      dueDate: taskDueDate,
      priority: taskPriority,
      completed: false,
      notes: taskNotes.trim() || undefined,
    });

    setTaskTitle('');
    setTaskNotes('');
    setIsTaskModalOpen(false);
  };

  // Add custom niche
  const handleAddNiche = () => {
    const clean = newNicheText.trim();
    if (!clean) return;
    if (state.settings.customNiches.includes(clean)) {
      showToast('Nicho já cadastrado.');
      return;
    }
    updateSettings({
      customNiches: [...state.settings.customNiches, clean],
    });
    setNewNicheText('');
    showToast(`Nicho "${clean}" adicionado com sucesso!`);
  };

  // Remove custom niche
  const handleRemoveNiche = (nicheToRemove: string) => {
    updateSettings({
      customNiches: state.settings.customNiches.filter((n) => n !== nicheToRemove),
    });
    showToast('Nicho removido.');
  };

  // Save settings
  const handleSaveSettings = () => {
    const goalVal = parseInt(goalSetting, 10);
    updateSettings({
      attendantName: attendantNameSetting.trim() || 'João',
      dailyGoal: !isNaN(goalVal) && goalVal > 0 ? goalVal : 20,
      defaultPriceTable: tableSetting,
    });
    showToast('Preferências e configurações salvas com sucesso!');
  };

  // Reports analytics calculations
  const topPackages = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; name: string }> = {};
    state.sales.forEach((s) => {
      if (s.status === 'cancelled') return;
      const key = s.serviceName;
      if (!map[key]) {
        map[key] = { count: 0, revenue: 0, name: s.serviceName };
      }
      map[key].count++;
      map[key].revenue += s.finalValue;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [state.sales]);

  const nicheConversionReport = useMemo(() => {
    const map: Record<string, { leads: number; approaches: number; sales: number; revenue: number }> = {};
    state.leads.forEach((l) => {
      if (!map[l.niche]) {
        map[l.niche] = { leads: 0, approaches: 0, sales: 0, revenue: 0 };
      }
      map[l.niche].leads++;
      const hasApproach = (l.timeline || []).some((ev) => ev.type === 'approach_confirmed');
      if (hasApproach) map[l.niche].approaches++;
    });

    state.sales.forEach((s) => {
      const lead = state.leads.find((l) => l.id === s.leadId);
      if (lead && map[lead.niche]) {
        map[lead.niche].sales++;
        map[lead.niche].revenue += s.finalValue;
      }
    });

    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [state.leads, state.sales]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-[#C9A46B]" />
            <span>Tarefas, Relatórios & Ajustes</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Lembretes comerciais, métricas consolidadas por nicho e segurança de dados locais
          </p>
        </div>

        {/* Sub-tabs pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#161D2B] p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setSubTab('tasks')}
            className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'tasks'
                ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tarefas ({state.tasks.filter((t) => !t.completed).length})</span>
          </button>

          <button
            onClick={() => setSubTab('reports')}
            className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'reports'
                ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Relatórios Analíticos</span>
          </button>

          <button
            onClick={() => setSubTab('backup_settings')}
            className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'backup_settings'
                ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Backup & Ajustes</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TAREFAS E LEMBRETES */}
      {subTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#151922] p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none shadow-sm">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'today', label: 'Para Hoje' },
                { id: 'overdue', label: 'Atrasadas' },
                { id: 'upcoming', label: 'Próximas' },
                { id: 'completed', label: 'Concluídas' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTaskFilter(item.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    taskFilter === item.id
                      ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="h-10 px-5 text-sm font-bold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nova Tarefa</span>
            </button>
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-[#151922] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <p className="text-base font-bold text-slate-900 dark:text-white">Nenhuma tarefa pendente neste filtro!</p>
                <p className="text-xs text-slate-500 mt-1">Tudo em dia com seus contatos comerciais.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue = task.dueDate < todayStr && !task.completed;
                const isToday = task.dueDate === todayStr;

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-sm ${
                      task.completed
                        ? 'bg-slate-50 dark:bg-[#12161F] border-slate-200 dark:border-slate-800/80 opacity-60'
                        : isOverdue
                        ? 'bg-rose-50/50 dark:bg-[#19151A] border-rose-200 dark:border-rose-900/40'
                        : isToday
                        ? 'bg-amber-50/40 dark:bg-[#18202E] border-[#C9A46B]/40'
                        : 'bg-white dark:bg-[#151922] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 rounded text-[#C9A46B] focus:ring-0 cursor-pointer w-4 h-4"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold text-slate-900 dark:text-white ${
                              task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.leadName && (
                            <span className="text-[11px] font-semibold text-[#9A743E] dark:text-[#E6C387] bg-[#C9A46B]/15 px-2 py-0.5 rounded border border-[#C9A46B]/30 truncate">
                              {task.leadName}
                            </span>
                          )}
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{task.notes}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span
                            className={`font-mono text-xs flex items-center gap-1 ${
                              isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : isToday
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateBR(task.dueDate)} {isOverdue ? '(Atrasada)' : isToday ? '(Hoje)' : ''}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Prioridade: {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RELATÓRIOS ANALÍTICOS */}
      {subTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Relatórios & Performance Comercial</h3>
              <p className="text-xs text-slate-500">
                Auditoria de conversão, faturamento por nicho e adesão de pacotes
              </p>
            </div>
            <button
              onClick={exportCsv}
              className="h-9 px-4 text-xs font-bold bg-[#C9A46B] text-slate-950 rounded-xl hover:bg-[#D8B47E] flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Todos em CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Relatório 1: Nichos mais Lucrativos */}
            <div className="bg-white dark:bg-[#151922] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C9A46B]" />
                Conversão e Faturamento por Nicho
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {nicheConversionReport.map(([nicheName, data]) => {
                  const conversionRate = data.approaches > 0 ? (data.sales / data.approaches) * 100 : 0;
                  return (
                    <div key={nicheName} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{nicheName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {data.leads} leads · {data.approaches} abordados · {data.sales} venda(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                          {formatBRL(data.revenue)}
                        </div>
                        <div className="text-[11px] text-[#9A743E] dark:text-[#E6C387] font-semibold">
                          {formatPercent(conversionRate)} conversão
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Relatório 2: Pacotes mais Vendidos */}
            <div className="bg-white dark:bg-[#151922] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C9A46B]" />
                Pacotes e Serviços Mais Vendidos
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {topPackages.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Nenhuma venda registrada ainda.
                  </div>
                ) : (
                  topPackages.map((pkg) => (
                    <div key={pkg.name} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{pkg.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{pkg.count} contratação(ões)</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">{formatBRL(pkg.revenue)}</div>
                        <div className="text-[11px] text-slate-500">
                          Média: {formatBRL(pkg.revenue / pkg.count)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BACKUP E AJUSTES */}
      {subTab === 'backup_settings' && (
        <div className="space-y-6">
          {/* Backup Strip */}
          <div className="bg-white dark:bg-[#151922] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Segurança, Backup e Portabilidade
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                O Lumina Sales armazena seus dados diretamente no seu navegador com IndexedDB (sem envio de dados de contatos para servidores terceiros). Exporte backups regulares para total tranquilidade e portabilidade.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={exportBackup}
                className="h-10 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#18202E] dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-[#C9A46B]" />
                <span>Exportar Backup Completo (JSON)</span>
              </button>

              <label className="h-10 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#18202E] dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Restaurar Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importBackup(file);
                    }
                  }}
                />
              </label>

              <button
                onClick={toggleDemoData}
                className="h-10 px-4 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Database className="w-4 h-4 text-amber-500" />
                <span>
                  {state.settings.isDemoData
                    ? 'Limpar Dados Demonstrativos (Modo Produção Limpo)'
                    : 'Carregar Dados Demonstrativos de Exemplo'}
                </span>
              </button>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferências Globais e Atendente */}
            <div className="bg-white dark:bg-[#151922] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C9A46B]" />
                Configurações Comerciais & Variáveis
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Atendente (Substitui [SEU NOME] / {'{seu nome}'} nos scripts)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={attendantNameSetting}
                        onChange={(e) => setAttendantNameSetting(e.target.value)}
                        placeholder="Ex: João"
                        className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-[#C9A46B]"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Conforme o PDF comercial da Lumina, o nome padrão é &quot;João&quot;.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tabela de Preços Ativa por Padrão
                  </label>
                  <select
                    value={tableSetting}
                    onChange={(e) => setTableSetting(e.target.value as any)}
                    className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#C9A46B]"
                  >
                    <option value="tabela_1">Tabela 1 — Pacotes Diretos (R$ 29,30 a R$ 139,90)</option>
                    <option value="tabela_2">Tabela 2 — Pacotes Completos com Instabio &amp; Site (R$ 34,90 a R$ 547,90)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meta Diária de Abordagens
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={goalSetting}
                      onChange={(e) => setGoalSetting(e.target.value)}
                      className="w-28 h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-xs text-slate-500">contatos por dia</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fuso Horário Operacional
                  </label>
                  <input
                    type="text"
                    disabled
                    value={state.settings.timezone}
                    className="w-full h-10 bg-slate-100 dark:bg-[#18202E]/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Horário oficial de Brasília (UTC-03:00)
                  </span>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="h-10 px-5 text-xs font-bold bg-[#C9A46B] text-slate-950 rounded-xl hover:bg-[#D8B47E] shadow-sm transition-all"
                >
                  Salvar Ajustes
                </button>
              </div>
            </div>

            {/* Nichos Personalizados */}
            <div className="bg-white dark:bg-[#151922] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#C9A46B]" />
                  Gerenciador de Nichos (Página 22)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  13 nichos oficiais do documento e ramos complementares
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNicheText}
                  onChange={(e) => setNewNicheText(e.target.value)}
                  placeholder="Novo nicho (Ex: Fisioterapeutas)..."
                  className="flex-1 h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleAddNiche}
                  className="h-10 px-4 text-xs font-bold bg-[#C9A46B] text-slate-950 rounded-xl hover:bg-[#D8B47E] shadow-sm"
                >
                  Adicionar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pt-1">
                {state.settings.customNiches.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-300"
                  >
                    <span>{n}</span>
                    <button
                      onClick={() => handleRemoveNiche(n)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                      title="Remover nicho"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Tarefa */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveTask}
            className="w-full max-w-md bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#C9A46B]" />
              Cadastrar Nova Tarefa / Lembrete
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título da Tarefa *</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex: Enviar link da galeria de prévias"
                className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lead Vinculado (Opcional)</label>
              <select
                value={taskLeadId}
                onChange={(e) => setTaskLeadId(e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="">Nenhum lead específico</option>
                {state.leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.niche})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Limite *</label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as LeadPriority)}
                  className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações da Tarefa</label>
              <input
                type="text"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Detalhes ou instrução específica..."
                className="w-full h-10 bg-slate-50 dark:bg-[#18202E] border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="h-10 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 px-5 text-xs font-bold bg-[#C9A46B] text-slate-950 rounded-xl hover:bg-[#D8B47E] shadow-sm"
              >
                Salvar Tarefa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
