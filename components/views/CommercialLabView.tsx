'use client';

import React, { useState } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  FlaskConical,
  Plus,
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle,
  FileText,
  BarChart2,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Sparkles,
  Zap,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Experiment, ExperimentVariant } from '@/lib/types';
import { calculateCommercialMetrics, formatBRL, formatPercent } from '@/lib/formatters';
import { OFFICIAL_NICHES } from '@/lib/seed-data';

export function CommercialLabView() {
  const { state, addExperiment, updateExperiment, updateVariantStats, showToast } = useLumina();

  // Experimento padrão de teste de modalidade A/B (conforme especificação)
  const defaultExperiment = state.experiments.find((e) => e.category === 'modalidade_ab') || {
    id: 'exp-modalidade-ab-principal',
    name: 'Modalidade A (Saudação Prévia) vs Modalidade B (Apresentação Direta com Foto)',
    hypothesis:
      'Testar se enviar primeiro apenas uma saudação (Bom dia/Boa tarde) antes da proposta gera mais respostas e vendas do que mandar a apresentação direta acompanhada do criativo do nicho.',
    category: 'modalidade_ab' as const,
    niche: 'Todos os Nichos',
    startDate: '2026-10-01',
    status: 'active' as const,
    variants: [
      {
        id: 'var-a-saudacao',
        name: 'Variante A: Saudação Prévia (Bom dia / Boa tarde primeiro)',
        approaches: 38,
        responses: 24,
        interested: 11,
        sales: 4,
        revenue: 359.6,
      },
      {
        id: 'var-b-direta',
        name: 'Variante B: Apresentação Direta (Criativo do nicho + Texto imediato)',
        approaches: 42,
        responses: 19,
        interested: 9,
        sales: 5,
        revenue: 489.5,
      },
    ],
    conclusions:
      'A Variante A obteve maior taxa de abertura e resposta inicial (63%), enquanto a Variante B fechou vendas de maior ticket médio.',
  };

  // Modal de ajuste de estatísticas
  const [statsModalVariant, setStatsModalVariant] = useState<{
    expId: string;
    variant: ExperimentVariant;
  } | null>(null);

  const [editApproaches, setEditApproaches] = useState(0);
  const [editResponses, setEditResponses] = useState(0);
  const [editInterested, setEditInterested] = useState(0);
  const [editSales, setEditSales] = useState(0);
  const [editRevenue, setEditRevenue] = useState(0);

  const handleOpenStatsModal = (expId: string, variant: ExperimentVariant) => {
    setStatsModalVariant({ expId, variant });
    setEditApproaches(variant.approaches);
    setEditResponses(variant.responses);
    setEditInterested(variant.interested);
    setEditSales(variant.sales);
    setEditRevenue(variant.revenue);
  };

  const handleSaveStats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statsModalVariant) return;

    updateVariantStats(statsModalVariant.expId, statsModalVariant.variant.id, {
      approaches: Number(editApproaches) || 0,
      responses: Number(editResponses) || 0,
      interested: Number(editInterested) || 0,
      sales: Number(editSales) || 0,
      revenue: Number(editRevenue) || 0,
    });

    setStatsModalVariant(null);
    showToast('Resultados do Teste A/B atualizados com sucesso!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#C9A46B] block">
            EXPERIMENTAÇÃO E OTIMIZAÇÃO
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
            Laboratório Comercial &amp; Testes A/B
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Validação prática de estratégias de abordagem, taxas de resposta e retorno financeiro real
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TESTE PRINCIPAL: SAUDAÇÃO PRÉVIA (A) VS APRESENTAÇÃO (B)   */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#C9A46B]" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Teste de Modalidade de Abordagem
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Teste Ativo em Produção
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
            <strong>Hipótese de Validação:</strong> {defaultExperiment.hypothesis}
          </p>
        </div>

        {/* Comparativo das Duas Variantes Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {defaultExperiment.variants.map((variant, index) => {
            const metrics = calculateCommercialMetrics(variant);
            const isVariantA = index === 0;

            return (
              <div
                key={variant.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isVariantA
                    ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40'
                    : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isVariantA
                          ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isVariantA ? 'MODALIDADE A' : 'MODALIDADE B'}
                    </span>
                    <button
                      onClick={() => handleOpenStatsModal(defaultExperiment.id, variant)}
                      className="text-xs font-semibold text-[#9A743E] dark:text-[#C9A46B] hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar Dados</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {variant.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isVariantA
                        ? 'Envia primeiro apenas uma saudação (Ex: "Oi, boa tarde, [Nome]!"). Quando a pessoa responde, envia a proposta e o portfólio.'
                        : 'Envia imediatamente a foto demonstrativa do nicho acompanhada do texto de apresentação comercial.'}
                    </p>
                  </div>

                  {/* Grid de Métricas Principais da Variante */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
                      <span className="text-[11px] text-slate-500 block">Abordagens</span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {metrics.approaches}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
                      <span className="text-[11px] text-slate-500 block">Respostas</span>
                      <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                        {metrics.responses} ({formatPercent(metrics.responseRate)})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
                      <span className="text-[11px] text-slate-500 block">Interessados</span>
                      <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                        {metrics.interested} ({formatPercent(metrics.interestRate)})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
                      <span className="text-[11px] text-slate-500 block">Vendas Fechadas</span>
                      <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {metrics.sales} ({formatPercent(metrics.conversionRate)})
                      </span>
                    </div>
                  </div>

                  {/* Faturamento e Retorno por Lead */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Receita Total</span>
                      <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatBRL(metrics.revenue)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Receita / Abordagem</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {formatBRL(metrics.revenuePerApproach)} / lead
                      </span>
                    </div>
                  </div>

                  {metrics.isLowSample && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Amostra preliminar (&lt; 30 abordagens). Continue os envios para maior precisão.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnóstico da Experimentação */}
        {defaultExperiment.conclusions && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Award className="w-5 h-5 text-[#C9A46B] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Diagnóstico &amp; Aprendizado Operacional
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                {defaultExperiment.conclusions}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL DE EDIÇÃO DE ESTATÍSTICAS DA VARIANTE               */}
      {/* ========================================================= */}
      {statsModalVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151922] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#C9A46B]" />
                <span>Atualizar Resultados da Variante</span>
              </h3>
              <button
                type="button"
                onClick={() => setStatsModalVariant(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atualize as métricas de <strong>{statsModalVariant.variant.name}</strong> para recalcular as taxas de conversão e receita por contato:
            </p>

            <form onSubmit={handleSaveStats} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Abordagens
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editApproaches}
                    onChange={(e) => setEditApproaches(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Respostas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editResponses}
                    onChange={(e) => setEditResponses(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interessados
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editInterested}
                    onChange={(e) => setEditInterested(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vendas Fechadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editSales}
                    onChange={(e) => setEditSales(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receita Gerada (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editRevenue}
                  onChange={(e) => setEditRevenue(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatsModalVariant(null)}
                  className="h-10 px-4 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 text-xs font-bold rounded-xl bg-[#C9A46B] hover:bg-[#D8B47E] text-slate-950 shadow-xs"
                >
                  Salvar Resultados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
