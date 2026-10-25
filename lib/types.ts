// Tipos estritos e modelos do Lumina Sales V1.2

export type LeadStatus =
  // Novas 14 Etapas do Processo Real Lumina Studio
  | 'novo_lead'
  | 'demonstracao_enviada'
  | 'interessado'
  | 'pacote_enviado'
  | 'catalogo_enviado'
  | 'escolhendo_referencias'
  | 'producao_fotos'
  | 'previa_enviada'
  | 'escolhendo_fotos_finais'
  | 'pagamento_pendente'
  | 'pago'
  | 'entrega_fotos'
  | 'avaliacao_recebida'
  | 'pedir_indicacao'
  // Situações de exclusão / arquivo
  | 'sem_interesse'
  | 'nao_contatar'
  | 'arquivado'
  // Retrocompatibilidade temporária com V1.0
  | 'new'
  | 'qualified'
  | 'contacted'
  | 'waiting_reply'
  | 'negotiating'
  | 'preview_production'
  | 'waiting_payment'
  | 'closed'
  | 'not_interested'
  | 'do_not_contact';

export type FunnelPhaseGroup =
  | 'prospeccao'
  | 'apresentacao'
  | 'referencias'
  | 'producao'
  | 'pagamento'
  | 'pos_venda';

export interface FunnelStageMeta {
  id: LeadStatus;
  label: string;
  group: FunnelPhaseGroup;
  order: number;
  description: string;
}

export type LeadPriority = 'low' | 'medium' | 'high';

export interface LeadOpportunities {
  noProfessionalPhotos: boolean;
  limitedPhotos: boolean;
  noBioLink: boolean;
  poorBioLink: boolean;
  noWebsite: boolean;
  poorWebsite: boolean;
  needsBranding: boolean;
  complementaryServices: boolean;
}

export type TimelineEventType =
  | 'created'
  | 'approach_confirmed'
  | 'response_received'
  | 'interested_marked'
  | 'pricing_sent'
  | 'package_selected'
  | 'preview_produced'
  | 'sale_closed'
  | 'payment_received'
  | 'status_changed'
  | 'note_added'
  | 'followup_scheduled';

export interface ActivityTimelineEvent {
  id: string;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Lead {
  id: string;
  name: string;
  businessName?: string;
  niche: string;
  instagram: string; // @usuario ou URL
  whatsapp?: string; // Telefone com DDD
  cityState?: string;
  source: string; // Ex: Prospecção Ativa Instagram, Indicação, etc.
  createdAt: string;
  updatedAt?: string;
  status: LeadStatus;
  priority: LeadPriority;
  notes: string;
  nextAction?: string;
  nextFollowUpDate?: string; // YYYY-MM-DD
  scriptId?: string;
  creativeId?: string;
  packageInterestId?: string;
  priceTablePresented?: 'tabela_1' | 'tabela_2';
  tags?: string[]; // Ex: 'aguardando_resposta', 'precisa_retorno', 'urgente'
  opportunities: LeadOpportunities;
  timeline: ActivityTimelineEvent[];
}

export type ScriptCategory =
  | 'first_approach'
  | 'personalized_approach'
  | 'short_approach'
  | 'initial_response'
  | 'demo_send'
  | 'interest_validation'
  | 'service_presentation'
  | 'objections'
  | 'pricing'
  | 'catalog'
  | 'references'
  | 'production'
  | 'preview'
  | 'revisions'
  | 'payment'
  | 'post_sale'
  | 'referral'
  | 'followup'
  | 'remarketing';

export type ScriptModality = 'whatsapp_text' | 'audio_script';

export interface Script {
  id: string;
  code: string; // Ex: "SC-01-AB-V1", "SC-14-OB-PRECO"
  name: string;
  version: string;
  category: ScriptCategory;
  commercialStage: string;
  targetNiche: string; // Específico ou "Todos"
  isGeneral: boolean;
  modality: ScriptModality; // Texto para WhatsApp vs Roteiro para áudio manual
  text: string;
  internalNotes: string;
  sourcePage: string; // Página do documento original (ex: "Pág. 3", "Pág. 10-12")
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type CreativeFormat = '1:1' | '4:5' | '5:4';

export interface Creative {
  id: string;
  name: string;
  version: string;
  niche: string;
  format: CreativeFormat;
  resultsCount: number;
  hasTitle: boolean;
  notes: string;
  imageUrl?: string;
  dataUrl?: string; // Imagem em base64 salva em IndexedDB
  fileSizeKb?: number;
  active: boolean;
  createdAt: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  scriptId?: string;
  creativeId?: string;
  packageId?: string;
  approaches: number;
  responses: number;
  interested: number;
  sales: number;
  revenue: number;
}

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  category: 'modalidade_ab' | 'nicho_vs_geral' | 'curto_vs_longo' | 'tabela_precos' | 'objecoes';
  niche: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  variants: ExperimentVariant[];
  conclusions?: string;
}

export type ServiceCategory =
  | 'ai_photoshoot'
  | 'individual_photos'
  | 'custom_bio_link'
  | 'bio_link_revamp'
  | 'custom_pro_website'
  | 'complementary_services';

export interface PackageOffer {
  id: string;
  tableType: 'tabela_1' | 'tabela_2';
  name: string;
  serviceCategory: ServiceCategory;
  photoCount: number;
  extraPhotos: number;
  price: number;
  description: string;
  includedBenefits: string[];
  bonuses: string[];
  hasBioLink: boolean;
  hasWebsite: boolean;
  active: boolean;
}

export type FinancialStatus =
  | 'waiting_payment'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'
  | 'refunded';

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
  method: string; // Pix, Cartão, Boleto, Dinheiro
  notes?: string;
}

export interface Sale {
  id: string;
  leadId: string;
  leadName: string;
  closedDate: string;
  serviceName: string;
  tableType?: 'tabela_1' | 'tabela_2';
  packageId?: string;
  originalValue: number;
  discount: number;
  finalValue: number;
  paymentMethod: string;
  dueDate?: string;
  notes?: string;
  status: FinancialStatus;
  payments: PaymentEntry[];
}

export type ExpenseCategory =
  | 'ai_tools'
  | 'subscriptions'
  | 'advertising'
  | 'infrastructure'
  | 'other';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
}

export interface TaskItem {
  id: string;
  leadId?: string;
  leadName?: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  priority: LeadPriority;
  completed: boolean;
  notes?: string;
}

export interface ProductivitySession {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  approachesCount: number;
  qualifiedCount: number;
  notes?: string;
}

export interface AppSettings {
  attendantName: string; // Padrão "João"
  defaultPriceTable: 'tabela_1' | 'tabela_2';
  dailyGoal: number;
  theme: 'dark' | 'light';
  timezone: string;
  isDemoData: boolean;
  customNiches: string[];
}

export interface DatabaseState {
  version: string;
  lastUpdated: string;
  leads: Lead[];
  scripts: Script[];
  creatives: Creative[];
  experiments: Experiment[];
  packages: PackageOffer[];
  sales: Sale[];
  expenses: Expense[];
  tasks: TaskItem[];
  productivitySessions: ProductivitySession[];
  settings: AppSettings;
}
