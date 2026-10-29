'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLumina } from '@/context/LuminaContext';
import { migrateLocalStateToFirestore, MigrationSummary } from '@/lib/firestoreService';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  X,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface CloudMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: () => void;
}

export function CloudMigrationModal({ isOpen, onClose, onMigrationComplete }: CloudMigrationModalProps) {
  const { user } = useAuth();
  const { state, exportBackup, showToast } = useLumina();

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backupExported, setBackupExported] = useState(false);

  // Inventário local
  const inventory = {
    leads: (state.leads || []).length,
    sales: (state.sales || []).length,
    tasks: (state.tasks || []).length,
    scripts: (state.scripts || []).length,
    creatives: (state.creatives || []).length,
    packages: (state.packages || []).length,
    expenses: (state.expenses || []).length,
    sessions: (state.productivitySessions || []).length,
    dailyGoal: state.settings.dailyGoal || 20,
    dailyRevenueGoal: state.settings.dailyRevenueGoal || 150,
    monthlyRevenueGoal: state.settings.monthlyRevenueGoal || 3500,
  };

  const handleExportBackupFirst = () => {
    exportBackup();
    setBackupExported(true);
    showToast('Backup preventivo salvo com sucesso!');
  };

  const handleStartMigration = async () => {
    if (!user) return;
    setIsMigrating(true);
    setErrorMsg(null);

    try {
      const summary = await migrateLocalStateToFirestore(user.uid, 'real', state);
      setMigrationSummary(summary);
      showToast('Migração para o Cloud Firestore concluída com sucesso!');
      if (onMigrationComplete) {
        onMigrationComplete();
      }
    } catch (err: any) {
      console.error('Falha na migração para Firestore:', err);
      setErrorMsg(`Erro ao sincronizar com a nuvem: ${err.message || 'Falha de conexão'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#121722] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A46B]/15 text-[#C9A46B] flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Migrar Dados Locais para a Nuvem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lumina Sales V1.4 — Sincronização e acesso multidispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo de Sucesso após Migração */}
        {migrationSummary ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  Migração Concluída com Sucesso!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Seus dados comerciais foram gravados com segurança no Cloud Firestore e agora estão vinculados à sua conta Google autorizada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Leads</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {migrationSummary.leadsCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vendas</span>
                <span className="font-mono font-bold text-base text-emerald-500">
                  {migrationSummary.salesCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tarefas</span>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {migrationSummary.tasksCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scripts</span>
                <span className="font-mono font-bold text-base text-[#C9A46B]">
                  {migrationSummary.scriptsCount}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C9A46B] hover:bg-[#d8b47a] text-slate-950 shadow-sm transition-all"
              >
                Concluir e Voltar ao Painel
              </button>
            </div>
          </div>
        ) : (
          /* Pré-visualização da Migração */
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Esta ação enviará os registros salvos neste navegador para o banco centralizado em nuvem do proprietário (<strong className="text-slate-900 dark:text-white">{user?.email}</strong>).
                Os dados locais originais continuarão preservados como contingência.
              </span>
            </div>

            {/* Inventário */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Inventário de Registros Locais Identificados:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Leads na base:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {inventory.leads}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Vendas:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {inventory.sales}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Tarefas:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {inventory.tasks}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Metas ativas:</span>
                  <span className="font-mono font-bold text-[#C9A46B] text-xs">
                    {inventory.dailyGoal} ab. / R${inventory.dailyRevenueGoal}
                  </span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Ações: Backup + Iniciar Migração */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleExportBackupFirst}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Salvar uma cópia de segurança em JSON no seu computador antes de migrar"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{backupExported ? 'Backup baixado' : 'Baixar backup preventivo (JSON)'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={isMigrating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStartMigration}
                  disabled={isMigrating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C9A46B] hover:bg-[#d8b47a] text-slate-950 shadow-sm flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Migrando em lotes...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Migração Segura</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
