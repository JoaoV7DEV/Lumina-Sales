import { LeadStatus, FunnelPhaseGroup, FunnelStageMeta, Lead } from './types';

export function formatBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
    return '0,0%';
  }
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

export function formatDateBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch {
    return '-';
  }
}

export function formatDateTimeBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch {
    return '-';
  }
}

export function cleanDigits(input?: string): string {
  if (!input) return '';
  return input.replace(/\D/g, '');
}

export function normalizePhoneDisplay(phone?: string): string {
  if (!phone) return '-';
  const digits = cleanDigits(phone);
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

export function buildWhatsAppUrl(phone?: string, text?: string): string {
  if (!phone) return '#';
  let digits = cleanDigits(phone);
  if (!digits) return '#';
  if (!digits.startsWith('55') && digits.length <= 11) {
    digits = `55${digits}`;
  }
  const baseUrl = `https://wa.me/${digits}`;
  if (text && text.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(text.trim())}`;
  }
  return baseUrl;
}

export function normalizeInstagramHandle(handle?: string): string {
  if (!handle) return '';
  let clean = handle.trim();
  if (clean.includes('instagram.com/')) {
    const parts = clean.split('instagram.com/');
    clean = parts[1]?.split('/')[0]?.split('?')[0] || clean;
  }
  if (!clean.startsWith('@')) {
    clean = `@${clean}`;
  }
  return clean;
}

export function buildInstagramUrl(handle?: string): string {
  if (!handle) return '#';
  const clean = handle.replace('@', '').trim();
  if (!clean) return '#';
  return `https://instagram.com/${clean}`;
}

// 14 Etapas Reais do Processo Lumina Studio
export const FUNNEL_STAGES: FunnelStageMeta[] = [
  {
    id: 'novo_lead',
    label: 'Novo Lead',
    group: 'prospeccao',
    order: 1,
    description: 'Contato prospectado recém-cadastrado na base.',
  },
  {
    id: 'demonstracao_enviada',
    label: 'Demonstração Enviada',
    group: 'prospeccao',
    order: 2,
    description: 'Mensagem de abordagem inicial ou portfólio visual enviado.',
  },
  {
    id: 'interessado',
    label: 'Interessado',
    group: 'prospeccao',
    order: 3,
    description: 'Lead respondeu positivamente demonstrando interesse no ensaio.',
  },
  {
    id: 'pacote_enviado',
    label: 'Pacote Enviado',
    group: 'apresentacao',
    order: 4,
    description: 'Tabela de preços ou proposta comercial compartilhada.',
  },
  {
    id: 'catalogo_enviado',
    label: 'Catálogo Enviado',
    group: 'apresentacao',
    order: 5,
    description: 'Opções de ensaios e fotos de exemplo para escolha de estilo.',
  },
  {
    id: 'escolhendo_referencias',
    label: 'Escolhendo Referências',
    group: 'referencias',
    order: 6,
    description: 'Cliente selecionando looks, cenários ou enviando selfies.',
  },
  {
    id: 'producao_fotos',
    label: 'Produção das Fotos',
    group: 'producao',
    order: 7,
    description: 'Fotos em processamento com IA e refinamento humano.',
  },
  {
    id: 'previa_enviada',
    label: 'Prévia Enviada',
    group: 'producao',
    order: 8,
    description: 'Prévia com marca d’água entregue para aprovação do cliente.',
  },
  {
    id: 'escolhendo_fotos_finais',
    label: 'Escolhendo Fotos Finais',
    group: 'producao',
    order: 9,
    description: 'Cliente escolhendo as fotos favoritas do pacote contratado.',
  },
  {
    id: 'pagamento_pendente',
    label: 'Pagamento Pendente',
    group: 'pagamento',
    order: 10,
    description: 'Chave Pix ou link de pagamento enviado aguardando quitação.',
  },
  {
    id: 'pago',
    label: 'Pago',
    group: 'pagamento',
    order: 11,
    description: 'Pagamento confirmado e compensado no caixa.',
  },
  {
    id: 'entrega_fotos',
    label: 'Entrega das Fotos',
    group: 'pos_venda',
    order: 12,
    description: 'Ensaio final em alta resolução entregue via link privado.',
  },
  {
    id: 'avaliacao_recebida',
    label: 'Avaliação Recebida',
    group: 'pos_venda',
    order: 13,
    description: 'Depoimento e nota de satisfação coletados.',
  },
  {
    id: 'pedir_indicacao',
    label: 'Pedir Indicação',
    group: 'pos_venda',
    order: 14,
    description: 'Script de pós-venda para indicação de amigas e colegas.',
  },
];

export const FUNNEL_PHASE_GROUPS: {
  id: FunnelPhaseGroup;
  title: string;
  stageIds: LeadStatus[];
  color: string;
}[] = [
  {
    id: 'prospeccao',
    title: '1. Prospecção',
    stageIds: ['novo_lead', 'demonstracao_enviada', 'interessado'],
    color: 'border-blue-500/40 text-blue-400',
  },
  {
    id: 'apresentacao',
    title: '2. Apresentação',
    stageIds: ['pacote_enviado', 'catalogo_enviado'],
    color: 'border-cyan-500/40 text-cyan-400',
  },
  {
    id: 'referencias',
    title: '3. Referências',
    stageIds: ['escolhendo_referencias'],
    color: 'border-purple-500/40 text-purple-400',
  },
  {
    id: 'producao',
    title: '4. Produção',
    stageIds: ['producao_fotos', 'previa_enviada', 'escolhendo_fotos_finais'],
    color: 'border-amber-500/40 text-amber-400',
  },
  {
    id: 'pagamento',
    title: '5. Pagamento',
    stageIds: ['pagamento_pendente', 'pago'],
    color: 'border-emerald-500/40 text-emerald-400',
  },
  {
    id: 'pos_venda',
    title: '6. Pós-venda',
    stageIds: ['entrega_fotos', 'avaliacao_recebida', 'pedir_indicacao'],
    color: 'border-[#C9A46B]/40 text-[#C9A46B]',
  },
];

export const EXCLUSION_STATUSES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'sem_interesse', label: 'Sem interesse', color: 'text-slate-400 bg-slate-500/10' },
  { id: 'nao_contatar', label: 'Não contatar', color: 'text-rose-400 bg-rose-500/10' },
  { id: 'arquivado', label: 'Arquivado', color: 'text-zinc-400 bg-zinc-500/10' },
];

