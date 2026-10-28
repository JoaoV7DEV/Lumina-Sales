'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  Calendar,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Check,
  Eye,
  Edit3,
  X,
  Instagram,
  Phone,
  Wallet,
  Receipt,
  CalendarRange,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { formatBRL, formatPercent, formatDateBR, FUNNEL_STAGES } from '@/lib/formatters';
import { Lead, LeadStatus } from '@/lib/types';

// Tipos para Filtros de Período
type PeriodType = 'hoje' | '7d' | '14d' | '30d' | 'mes_atual' | 'todo' | 'personalizado';

// Métrica do Gráfico de Evolução Comercial
type ChartMetric = 'sales_amount' | 'cash_received' | 'approaches' | 'sales_count';

// Ordenação de Nichos
type NicheSortMetric = 'revenue' | 'sales' | 'approaches' | 'conversion' | 'response_rate';

const NICHE_SORT_OPTIONS: { id: NicheSortMetric; label: string; icon: React.ElementType }[] = [
  { id: 'revenue', label: 'Receita', icon: DollarSign },
  { id: 'sales', label: 'Vendas', icon: CheckCircle2 },
  { id: 'conversion', label: 'Conversão', icon: ArrowUpRight },
  { id: 'response_rate', label: 'Respostas', icon: RotateCcw },
  { id: 'approaches', label: 'Abordagens', icon: Send },
];

// Categorias da Central de Retorno Comercial
type AttentionCategory = 'todos' | 'atrasados' | 'hoje' | 'proximos';
type AttentionFilterTag = 'todos' | 'sem_resposta' | 'visualizou' | 'followup' | 'remarketing' | 'negociacao';

