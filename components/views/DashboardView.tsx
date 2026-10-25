'use client';

import React, { useState, useMemo } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  Users,
  Send,
  Heart,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  RotateCcw,
  Target,
  Flame,
  Award,
  Calendar,
  BarChart3,
  TrendingUp,
  Zap,
  Sparkles,
  Phone,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { formatBRL, formatPercent, formatDateBR } from '@/lib/formatters';
import { FUNNEL_STAGES } from '@/lib/formatters';

type ChartMetric = 'sales' | 'approaches';
type ChartPeriod = 7 | 14 | 30;

export function DashboardView() {
  const { state, setActiveTab, openNewLeadModal, openEditLeadModal } = useLumina();

  // Gráfico: Métrica ativa e período
  const [chartMetric, setChartMetric] = useState<ChartMetric>('sales');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(7);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dailyGoal = state.settings.dailyGoal || 20;

  // Abordagens hoje
  const approachesToday = useMemo(() => {
    let count = 0;
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'approach_confirmed' && ev.timestamp?.startsWith(todayStr)) {
          count++;
        }
      });
    });
    return count;
  }, [state.leads, todayStr]);

  // Respostas hoje
  const responsesToday = useMemo(() => {
    let count = 0;
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'response_received' && ev.timestamp?.startsWith(todayStr)) {
          count++;
        }
      });
    });
    return count;
  }, [state.leads, todayStr]);

  // Total acumulado
  const totalLeads = state.leads.length;

  const totalApproaches = useMemo(() => {
    let count = 0;
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'approach_confirmed') count++;
      });
    });
    return count;
  }, [state.leads]);

  const totalResponses = useMemo(() => {
    let count = 0;
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'response_received') count++;
      });
    });
    return count;
  }, [state.leads]);

  const responseRate = totalApproaches > 0 ? (totalResponses / totalApproaches) * 100 : 0;

  // Leads interessados
  const interestedLeads = useMemo(() => {
    return state.leads.filter((l) =>
      [
        'interessado',
        'pacote_enviado',
        'catalogo_enviado',
        'escolhendo_referencias',
        'producao_fotos',
        'previa_enviada',
        'escolhendo_fotos_finais',
      ].includes(l.status)
    ).length;
  }, [state.leads]);

  // Vendas fechadas
  const closedSales = useMemo(() => {
    return state.sales.filter((s) => s.status !== 'cancelled');
  }, [state.sales]);

  const closedSalesCount = closedSales.length;
  const conversionRate = totalLeads > 0 ? (closedSalesCount / totalLeads) * 100 : 0;

  // Caixa recebido vs pendente
  const totalReceivedValue = useMemo(() => {
    let sum = 0;
    closedSales.forEach((s) => {
      (s.payments || []).forEach((p) => {
        sum += p.amount;
      });
    });
    return sum;
  }, [closedSales]);

  const totalSoldValue = useMemo(() => {
    return closedSales.reduce((acc, s) => acc + s.finalValue, 0);
  }, [closedSales]);

  const totalPendingValue = Math.max(0, totalSoldValue - totalReceivedValue);
  const averageTicket = closedSalesCount > 0 ? totalSoldValue / closedSalesCount : 0;

  // Pagamentos pendentes (contagem)
  const pendingPaymentsCount = state.sales.filter(
    (s) => s.status === 'waiting_payment' || s.status === 'partially_paid'
  ).length;

  // Progresso diário
  const dailyProgressPercent = Math.min(100, Math.round((approachesToday / dailyGoal) * 100));

  // =========================================================
  // SISTEMA DE OFENSIVA (DUOLINGO STREAK)
  // =========================================================
  const { currentStreak, weekDays, streakStatus } = useMemo(() => {
    const daysOfWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 a 6

    // Mapear abordagens por dia (últimos 7 dias da semana corrente)
    const approachesByDay: Record<string, number> = {};
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'approach_confirmed' && ev.timestamp) {
          const date = ev.timestamp.split('T')[0];
          approachesByDay[date] = (approachesByDay[date] || 0) + 1;
        }
      });
    });

    // 7 dias da semana (da segunda ao domingo ou últimos 7 dias)
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const count = approachesByDay[dateKey] || (dateKey === todayStr ? approachesToday : 0);
      const isPast = i > 0;
      const isToday = i === 0;
      const reachedGoal = count >= Math.max(1, Math.floor(dailyGoal * 0.5)); // Flexível para dias de meta

      week.push({
        label: daysOfWeekNames[d.getDay()],
        date: dateKey,
        count,
        reachedGoal,
        isToday,
        isPast,
      });
    }

    // Calcular dias consecutivos da sequência
    let streak = 0;
    // Se hoje bateu a meta ou está no meio do caminho com demo, adiciona
    if (approachesToday >= Math.max(1, Math.floor(dailyGoal * 0.5))) {
      streak += 1;
    }

    // Checar dias passados
    for (let i = 1; i <= 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const count = approachesByDay[dateKey] || 0;
      if (count > 0 || state.settings.isDemoData) {
        streak += 1;
      } else {
        break;
      }
    }

    // Se estiver em modo demonstração, garantir sequência atraente
    if (state.settings.isDemoData && streak < 5) {
      streak = 5;
    }

    const isTodaySaved = approachesToday >= dailyGoal;
    const remainingForToday = Math.max(0, dailyGoal - approachesToday);

    return {
      currentStreak: streak,
      weekDays: week,
      streakStatus: {
        isSaved: isTodaySaved,
        remaining: remainingForToday,
      },
    };
  }, [state.leads, state.settings.isDemoData, todayStr, approachesToday, dailyGoal]);

  // =========================================================
  // DADOS DO GRÁFICO DINÂMICO DIÁRIO
  // =========================================================
  const chartData = useMemo(() => {
    const list = [];
    const now = new Date();

    for (let i = chartPeriod - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      // Abordagens no dia
      let approachesCount = 0;
      state.leads.forEach((l) => {
        (l.timeline || []).forEach((ev) => {
          if (ev.type === 'approach_confirmed' && ev.timestamp?.startsWith(dateStr)) {
            approachesCount++;
          }
        });
      });

      // Vendas no dia
      let salesAmount = 0;
      let salesCount = 0;
      state.sales.forEach((s) => {
        if (s.status !== 'cancelled' && s.closedDate?.startsWith(dateStr)) {
          salesAmount += s.finalValue;
          salesCount++;
        }
      });

      list.push({
        date: dateStr,
        label: dayLabel,
        approaches: approachesCount,
        salesAmount,
        salesCount,
      });
    }

    const maxVal =
      chartMetric === 'sales'
        ? Math.max(100, ...list.map((item) => item.salesAmount))
        : Math.max(dailyGoal, ...list.map((item) => item.approaches));

    return { items: list, maxVal };
  }, [chartPeriod, chartMetric, state.leads, state.sales, dailyGoal]);

  // Distribuição do funil por etapa ativa
  const funnelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGES.forEach((s) => (counts[s.id] = 0));
    state.leads.forEach((l) => {
      if (counts[l.status] !== undefined) {
        counts[l.status]++;
      }
    });
    return counts;
  }, [state.leads]);

  // Atividades recentes
  const recentActivities = useMemo(() => {
    const events: { id: string; leadName: string; title: string; timestamp: string; type: string }[] = [];
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        events.push({
          id: ev.id,
          leadName: l.name,
          title: ev.title,
          timestamp: ev.timestamp,
          type: ev.type,
        });
      });
    });
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [state.leads]);

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho da Visão Geral (Semelhante às referências) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#C9A46B] block">
            VISÃO GERAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
            Dashboard operacional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe decisões, resultados e próximos passos com dados do modo ativo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('prospecting')}
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-[#161b26] hover:bg-slate-100 dark:hover:bg-[#1e2535] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
          >
            Abrir atendimento
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#111622] hover:bg-[#18202e] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>+ Registrar venda</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LINHA 1: 3 CARDS DE DESTAQUE SUPERIORES (REFERÊNCIA)      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Atenção comercial */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#C9A46B] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Atenção comercial
            </span>
            <div className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight mt-0.5">
              {interestedLeads} interessado(s)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {interestedLeads > 0 ? 'Aguardando avanço no processo' : 'Nenhum lead travado'}
            </p>
          </div>
        </div>

        {/* Card 2: Controle de caixa */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 font-bold text-lg font-mono">
            R$
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Controle de caixa
            </span>
            <div className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight mt-0.5">
              {pendingPaymentsCount} pagamento(s)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {formatBRL(totalPendingValue)} pendente
            </p>
          </div>
        </div>

        {/* Card 3: Meta operacional com Ofensiva */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#C9A46B]/15 border border-[#C9A46B]/30 flex items-center justify-center text-[#C9A46B] shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Meta operacional
              </span>
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                {currentStreak} dias
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight mt-0.5">
              {approachesToday} de {dailyGoal}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dailyProgressPercent}% da meta registrada hoje
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LINHA 2: GRID DE 8 CARDS SECUNDÁRIOS COM ÍCONES NO CANTO  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card: Leads */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center absolute top-4 right-4">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Leads</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
            {totalLeads}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Base ativa</p>
        </div>

        {/* Card: Abordagens */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center absolute top-4 right-4">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Abordagens</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
            {totalApproaches}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatPercent(responseRate)} de resposta
          </p>
        </div>

        {/* Card: Interessados */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center absolute top-4 right-4">
            <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Interessados</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
            {interestedLeads}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Oportunidades quentes</p>
        </div>

        {/* Card: Vendas */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center absolute top-4 right-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vendas</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
            {closedSalesCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatPercent(conversionRate)} de conversão
          </p>
        </div>

        {/* Card: Recebido */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs font-mono absolute top-4 right-4">
            R$
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recebido</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-1">
            {formatBRL(totalReceivedValue)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Caixa confirmado</p>
        </div>

        {/* Card: Pendente */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center absolute top-4 right-4">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pendente</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 pt-1">
            {formatBRL(totalPendingValue)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">A receber</p>
        </div>

        {/* Card: Ticket médio */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center absolute top-4 right-4">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ticket médio</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white pt-1">
            {formatBRL(averageTicket)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Por venda válida</p>
        </div>

        {/* Card: Respostas */}
        <div className="relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center absolute top-4 right-4">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Respostas</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
            {totalResponses}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Registradas manualmente</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 3: SISTEMA DE OFENSIVA (DUOLINGO STREAK)            */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:via-[#151922] dark:to-[#151922] border border-amber-500/30 dark:border-amber-500/20 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/10 shrink-0">
            <Flame className="w-8 h-8 fill-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                {currentStreak} Dias de Ofensiva Comercial!
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                PROSPECÇÃO DIÁRIA
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {streakStatus.isSaved
                ? '🔥 Incrível! A meta diária de hoje já foi batida. Sua sequência está protegida!'
                : `Faltam ${streakStatus.remaining} abordagem(ns) hoje para manter seu fogo aceso.`}
            </p>
          </div>
        </div>

        {/* Círculos dos 7 Dias da Semana (Estilo Duolingo) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {weekDays.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {day.label}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  day.reachedGoal
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : day.isToday
                    ? 'border-2 border-dashed border-amber-500 text-amber-500 bg-amber-500/10 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}
                title={`${day.date}: ${day.count} abordagem(ns)`}
              >
                {day.reachedGoal ? (
                  <Flame className="w-5 h-5 fill-slate-950" />
                ) : day.isToday ? (
                  <span>{approachesToday}</span>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 4: GRÁFICO DINÂMICO EM TEMPO REAL (VENDAS X LEADS)  */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#C9A46B]" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Performance Diária em Tempo Real
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe a evolução diária de faturamento ou volume de abordagens
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle de Métrica: Vendas vs Abordagens */}
            <div className="flex items-center bg-slate-100 dark:bg-[#161b26] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartMetric === 'sales'
                    ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Vendas Realizadas (R$)
              </button>
              <button
                onClick={() => setChartMetric('approaches')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartMetric === 'approaches'
                    ? 'bg-[#C9A46B] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Leads Abordados
              </button>
            </div>

            {/* Período */}
            <div className="flex items-center bg-slate-100 dark:bg-[#161b26] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {([7, 14, 30] as ChartPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    chartPeriod === p
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visualização em Barras com Valores e Destaques */}
        <div className="pt-4">
          <div className="h-56 flex items-end gap-2 sm:gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            {chartData.items.map((item) => {
              const val = chartMetric === 'sales' ? item.salesAmount : item.approaches;
              const heightPercent = Math.max(8, Math.round((val / chartData.maxVal) * 100));
              const isToday = item.date === todayStr;

              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip Hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center pointer-events-none">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-mono font-bold shadow-xl border border-slate-700 whitespace-nowrap">
                      {chartMetric === 'sales'
                        ? `${formatBRL(item.salesAmount)} (${item.salesCount} vendas)`
                        : `${item.approaches} abordagem(ns)`}
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                  </div>

                  {/* Valor no Topo da Barra se houver */}
                  {val > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1 hidden sm:block">
                      {chartMetric === 'sales' ? formatBRL(val).replace(',00', '') : val}
                    </span>
                  )}

                  {/* Barra Animada */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                      chartMetric === 'sales'
                        ? isToday
                          ? 'bg-emerald-500 shadow-md shadow-emerald-500/20'
                          : val > 0
                          ? 'bg-emerald-600/80 hover:bg-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800'
                        : isToday
                        ? 'bg-[#C9A46B] shadow-md shadow-[#C9A46B]/20'
                        : val > 0
                        ? 'bg-[#C9A46B]/80 hover:bg-[#C9A46B]'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />

                  {/* Rótulo da Data */}
                  <span
                    className={`text-[10px] font-mono mt-2 ${
                      isToday
                        ? 'font-bold text-[#C9A46B]'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isToday ? 'Hoje' : item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LINHA 5: DISTRIBUIÇÃO DO FUNIL & ATIVIDADE RECENTE        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição do Funil */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Distribuição do funil
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Leads por etapa comercial ativa
              </p>
            </div>
            <button
              onClick={() => setActiveTab('crm')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors"
            >
              Abrir CRM
            </button>
          </div>

          <div className="space-y-2.5">
            {FUNNEL_STAGES.slice(0, 7).map((stage) => {
              const count = funnelCounts[stage.id] || 0;
              const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {stage.order}. {stage.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {count} lead(s)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#C9A46B] rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Atividade recente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Histórico em tempo real de contatos e abordagens
              </p>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Nenhuma atividade registrada no modo atual.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {act.leadName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {act.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {formatDateBR(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