// Migração segura de status anteriores para o novo modelo de 14 etapas
export function migrateLeadStatus(oldStatus: string): LeadStatus {
  switch (oldStatus) {
    case 'new':
    case 'qualified':
      return 'novo_lead';
    case 'contacted':
    case 'waiting_reply':
      return 'demonstracao_enviada';
    case 'interested':
      return 'interessado';
    case 'negotiating':
      return 'pacote_enviado';
    case 'preview_production':
      return 'producao_fotos';
    case 'waiting_payment':
      return 'pagamento_pendente';
    case 'closed':
      return 'pago';
    case 'not_interested':
      return 'sem_interesse';
    case 'do_not_contact':
      return 'nao_contatar';
    case 'archived':
      return 'arquivado';
    default:
      // Se já for um dos novos status
      const exists = FUNNEL_STAGES.some((s) => s.id === oldStatus) ||
        EXCLUSION_STATUSES.some((s) => s.id === oldStatus);
      return exists ? (oldStatus as LeadStatus) : 'novo_lead';
  }
}

export function getLeadStatusLabel(status: LeadStatus): string {
  const stage = FUNNEL_STAGES.find((s) => s.id === status);
  if (stage) return stage.label;
  const excl = EXCLUSION_STATUSES.find((s) => s.id === status);
  if (excl) return excl.label;
  return status;
}

export function getLeadStatusBadgeClass(status: LeadStatus): string {
  switch (status) {
    case 'novo_lead':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    case 'demonstracao_enviada':
      return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    case 'interessado':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'pacote_enviado':
    case 'catalogo_enviado':
      return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
    case 'escolhendo_referencias':
      return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
    case 'producao_fotos':
    case 'previa_enviada':
    case 'escolhendo_fotos_finais':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'pagamento_pendente':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'pago':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold';
    case 'entrega_fotos':
    case 'avaliacao_recebida':
    case 'pedir_indicacao':
      return 'bg-[#C9A46B]/15 text-[#C9A46B] border border-[#C9A46B]/30';
    case 'sem_interesse':
      return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
    case 'nao_contatar':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
    case 'arquivado':
      return 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20';
    default:
      return 'bg-slate-800 text-slate-300';
  }
}

// Substituição robusta de variáveis de template
export function replaceScriptVariables(
  template: string,
  lead?: Partial<Lead>,
  attendantName: string = 'João'
): string {
  if (!template) return '';
  let result = template;

  const rawName = lead?.name?.trim() || '';
  const firstName = rawName.split(' ')[0] || '';
  const niche = lead?.niche?.trim() || 'sua área';
  const city = lead?.cityState?.trim() || '';

  // Substitui [Nome], [NOME], {nome}, {NOME}, [nome]
  result = result.replace(/\[Nome\]/gi, firstName || '[Nome]');
  result = result.replace(/\{nome\}/gi, firstName || '{nome}');
  result = result.replace(/\[NOME\]/gi, (firstName || '[NOME]').toUpperCase());
  result = result.replace(/\{NOME\}/gi, (firstName || '{NOME]').toUpperCase());

  // Substitui [PROFISSÃO], [Profissão], {profissao}, {nicho}, [nicho]
  result = result.replace(/\[PROFISSÃO\]/gi, niche);
  result = result.replace(/\[Profissão\]/gi, niche);
  result = result.replace(/\{profissao\}/gi, niche);
  result = result.replace(/\{nicho\}/gi, niche);
  result = result.replace(/\[nicho\]/gi, niche);

  // Substitui cidade
  result = result.replace(/\{cidade\}/gi, city || 'sua região');
  result = result.replace(/\[CIDADE\]/gi, (city || 'SUA REGIÃO').toUpperCase());

  // Substitui nome do atendente
  result = result.replace(/\{seu nome\}/gi, attendantName);
  result = result.replace(/\{nome_atendente\}/gi, attendantName);
  result = result.replace(/\[SEU NOME\]/gi, attendantName.toUpperCase());
  result = result.replace(/\[seu nome\]/gi, attendantName);

  return result;
}

export function calculateCommercialMetrics(variants: {
  approaches: number;
  responses: number;
  interested: number;
  sales: number;
  revenue: number;
}) {
  const approaches = Math.max(0, variants.approaches || 0);
  const responses = Math.max(0, variants.responses || 0);
  const interested = Math.max(0, variants.interested || 0);
  const sales = Math.max(0, variants.sales || 0);
  const revenue = Math.max(0, variants.revenue || 0);

  const responseRate = approaches > 0 ? (responses / approaches) * 100 : 0;
  const interestRate = responses > 0 ? (interested / responses) * 100 : 0;
  const conversionRate = approaches > 0 ? (sales / approaches) * 100 : 0;
  const revenuePerApproach = approaches > 0 ? revenue / approaches : 0;

  return {
    approaches,
    responses,
    interested,
    sales,
    revenue,
    responseRate,
    interestRate,
    conversionRate,
    revenuePerApproach,
    isLowSample: approaches < 30,
  };
}