export function DashboardView() {
  const {
    state,
    setActiveTab,
    openNewLeadModal,
    openEditLeadModal,
    updateSettings,
    addTimelineEvent,
    updateLead,
    showToast,
  } = useLumina();

  // =========================================================
  // ESTADOS DE FILTRO DE PERÍODO
  // =========================================================
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Métrica ativa do gráfico diário
  const [chartMetric, setChartMetric] = useState<ChartMetric>('sales_amount');

  // Ordenação da Tabela de Nichos
  const [nicheSort, setNicheSort] = useState<NicheSortMetric>('revenue');

  // Filtros da Central de Atenção Comercial
  const [attentionCategory, setAttentionCategory] = useState<AttentionCategory>('todos');
  const [attentionTag, setAttentionTag] = useState<AttentionFilterTag>('todos');

  // Modal para Ajuste Rápido de Metas
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalTarget, setEditingGoalTarget] = useState<'daily_approaches' | 'daily_revenue' | 'monthly_revenue'>('daily_approaches');
  const [goalInputValue, setGoalInputValue] = useState<number>(20);

  // Modal para Concluir Retorno Rápido
  const [completingLead, setCompletingLead] = useState<Lead | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  // Datas de Referência
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthPrefix = useMemo(() => todayStr.slice(0, 7), [todayStr]); // YYYY-MM

  // Metas do Sistema (ou padrões definidos na V1.3)
  const dailyApproachesGoal = state.settings.dailyGoal || 20;
  const dailyRevenueGoal = state.settings.dailyRevenueGoal || 150;
  const monthlyRevenueGoal = state.settings.monthlyRevenueGoal || 3500;

  // =========================================================
  // INTERVALO DE DATAS COMPUTADO
  // =========================================================
  const { periodStartStr, periodEndStr, periodLabel } = useMemo(() => {
    const now = new Date();

    if (selectedPeriod === 'hoje') {
      return {
        periodStartStr: todayStr,
        periodEndStr: todayStr,
        periodLabel: 'Hoje',
      };
    }
    if (selectedPeriod === '7d') {
      const d = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const start = d.toISOString().split('T')[0];
      return {
        periodStartStr: start,
        periodEndStr: todayStr,
        periodLabel: 'Últimos 7 dias',
      };
    }
    if (selectedPeriod === '14d') {
      const d = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
      const start = d.toISOString().split('T')[0];
      return {
        periodStartStr: start,
        periodEndStr: todayStr,
        periodLabel: 'Últimos 14 dias',
      };
    }
    if (selectedPeriod === '30d') {
      const d = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      const start = d.toISOString().split('T')[0];
      return {
        periodStartStr: start,
        periodEndStr: todayStr,
        periodLabel: 'Últimos 30 dias',
      };
    }
    if (selectedPeriod === 'mes_atual') {
      const start = `${currentMonthPrefix}-01`;
      return {
        periodStartStr: start,
        periodEndStr: todayStr,
        periodLabel: 'Mês atual',
      };
    }
    if (selectedPeriod === 'personalizado') {
      return {
        periodStartStr: customStartDate || '2000-01-01',
        periodEndStr: customEndDate || todayStr,
        periodLabel: 'Personalizado',
      };
    }
    // 'todo'
    return {
      periodStartStr: '2000-01-01',
      periodEndStr: '2099-12-31',
      periodLabel: 'Todo o período',
    };
  }, [selectedPeriod, todayStr, currentMonthPrefix, customStartDate, customEndDate]);

  // Função auxiliar para verificar se uma data ISO está dentro do período
  const isDateInPeriod = useCallback(
    (dateIso?: string | null) => {
      if (!dateIso) return false;
      const dateOnly = dateIso.split('T')[0];
      return dateOnly >= periodStartStr && dateOnly <= periodEndStr;
    },
    [periodStartStr, periodEndStr]
  );

  // =========================================================
  // CÁLCULO DE METAS COMERCIAIS E FINANCEIRAS
  // =========================================================

  // 1. Meta Diária de Abordagens (Operacional)
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

  const approachesProgressPercent = Math.min(100, Math.round((approachesToday / dailyApproachesGoal) * 100));
  const approachesDisplayPercent = Math.round((approachesToday / dailyApproachesGoal) * 100);

  // 2. Meta Diária de Faturamento (R$)
  const salesAmountToday = useMemo(() => {
    return state.sales
      .filter((s) => s.status !== 'cancelled' && s.closedDate?.startsWith(todayStr))
      .reduce((acc, s) => acc + s.finalValue, 0);
  }, [state.sales, todayStr]);

  const cashReceivedToday = useMemo(() => {
    let sum = 0;
    state.sales
      .filter((s) => s.status !== 'cancelled')
      .forEach((s) => {
        (s.payments || []).forEach((p) => {
          if (p.date?.startsWith(todayStr)) {
            sum += p.amount;
          }
        });
      });
    return sum;
  }, [state.sales, todayStr]);

  const dailyRevenueProgressPercent = Math.min(100, Math.round((salesAmountToday / dailyRevenueGoal) * 100));
  const dailyRevenueDisplayPercent = Math.round((salesAmountToday / dailyRevenueGoal) * 100);

  // 3. Meta Mensal de Faturamento (R$)
  const salesAmountCurrentMonth = useMemo(() => {
    return state.sales
      .filter((s) => s.status !== 'cancelled' && s.closedDate?.startsWith(currentMonthPrefix))
      .reduce((acc, s) => acc + s.finalValue, 0);
  }, [state.sales, currentMonthPrefix]);

  const cashReceivedCurrentMonth = useMemo(() => {
    let sum = 0;
    state.sales
      .filter((s) => s.status !== 'cancelled')
      .forEach((s) => {
        (s.payments || []).forEach((p) => {
          if (p.date?.startsWith(currentMonthPrefix)) {
            sum += p.amount;
          }
        });
      });
    return sum;
  }, [state.sales, currentMonthPrefix]);

  const monthlyRevenueProgressPercent = Math.min(100, Math.round((salesAmountCurrentMonth / monthlyRevenueGoal) * 100));
  const monthlyRevenueDisplayPercent = Math.round((salesAmountCurrentMonth / monthlyRevenueGoal) * 100);

  // =========================================================
  // INDICADORES NO PERÍODO SELECIONADO (KPIS)
  // =========================================================
  const totalLeads = state.leads.length;

  // Abordagens no período
  const periodApproaches = useMemo(() => {
    let count = 0;
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'approach_confirmed' && isDateInPeriod(ev.timestamp)) {
          count++;
        }
      });
    });
    return count;
  }, [state.leads, isDateInPeriod]);

  // Respostas no período
  const periodResponses = useMemo(() => {
    let count = 0;
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'response_received' && isDateInPeriod(ev.timestamp)) {
          count++;
        }
      });
    });
    return count;
  }, [state.leads, isDateInPeriod]);

  const periodResponseRate = periodApproaches > 0 ? (periodResponses / periodApproaches) * 100 : 0;

  // Interessados (leads ativos em estágios de qualificação e proposta)
  const interestedLeadsCount = useMemo(() => {
    return state.leads.filter((l) =>
      [
        'interessado',
        'pacote_enviado',
        'catalogo_enviado',
        'escolhendo_referencias',
        'producao_fotos',
        'previa_enviada',
        'escolhendo_fotos_finais',
        'aguardando_pagamento',
      ].includes(l.status)
    ).length;
  }, [state.leads]);

  // Vendas fechadas válidas no período
  const periodSales = useMemo(() => {
    return state.sales.filter(
      (s) => s.status !== 'cancelled' && isDateInPeriod(s.closedDate)
    );
  }, [state.sales, isDateInPeriod]);

  const periodSalesCount = periodSales.length;
  const periodSoldValue = periodSales.reduce((acc, s) => acc + s.finalValue, 0);

  // Caixa recebido no período (pagamentos efetivados dentro da janela selecionada)
  const periodCashReceived = useMemo(() => {
    let sum = 0;
    state.sales
      .filter((s) => s.status !== 'cancelled')
      .forEach((s) => {
        (s.payments || []).forEach((p) => {
          if (isDateInPeriod(p.date)) {
            sum += p.amount;
          }
        });
      });
    return sum;
  }, [state.sales, isDateInPeriod]);

  // Saldo a receber geral pendente
  const totalPendingBalance = useMemo(() => {
    let totalSold = 0;
    let totalReceived = 0;
    state.sales
      .filter((s) => s.status !== 'cancelled')
      .forEach((s) => {
        totalSold += s.finalValue;
        (s.payments || []).forEach((p) => {
          totalReceived += p.amount;
        });
      });
    return Math.max(0, totalSold - totalReceived);
  }, [state.sales]);

  // Taxa de conversão do período (vendas no período / abordagens no período)
  const periodConversionRate = periodApproaches > 0 ? (periodSalesCount / periodApproaches) * 100 : 0;
  const periodAverageTicket = periodSalesCount > 0 ? periodSoldValue / periodSalesCount : 0;

  // =========================================================
  // CENTRAL DE ATENÇÃO COMERCIAL (PRÓXIMOS RETORNOS)
  // =========================================================
  const attentionLeads = useMemo(() => {
    const excludedStatuses: LeadStatus[] = [
      'pago',
      'entrega_fotos',
      'avaliacao_recebida',
      'pedir_indicacao',
      'sem_interesse',
      'nao_contatar',
      'arquivado',
      'closed',
      'not_interested',
      'do_not_contact',
    ];

    return state.leads
      .filter((lead) => {
        // Excluir leads já convertidos ou cancelados
        if (excludedStatuses.includes(lead.status)) {
          return false;
        }

        // Determinar se tem pendência comercial
        const hasDate = Boolean(lead.nextFollowUpDate);
        const isCommercialStuck = [
          'novo_lead',
          'demonstracao_enviada',
          'interessado',
          'pacote_enviado',
          'catalogo_enviado',
          'escolhendo_referencias',
          'producao_fotos',
          'previa_enviada',
          'escolhendo_fotos_finais',
          'pagamento_pendente',
          'new',
          'waiting_reply',
          'negotiating',
          'waiting_payment',
        ].includes(lead.status);

        return hasDate || isCommercialStuck;
      })
      .map((lead) => {
        const actionDate = lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '';
        let timing: 'atrasado' | 'hoje' | 'proximo' | 'sem_data' = 'sem_data';

        if (actionDate) {
          if (actionDate < todayStr) timing = 'atrasado';
          else if (actionDate === todayStr) timing = 'hoje';
          else timing = 'proximo';
        } else {
          timing = 'atrasado'; // Se está em etapa que exige contato mas sem data agendada, sinaliza atrasado
        }

        return {
          lead,
          actionDate,
          timing,
        };
      })
      .filter(({ timing, lead }) => {
        // Filtro por categoria de tempo
        if (attentionCategory === 'atrasados' && timing !== 'atrasado') return false;
        if (attentionCategory === 'hoje' && timing !== 'hoje') return false;
        if (attentionCategory === 'proximos' && timing !== 'proximo') return false;

        // Filtro por tipo/tag
        if (attentionTag === 'sem_resposta') {
          if (
            lead.status !== 'demonstracao_enviada' &&
            lead.status !== 'waiting_reply' &&
            lead.status !== 'novo_lead' &&
            lead.status !== 'contacted'
          ) {
            return false;
          }
        }
        if (attentionTag === 'visualizou') {
          const notesText = `${lead.notes || ''} ${lead.nextAction || ''}`.toLowerCase();
          if (!notesText.includes('visualizou') && lead.status !== 'demonstracao_enviada') {
            return false;
          }
        }
        if (attentionTag === 'followup') {
          if (
            !lead.nextFollowUpDate &&
            lead.status !== 'demonstracao_enviada' &&
            lead.status !== 'pacote_enviado'
          ) {
            return false;
          }
        }
        if (attentionTag === 'remarketing') {
          const notesText = `${lead.notes || ''} ${lead.nextAction || ''}`.toLowerCase();
          if (!notesText.includes('remarketing') && lead.status !== 'demonstracao_enviada') {
            return false;
          }
        }
        if (attentionTag === 'negociacao') {
          if (
            ![
              'interessado',
              'pacote_enviado',
              'catalogo_enviado',
              'pagamento_pendente',
              'waiting_payment',
              'negotiating',
            ].includes(lead.status)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (a.timing === 'atrasado' && b.timing !== 'atrasado') return -1;
        if (b.timing === 'atrasado' && a.timing !== 'atrasado') return 1;
        if (a.actionDate && b.actionDate) return a.actionDate.localeCompare(b.actionDate);
        return 0;
      });
  }, [state.leads, todayStr, attentionCategory, attentionTag]);

  // Contagens para badges da central de atenção
  const attentionCounts = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let upcoming = 0;

    const excludedStatuses: LeadStatus[] = [
      'pago',
      'entrega_fotos',
      'avaliacao_recebida',
      'pedir_indicacao',
      'sem_interesse',
      'nao_contatar',
      'arquivado',
      'closed',
      'not_interested',
      'do_not_contact',
    ];

    state.leads.forEach((l) => {
      if (excludedStatuses.includes(l.status)) return;
      const d = l.nextFollowUpDate ? l.nextFollowUpDate.split('T')[0] : '';
      if (!d || d < todayStr) overdue++;
      else if (d === todayStr) today++;
      else upcoming++;
    });

    return { overdue, today, upcoming, total: overdue + today + upcoming };
  }, [state.leads, todayStr]);

  // =========================================================
  // DESEMPENHO POR NICHO (ANALÍTICO)
  // =========================================================
  const nicheAnalytics = useMemo(() => {
    const map: Record<
      string,
      {
        niche: string;
        totalLeads: number;
        approaches: number;
        responses: number;
        interested: number;
        sales: number;
        revenue: number;
      }
    > = {};

    // 1. Contagem de Leads, Abordagens, Respostas e Interessados
    state.leads.forEach((lead) => {
      const niche = lead.niche || 'Geral / Outros';
      if (!map[niche]) {
        map[niche] = {
          niche,
          totalLeads: 0,
          approaches: 0,
          responses: 0,
          interested: 0,
          sales: 0,
          revenue: 0,
        };
      }
      map[niche].totalLeads++;

      // Abordagens no período
      (lead.timeline || []).forEach((ev) => {
        if (ev.type === 'approach_confirmed' && isDateInPeriod(ev.timestamp)) {
          map[niche].approaches++;
        }
        if (ev.type === 'response_received' && isDateInPeriod(ev.timestamp)) {
          map[niche].responses++;
        }
      });

      if (
        [
          'interessado',
          'pacote_enviado',
          'catalogo_enviado',
          'escolhendo_referencias',
          'producao_fotos',
          'previa_enviada',
          'escolhendo_fotos_finais',
          'aguardando_pagamento',
        ].includes(lead.status)
      ) {
        map[niche].interested++;
      }
    });

    // 2. Vendas e Receita por Nicho no período
    periodSales.forEach((sale) => {
      const lead = state.leads.find((l) => l.id === sale.leadId);
      const niche = lead?.niche || 'Geral / Outros';
      if (!map[niche]) {
        map[niche] = {
          niche,
          totalLeads: 0,
          approaches: 0,
          responses: 0,
          interested: 0,
          sales: 0,
          revenue: 0,
        };
      }
      map[niche].sales++;
      map[niche].revenue += sale.finalValue;
    });

    const list = Object.values(map).map((item) => {
      const responseRate = item.approaches > 0 ? (item.responses / item.approaches) * 100 : 0;
      const conversionRate = item.approaches > 0 ? (item.sales / item.approaches) * 100 : 0;
      return {
        ...item,
        responseRate,
        conversionRate,
      };
    });

    // Ordenar de acordo com a métrica selecionada
    list.sort((a, b) => {
      if (nicheSort === 'revenue') return b.revenue - a.revenue;
      if (nicheSort === 'sales') return b.sales - a.sales;
      if (nicheSort === 'approaches') return b.approaches - a.approaches;
      if (nicheSort === 'conversion') return b.conversionRate - a.conversionRate;
      if (nicheSort === 'response_rate') return b.responseRate - a.responseRate;
      return 0;
    });

    const maxRevenue = Math.max(1, ...list.map((i) => i.revenue));

    return { list, maxRevenue };
  }, [state.leads, periodSales, nicheSort, isDateInPeriod]);

  // =========================================================
  // GRÁFICO DINÂMICO DIÁRIO "EVOLUÇÃO COMERCIAL"
  // =========================================================
  const chartData = useMemo(() => {
    let daysCount = 7;
    if (selectedPeriod === 'hoje') daysCount = 1;
    else if (selectedPeriod === '7d') daysCount = 7;
    else if (selectedPeriod === '14d') daysCount = 14;
    else if (selectedPeriod === '30d') daysCount = 30;
    else if (selectedPeriod === 'mes_atual') {
      const dayOfMonth = new Date().getDate();
      daysCount = Math.max(7, dayOfMonth);
    } else {
      daysCount = 14;
    }

    const list = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      // Abordagens
      let approachesCount = 0;
      state.leads.forEach((l) => {
        (l.timeline || []).forEach((ev) => {
          if (ev.type === 'approach_confirmed' && ev.timestamp?.startsWith(dateStr)) {
            approachesCount++;
          }
        });
      });

      // Vendas fechadas e Faturamento
      let salesAmount = 0;
      let salesCount = 0;
      state.sales.forEach((s) => {
        if (s.status !== 'cancelled' && s.closedDate?.startsWith(dateStr)) {
          salesAmount += s.finalValue;
          salesCount++;
        }
      });

      // Caixa recebido
      let cashReceived = 0;
      state.sales.forEach((s) => {
        if (s.status !== 'cancelled') {
          (s.payments || []).forEach((p) => {
            if (p.date?.startsWith(dateStr)) {
              cashReceived += p.amount;
            }
          });
        }
      });

      list.push({
        date: dateStr,
        label: dayLabel,
        approaches: approachesCount,
        salesCount,
        salesAmount,
        cashReceived,
      });
    }

    let maxVal = 1;
    if (chartMetric === 'sales_amount') {
      maxVal = Math.max(100, ...list.map((i) => i.salesAmount));
    } else if (chartMetric === 'cash_received') {
      maxVal = Math.max(100, ...list.map((i) => i.cashReceived));
    } else if (chartMetric === 'approaches') {
      maxVal = Math.max(dailyApproachesGoal, ...list.map((i) => i.approaches));
    } else {
      maxVal = Math.max(3, ...list.map((i) => i.salesCount));
    }

    return { items: list, maxVal };
  }, [selectedPeriod, chartMetric, state.leads, state.sales, dailyApproachesGoal]);

  // =========================================================
  // SISTEMA DE OFENSIVA (DUOLINGO STREAK COMPACTO)
  // =========================================================
  const { currentStreak, weekDays, streakStatus } = useMemo(() => {
    const daysOfWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();

    const approachesByDay: Record<string, number> = {};
    state.leads.forEach((l) => {
      (l.timeline || []).forEach((ev) => {
        if (ev.type === 'approach_confirmed' && ev.timestamp) {
          const date = ev.timestamp.split('T')[0];
          approachesByDay[date] = (approachesByDay[date] || 0) + 1;
        }
      });
    });

    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const count = approachesByDay[dateKey] || (dateKey === todayStr ? approachesToday : 0);
      const isPast = i > 0;
      const isToday = i === 0;
      const reachedGoal = count >= Math.max(1, Math.floor(dailyApproachesGoal * 0.5));

      week.push({
        label: daysOfWeekNames[d.getDay()],
        date: dateKey,
        count,
        reachedGoal,
        isToday,
        isPast,
      });
    }

    let streak = 0;
    if (approachesToday >= Math.max(1, Math.floor(dailyApproachesGoal * 0.5))) {
      streak += 1;
    }

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

    if (state.settings.isDemoData && streak < 5) {
      streak = 5;
    }

    const isTodaySaved = approachesToday >= dailyApproachesGoal;
    const remainingForToday = Math.max(0, dailyApproachesGoal - approachesToday);

    return {
      currentStreak: streak,
      weekDays: week,
      streakStatus: {
        isSaved: isTodaySaved,
        remaining: remainingForToday,
      },
    };
  }, [state.leads, state.settings.isDemoData, todayStr, approachesToday, dailyApproachesGoal]);

  // Funil por Etapas (14 etapas da V1.2/V1.3)
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

  // Atividades Recentes
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

  // Ações de Ajuste de Metas
  const handleOpenGoalModal = (type: 'daily_approaches' | 'daily_revenue' | 'monthly_revenue') => {
    setEditingGoalTarget(type);
    if (type === 'daily_approaches') setGoalInputValue(dailyApproachesGoal);
    else if (type === 'daily_revenue') setGoalInputValue(dailyRevenueGoal);
    else setGoalInputValue(monthlyRevenueGoal);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = () => {
    const val = Number(goalInputValue);
    if (isNaN(val) || val <= 0) return;

    if (editingGoalTarget === 'daily_approaches') {
      updateSettings({ dailyGoal: val });
      showToast(`Meta de abordagens diárias atualizada para ${val}!`);
    } else if (editingGoalTarget === 'daily_revenue') {
      updateSettings({ dailyRevenueGoal: val });
      showToast(`Meta de faturamento diário atualizada para ${formatBRL(val)}!`);
    } else {
      updateSettings({ monthlyRevenueGoal: val });
      showToast(`Meta de faturamento mensal atualizada para ${formatBRL(val)}!`);
    }
    setIsGoalModalOpen(false);
  };

  // Concluir Retorno Rápido
  const handleConfirmCompletion = () => {
    if (!completingLead) return;

    const leadId = completingLead.id;
    addTimelineEvent(leadId, {
      title: 'Retorno comercial concluído',
      description: completionNote ? `Anotação: ${completionNote}` : 'Retorno registrado pelo dashboard operacional.',
      type: 'status_changed',
    });

    // Limpar data de retorno ou reagendar
    updateLead(leadId, {
      nextFollowUpDate: undefined,
      nextAction: undefined,
    });

    showToast(`Retorno com ${completingLead.name} concluído com sucesso!`);
    setCompletingLead(null);
    setCompletionNote('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* CABEÇALHO DO DASHBOARD + BARRA DE FILTROS DE PERÍODO      */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#C9A46B]">
                PAINEL OPERACIONAL LUMINA
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                V1.3
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
              Dashboard Operacional
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe metas, decisões, próximos retornos e desempenho analítico por nicho.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
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

        {/* SELETOR DE PERÍODO COMPLETO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#141923] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#C9A46B] shrink-0 ml-1" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Período de Análise:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7d', label: '7 dias' },
              { id: '14d', label: '14 dias' },
              { id: '30d', label: '30 dias' },
              { id: 'mes_atual', label: 'Mês atual' },
              { id: 'todo', label: 'Todo o período' },
              { id: 'personalizado', label: 'Personalizado' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as PeriodType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-[#C9A46B] text-slate-950 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Pickers se Personalizado */}
          {selectedPeriod === 'personalizado' && (
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 1: METAS COMERCIAIS E FINANCEIRAS (3 METAS V1.3)    */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#C9A46B]" />
            <span>Metas Comerciais & Financeiras</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Clique no ícone de lápis para ajustar qualquer meta
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* META 1: ABORDAGENS DIÁRIAS (OPERACIONAL) */}
          <div className="relative p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <button
              onClick={() => handleOpenGoalModal('daily_approaches')}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Ajustar meta de abordagens diárias"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C9A46B]/15 text-[#C9A46B] flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Meta 1: Abordagens Hoje
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 dark:text-white">
                  {approachesToday}{' '}
                  <span className="text-sm font-normal text-slate-400">/ {dailyApproachesGoal}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#C9A46B]">
                  {approachesDisplayPercent}%
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2.5">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A46B] to-[#E6C387] rounded-full transition-all duration-500"
                  style={{ width: `${approachesProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                {currentStreak} dias de ofensiva
              </span>
              <span>
                {approachesToday >= dailyApproachesGoal
                  ? 'Meta atingida!'
                  : `Faltam ${dailyApproachesGoal - approachesToday}`}
              </span>
            </div>
          </div>

          {/* META 2: FATURAMENTO DIÁRIO (R$) */}
          <div className="relative p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <button
              onClick={() => handleOpenGoalModal('daily_revenue')}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Ajustar meta de faturamento diário"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs font-mono">
                  R$
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Meta 2: Faturamento Diário
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 dark:text-white">
                  {formatBRL(salesAmountToday)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {formatBRL(dailyRevenueGoal)}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {dailyRevenueDisplayPercent}%
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${dailyRevenueProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-500" />
                Caixa hoje: {formatBRL(cashReceivedToday)}
              </span>
              <span>
                {salesAmountToday >= dailyRevenueGoal
                  ? 'Meta batida!'
                  : `Faltam ${formatBRL(Math.max(0, dailyRevenueGoal - salesAmountToday))}`}
              </span>
            </div>
          </div>

          {/* META 3: FATURAMENTO MENSAL (R$) */}
          <div className="relative p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group">
            <button
              onClick={() => handleOpenGoalModal('monthly_revenue')}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Ajustar meta de faturamento mensal"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Meta 3: Faturamento Mensal
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 dark:text-white">
                  {formatBRL(salesAmountCurrentMonth)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {formatBRL(monthlyRevenueGoal)}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {monthlyRevenueDisplayPercent}%
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2.5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${monthlyRevenueProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Receipt className="w-3 h-3 text-indigo-400" />
                Caixa mês: {formatBRL(cashReceivedCurrentMonth)}
              </span>
              <span>
                {salesAmountCurrentMonth >= monthlyRevenueGoal
                  ? 'Meta batida!'
                  : `Faltam ${formatBRL(Math.max(0, monthlyRevenueGoal - salesAmountCurrentMonth))}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 2: 8 CARDS DE INDICADORES NO PERÍODO (KPIS)         */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Resultados do Período ({periodLabel})
          </h2>
          <span className="text-xs text-slate-400">
            {periodStartStr} até {periodEndStr}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card: Total Leads */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Total de Leads</span>
              <Users className="w-4 h-4 text-[#C9A46B]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
              {totalLeads}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Base cadastrada ativa</p>
          </div>

          {/* Card: Abordagens */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Abordagens</span>
              <Send className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
              {periodApproaches}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              No período selecionado
            </p>
          </div>

          {/* Card: Respostas & Taxa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Respostas</span>
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
              {periodResponses}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {formatPercent(periodResponseRate)} de taxa de resposta
            </p>
          </div>

          {/* Card: Interessados */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Interessados</span>
              <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
              {interestedLeadsCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Oportunidades aquecidas</p>
          </div>

          {/* Card: Vendas Fechadas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Vendas Fechadas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white pt-1">
              {periodSalesCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {formatPercent(periodConversionRate)} de conversão
            </p>
          </div>

          {/* Card: Faturamento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Faturamento</span>
              <Receipt className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-1">
              {formatBRL(periodSoldValue)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Vendas assinadas no período</p>
          </div>

          {/* Card: Caixa Recebido */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Caixa Recebido</span>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-1">
              {formatBRL(periodCashReceived)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Entradas quitadas</p>
          </div>

          {/* Card: Ticket Médio / Saldo Pendente */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Ticket Médio</span>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white pt-1">
              {formatBRL(periodAverageTicket)}
            </div>
            <p className="text-[11px] text-amber-500 font-semibold truncate">
              {formatBRL(totalPendingBalance)} a receber
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 3: CENTRAL DE ATENÇÃO COMERCIAL (RETORNOS E FOLLOWS) */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Central de Atenção Comercial & Próximos Retornos
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhamentos pendentes, sem resposta, visualizados e follow-ups agendados para não perder vendas.
            </p>
          </div>

          {/* Filtros de Categoria de Tempo (Atrasados, Hoje, Próximos, Todos) */}
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-none flex items-center bg-slate-100 dark:bg-[#161b26] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 touch-pan-x -webkit-overflow-scrolling-touch">
            <button
              onClick={() => setAttentionCategory('todos')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                attentionCategory === 'todos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({attentionCounts.total})
            </button>
            <button
              onClick={() => setAttentionCategory('atrasados')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                attentionCategory === 'atrasados'
                  ? 'bg-rose-500 text-white shadow-xs font-bold'
                  : 'text-rose-500 hover:bg-rose-500/10'
              }`}
            >
              Atrasados ({attentionCounts.overdue})
            </button>
            <button
              onClick={() => setAttentionCategory('hoje')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                attentionCategory === 'hoje'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-amber-500 hover:bg-amber-500/10'
              }`}
            >
              Hoje ({attentionCounts.today})
            </button>
            <button
              onClick={() => setAttentionCategory('proximos')}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                attentionCategory === 'proximos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Próximos ({attentionCounts.upcoming})
            </button>
          </div>
        </div>

        {/* Sub-filtros por Tipo de Pendência */}
        <div className="w-full overflow-x-auto scrollbar-none flex items-center gap-2 pt-1 touch-pan-x -webkit-overflow-scrolling-touch">
          {[
            { id: 'todos', label: 'Todos os tipos' },
            { id: 'sem_resposta', label: 'Sem resposta' },
            { id: 'visualizou', label: 'Visualizou e não respondeu' },
            { id: 'followup', label: 'Follow-up pendente' },
            { id: 'remarketing', label: 'Remarketing' },
            { id: 'negociacao', label: 'Negociação / Proposta' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setAttentionTag(tag.id as AttentionFilterTag)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                attentionTag === tag.id
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Lista de Retornos Pendentes */}
        {attentionLeads.length === 0 ? (
          <div className="py-10 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto stroke-[1.5]" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-2">
              Tudo em dia por aqui!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhum lead com retorno comercial pendente nesta categoria. Prospecções ativas continuam operando normalmente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {attentionLeads.slice(0, 8).map(({ lead, actionDate, timing }) => {
              const isOverdue = timing === 'atrasado';
              const isToday = timing === 'hoje';

              return (
                <div
                  key={lead.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                          : isToday
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
                      }`}
                    >
                      {lead.status === 'demonstracao_enviada' ? (
                        <Eye className="w-4 h-4" />
                      ) : lead.status === 'novo_lead' ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {lead.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {lead.niche}
                        </span>
                        {/* Tag de Canal */}
                        {lead.whatsapp && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <Phone className="w-3 h-3" /> WhatsApp
                          </span>
                        )}
                        {lead.instagram && !lead.whatsapp && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                            <Instagram className="w-3 h-3" /> @{lead.instagram}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                            isOverdue
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : isToday
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isOverdue
                            ? actionDate
                              ? `Atrasado (${formatDateBR(actionDate)})`
                              : 'Atrasado (sem data agendada)'
                            : isToday
                            ? 'Agendado para hoje'
                            : `Retorno em ${formatDateBR(actionDate)}`}
                        </span>

                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-md">
                          {lead.nextAction || lead.notes || 'Aguardando contato ou avanço de etapa.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setCompletingLead(lead)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
                      title="Concluir este retorno e registrar no histórico"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('prospecting');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors"
                      title="Abrir scripts e mensagens de atendimento"
                    >
                      Atendimento
                    </button>

                    <button
                      onClick={() => openEditLeadModal(lead.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Abrir ficha completa do lead"
                    >
                      Ficha
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 4: DESEMPENHO POR NICHO (ANALÍTICO)                  */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#C9A46B]" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Desempenho por Nicho
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análise comparativa de volume, respostas, conversão e faturamento por segmento atendido no período.
            </p>
          </div>

          {/* Sorter no Desktop: Segmented Control com Ícones */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#C9A46B]" />
              Ordenar por:
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-[#161b26] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {NICHE_SORT_OPTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = nicheSort === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setNicheSort(s.id as NicheSortMetric)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#C9A46B] text-slate-950 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sorter no Mobile: Mini-Sessões Deslizáveis com Toque Fluido, Sem Quebras e Sem Cortes */}
        <div className="sm:hidden w-full space-y-2">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A46B]" />
              Classificar nichos por:
            </span>
            <span className="text-[11px] font-mono font-bold text-[#C9A46B] bg-[#C9A46B]/10 px-2 py-0.5 rounded-md border border-[#C9A46B]/20">
              {NICHE_SORT_OPTIONS.find((o) => o.id === nicheSort)?.label}
            </span>
          </div>

          <div className="w-full overflow-x-auto scrollbar-none flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#161b26] rounded-xl border border-slate-200 dark:border-slate-800 touch-pan-x -webkit-overflow-scrolling-touch">
            {NICHE_SORT_OPTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = nicheSort === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setNicheSort(s.id as NicheSortMetric)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#C9A46B] text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/40 dark:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualização Desktop: Tabela Analítica Elegante */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Nicho</th>
                <th className="py-3 px-3 text-center">Leads Cadastrados</th>
                <th className="py-3 px-3 text-center">Abordagens</th>
                <th className="py-3 px-3 text-center">Respostas (% Taxa)</th>
                <th className="py-3 px-3 text-center">Interessados</th>
                <th className="py-3 px-3 text-center">Vendas Fechadas</th>
                <th className="py-3 px-3 text-center">Conversão</th>
                <th className="py-3 px-3 text-right">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {nicheAnalytics.list.map((item) => {
                const revenuePercent = Math.round((item.revenue / nicheAnalytics.maxRevenue) * 100);

                return (
                  <tr
                    key={item.niche}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.niche}
                      </div>
                      {/* Barra de contribuição financeira relativa */}
                      <div className="w-32 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${revenuePercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.totalLeads}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-slate-800 dark:text-slate-200">
                      {item.approaches}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{item.responses}</span>{' '}
                      <span className="text-slate-400 text-[11px]">
                        ({formatPercent(item.responseRate)})
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-rose-500 font-bold">
                      {item.interested}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.sales}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#C9A46B]">
                      {formatPercent(item.conversionRate)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatBRL(item.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visualização Mobile: Cards Verticais Inteligentes e Responsivos */}
        <div className="md:hidden space-y-3">
          {nicheAnalytics.list.map((item, index) => {
            const revenuePercent = Math.round((item.revenue / nicheAnalytics.maxRevenue) * 100);

            return (
              <div
                key={item.niche}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                {/* Cabeçalho do Card Mobile com Rank e Receita */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#C9A46B]/15 text-[#C9A46B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 border border-[#C9A46B]/25">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.niche}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm shrink-0">
                    {formatBRL(item.revenue)}
                  </span>
                </div>

                {/* Barra de Contribuição Financeira */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C9A46B] to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${revenuePercent}%` }}
                  />
                </div>

                {/* Grade 4 Métricas Chave com Destaque para a Métrica Selecionada */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Abordagens */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      nicheSort === 'approaches'
                        ? 'bg-[#C9A46B]/10 border-[#C9A46B]/50 ring-1 ring-[#C9A46B]/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Abordagens</span>
                      <Send className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {item.approaches}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.totalLeads} na base
                    </span>
                  </div>

                  {/* Respostas */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      nicheSort === 'response_rate'
                        ? 'bg-[#C9A46B]/10 border-[#C9A46B]/50 ring-1 ring-[#C9A46B]/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Respostas</span>
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {item.responses}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                      {formatPercent(item.responseRate)} taxa
                    </span>
                  </div>

                  {/* Vendas */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      nicheSort === 'sales'
                        ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Vendas Fechadas</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {item.sales}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.interested} interessado(s)
                    </span>
                  </div>

                  {/* Conversão */}
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      nicheSort === 'conversion'
                        ? 'bg-[#C9A46B]/10 border-[#C9A46B]/50 ring-1 ring-[#C9A46B]/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Taxa Conversão</span>
                      <ArrowUpRight className="w-3 h-3 text-[#C9A46B]" />
                    </div>
                    <span className="font-bold font-mono text-[#C9A46B] text-sm">
                      {formatPercent(item.conversionRate)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {item.approaches > 0 ? `${item.sales}/${item.approaches} vendas` : 'Sem abordagens'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 5: GRÁFICO DINÂMICO EM TEMPO REAL "EVOLUÇÃO COMERCIAL" */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C9A46B]" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Evolução Comercial Diária
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize o comportamento dia a dia de abordagens, vendas e recebimentos em caixa.
            </p>
          </div>

          {/* Toggle de 4 Métricas */}
          <div className="w-full sm:w-auto overflow-x-auto scrollbar-none flex items-center bg-slate-100 dark:bg-[#161b26] p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 touch-pan-x -webkit-overflow-scrolling-touch">
            <button
              onClick={() => setChartMetric('sales_amount')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                chartMetric === 'sales_amount'
                  ? 'bg-[#C9A46B] text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Faturamento (R$)
            </button>
            <button
              onClick={() => setChartMetric('cash_received')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                chartMetric === 'cash_received'
                  ? 'bg-emerald-500 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Caixa Recebido (R$)
            </button>
            <button
              onClick={() => setChartMetric('approaches')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                chartMetric === 'approaches'
                  ? 'bg-[#C9A46B] text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Abordagens
            </button>
            <button
              onClick={() => setChartMetric('sales_count')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                chartMetric === 'sales_count'
                  ? 'bg-[#C9A46B] text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vendas (Qtd)
            </button>
          </div>
        </div>

        {/* Visualização de Barras Responsivas */}
        <div className="pt-2">
          <div className="h-56 flex items-end gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            {chartData.items.map((item) => {
              let val = 0;
              if (chartMetric === 'sales_amount') val = item.salesAmount;
              else if (chartMetric === 'cash_received') val = item.cashReceived;
              else if (chartMetric === 'approaches') val = item.approaches;
              else val = item.salesCount;

              const heightPercent = Math.max(8, Math.round((val / chartData.maxVal) * 100));
              const isToday = item.date === todayStr;

              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative min-w-0"
                >
                  {/* Tooltip Hover */}
                  <div className="absolute -top-14 z-20 hidden group-hover:flex flex-col items-center pointer-events-none">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-mono font-bold shadow-xl border border-slate-700 whitespace-nowrap">
                      {item.label}:{' '}
                      {chartMetric === 'sales_amount'
                        ? formatBRL(item.salesAmount)
                        : chartMetric === 'cash_received'
                        ? formatBRL(item.cashReceived)
                        : chartMetric === 'approaches'
                        ? `${item.approaches} abordagem(ns)`
                        : `${item.salesCount} venda(s)`}
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                  </div>

                  {/* Valor no Topo da Barra */}
                  {val > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1 hidden sm:block truncate max-w-full">
                      {chartMetric === 'sales_amount' || chartMetric === 'cash_received'
                        ? formatBRL(val).replace(',00', '')
                        : val}
                    </span>
                  )}

                  {/* Barra */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                      chartMetric === 'cash_received'
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
                    className={`text-[10px] font-mono mt-2 truncate ${
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
      {/* SEÇÃO 6: OFENSIVA DUOLINGO (COMPACTA) + DISTRIBUIÇÃO FUNIL */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner de Ofensiva Comercial Duolingo (Compacto) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:via-[#151922] dark:to-[#151922] border border-amber-500/30 dark:border-amber-500/20 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md shadow-amber-500/10 shrink-0">
              <Flame className="w-7 h-7 fill-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                  {currentStreak} Dias
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  OFENSIVA
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {streakStatus.isSaved
                  ? 'Fogo aceso! Meta de hoje batida.'
                  : `Faltam ${streakStatus.remaining} abordagens para salvar seu dia.`}
              </p>
            </div>
          </div>

          {/* 7 Dias da Semana em Círculos */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {day.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    day.reachedGoal
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50'
                      : day.isToday
                      ? 'border-2 border-dashed border-amber-500 text-amber-500 bg-amber-500/10'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                  title={`${day.date}: ${day.count} abordagem(ns)`}
                >
                  {day.reachedGoal ? (
                    <Flame className="w-4 h-4 fill-slate-950" />
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

        {/* Distribuição do Funil Comercial */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Distribuição do Funil de Conversão
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Posição dos contatos ao longo das 14 etapas comerciais ativas
              </p>
            </div>
            <button
              onClick={() => setActiveTab('crm')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-colors"
            >
              Abrir CRM
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
            {FUNNEL_STAGES.slice(0, 8).map((stage) => {
              const count = funnelCounts[stage.id] || 0;
              const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-2">
                      {stage.order}. {stage.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                      {count}
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
      </div>

      {/* ========================================================= */}
      {/* SEÇÃO 7: ATIVIDADE RECENTE                                */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Histórico de Atividade Recente
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registro cronológico de abordagens, respostas e interações gravadas no navegador
            </p>
          </div>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
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

      {/* ========================================================= */}
      {/* MODAL: AJUSTE RÁPIDO DE METAS                             */}
      {/* ========================================================= */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#161b26] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C9A46B]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Ajustar Meta Comercial
                </h3>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                {editingGoalTarget === 'daily_approaches'
                  ? 'Abordagens diárias desejadas:'
                  : editingGoalTarget === 'daily_revenue'
                  ? 'Faturamento diário desejado (R$):'
                  : 'Faturamento mensal desejado (R$):'}
              </label>
              <input
                type="number"
                min="1"
                step={editingGoalTarget === 'daily_approaches' ? '1' : '50'}
                value={goalInputValue}
                onChange={(e) => setGoalInputValue(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#C9A46B]"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Esta meta é salva nas configurações e reflete diretamente nas barras de progresso do dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveGoal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C9A46B] hover:bg-[#d8b47a] text-slate-950 shadow-sm"
              >
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONCLUIR RETORNO RÁPIDO                            */}
      {/* ========================================================= */}
      {completingLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#161b26] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Concluir Retorno Comercial
                </h3>
              </div>
              <button
                onClick={() => setCompletingLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registrar que o retorno com <strong className="text-slate-900 dark:text-white">{completingLead.name}</strong> foi realizado com sucesso.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Anotação do contato (opcional):
              </label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Ex: Conversamos sobre o pacote Prata, pediu para retornar na quinta-feira após as 14h..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C9A46B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCompletingLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar Conclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
