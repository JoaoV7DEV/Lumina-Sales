'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  DatabaseState,
  Lead,
  LeadStatus,
  ActivityTimelineEvent,
  Script,
  Creative,
  CreativeFormat,
  Experiment,
  ExperimentVariant,
  PackageOffer,
  Sale,
  Expense,
  TaskItem,
  ProductivitySession,
  AppSettings,
  PaymentEntry,
} from '@/lib/types';
import {
  loadDatabaseState,
  saveDatabaseState,
  resetToDemoState,
  resetToCleanState,
  exportDatabaseBackupJson,
  importDatabaseBackupJson,
  exportLeadsToCsv,
} from '@/lib/storage';
import { INITIAL_DATABASE_STATE, OFFICIAL_NICHES } from '@/lib/seed-data';
import { cleanDigits, normalizeInstagramHandle } from '@/lib/formatters';

interface LuminaContextType {
  state: DatabaseState;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Quick lead drawer state
  isLeadDrawerOpen: boolean;
  editingLeadId: string | null;
  openNewLeadModal: () => void;
  openEditLeadModal: (id: string) => void;
  closeLeadModal: () => void;
  // Global search modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Productivity timer
  timerActive: boolean;
  timerSeconds: number;
  timerSessionApproaches: number;
  timerSessionQualified: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  finishTimerSession: (notes?: string) => void;
  incrementSessionApproach: () => void;
  incrementSessionQualified: () => void;

  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => Lead;
  fastAddLead: (data: { name: string; contact: string; niche: string; notes?: string }) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus, note?: string) => void;
  addTimelineEvent: (leadId: string, event: Omit<ActivityTimelineEvent, 'id' | 'timestamp'>) => void;
  confirmApproach: (leadId: string, scriptId?: string, creativeId?: string) => void;
  recordResponse: (leadId: string, notes?: string) => void;
  markInterested: (leadId: string, packageId?: string) => void;
  scheduleFollowUp: (leadId: string, date: string, actionText: string) => void;

  // Commercial / Sales
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  addPaymentToSale: (saleId: string, payment: Omit<PaymentEntry, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Scripts & Creatives
  addScript: (script: Omit<Script, 'id' | 'createdAt'>) => void;
  updateScript: (id: string, updates: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  addCreative: (creative: Omit<Creative, 'id' | 'createdAt'>) => void;
  uploadCreativeImage: (
    file: File,
    meta: {
      name: string;
      niche: string;
      format: CreativeFormat;
      resultsCount: number;
      hasTitle: boolean;
      notes?: string;
    }
  ) => Promise<void>;
  updateCreative: (id: string, updates: Partial<Creative>) => void;
  deleteCreative: (id: string) => void;

  // Packages & Experiments
  addPackage: (pkg: Omit<PackageOffer, 'id'>) => void;
  updatePackage: (id: string, updates: Partial<PackageOffer>) => void;
  addExperiment: (exp: Omit<Experiment, 'id'>) => void;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  updateVariantStats: (expId: string, variantId: string, stats: Partial<ExperimentVariant>) => void;

  // Tasks
  addTask: (task: Omit<TaskItem, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Settings & Utilities
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void> | void;
  checkDuplicateLead: (phone?: string, instagram?: string, excludeLeadId?: string) => {
    isDuplicate: boolean;
    reason?: string;
    existingLead?: Lead;
  };
  toggleDemoData: () => Promise<void>;
  resetToClean: () => Promise<void>;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<void>;
  exportCsv: () => void;
}

const LuminaContext = createContext<LuminaContextType | undefined>(undefined);

export function LuminaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseState>(INITIAL_DATABASE_STATE);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerSessionApproaches, setTimerSessionApproaches] = useState(0);
  const [timerSessionQualified, setTimerSessionQualified] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Carregar dados na inicialização
  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadDatabaseState();
        setState(loaded);
      } catch (err) {
        console.error('Falha ao carregar estado do Lumina Sales:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Sincronizar tema no HTML (modo escuro e modo claro)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentTheme = state.settings.theme || 'dark';
      const root = document.documentElement;
      if (currentTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }, [state.settings.theme]);

  const toggleTheme = useCallback(() => {
    setState((prev) => {
      const newTheme: 'dark' | 'light' = prev.settings.theme === 'dark' ? 'light' : 'dark';
      const updated: DatabaseState = {
        ...prev,
        settings: {
          ...prev.settings,
          theme: newTheme,
        },
      };
      saveDatabaseState(updated);
      showToast(newTheme === 'dark' ? 'Modo Escuro ativado' : 'Modo Claro ativado');
      return updated;
    });
  }, [showToast]);

  const startTimer = useCallback(() => {
    setTimerActive(true);
    showToast('Sessão de foco iniciada');
  }, [showToast]);

  const pauseTimer = useCallback(() => {
    setTimerActive(false);
    showToast('Sessão pausada');
  }, [showToast]);

  const resetTimer = useCallback(() => {
    setTimerActive(false);
    setTimerSeconds(0);
    setTimerSessionApproaches(0);
    setTimerSessionQualified(0);
    showToast('Cronômetro zerado');
  }, [showToast]);

  const incrementSessionApproach = useCallback(() => {
    setTimerSessionApproaches((prev) => prev + 1);
  }, []);

  const incrementSessionQualified = useCallback(() => {
    setTimerSessionQualified((prev) => prev + 1);
  }, []);

  const finishTimerSession = useCallback(
    (notes?: string) => {
      if (timerSeconds < 10 && timerSessionApproaches === 0) {
        resetTimer();
        return;
      }

      const now = new Date();
      const newSession: ProductivitySession = {
        id: `sess-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        startTime: new Date(now.getTime() - timerSeconds * 1000).toLocaleTimeString('pt-BR'),
        endTime: now.toLocaleTimeString('pt-BR'),
        durationSeconds: timerSeconds,
        approachesCount: timerSessionApproaches,
        qualifiedCount: timerSessionQualified,
        notes,
      };

      setState((prev) => {
        const updated = {
          ...prev,
          productivitySessions: [newSession, ...(prev.productivitySessions || [])],
        };
        saveDatabaseState(updated);
        return updated;
      });

      showToast(`Sessão finalizada: ${timerSessionApproaches} abordagens registradas!`);
      resetTimer();
    },
    [timerSeconds, timerSessionApproaches, timerSessionQualified, resetTimer, showToast]
  );

  const checkDuplicateLead = useCallback(
    (phone?: string, instagram?: string, excludeLeadId?: string) => {
      const cleanPhone = phone ? cleanDigits(phone) : '';
      const cleanInsta = instagram ? normalizeInstagramHandle(instagram).toLowerCase() : '';

      for (const lead of state.leads) {
        if (excludeLeadId && lead.id === excludeLeadId) continue;

        if (cleanPhone && lead.whatsapp) {
          const existingPhone = cleanDigits(lead.whatsapp);
          if (existingPhone.length >= 8 && cleanPhone.length >= 8) {
            if (existingPhone === cleanPhone || existingPhone.endsWith(cleanPhone) || cleanPhone.endsWith(existingPhone)) {
              return {
                isDuplicate: true,
                reason: `Telefone coincide com ${lead.name}`,
                existingLead: lead,
              };
            }
          }
        }

        if (cleanInsta && lead.instagram) {
          const existingInsta = normalizeInstagramHandle(lead.instagram).toLowerCase();
          if (existingInsta === cleanInsta) {
            return {
              isDuplicate: true,
              reason: `Instagram coincide com ${lead.name}`,
              existingLead: lead,
            };
          }
        }
      }

      return { isDuplicate: false };
    },
    [state.leads]
  );

  const openNewLeadModal = useCallback(() => {
    setEditingLeadId(null);
    setIsLeadDrawerOpen(true);
  }, []);

  const openEditLeadModal = useCallback((id: string) => {
    setEditingLeadId(id);
    setIsLeadDrawerOpen(true);
  }, []);

  const closeLeadModal = useCallback(() => {
    setIsLeadDrawerOpen(false);
    setEditingLeadId(null);
  }, []);

  // CRUD Leads
  const addLead = useCallback(
    (leadData: Omit<Lead, 'id' | 'createdAt' | 'timeline'>): Lead => {
      const id = `lead-${Date.now()}`;
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...leadData,
        id,
        createdAt: now,
        status: leadData.status || 'novo_lead',
        priority: leadData.priority || 'medium',
        opportunities: leadData.opportunities || {
          noProfessionalPhotos: false,
          limitedPhotos: false,
          noBioLink: false,
          poorBioLink: false,
          noWebsite: false,
          poorWebsite: false,
          needsBranding: false,
          complementaryServices: false,
        },
        tags: leadData.tags || [],
        timeline: [
          {
            id: `ev-${Date.now()}`,
            timestamp: now,
            type: 'created',
            title: 'Lead cadastrado',
            description: `Origem: ${leadData.source || 'Manual'}. Nicho: ${leadData.niche}`,
          },
        ],
      };

      setState((prev) => {
        const updated = {
          ...prev,
          leads: [newLead, ...prev.leads],
        };
        saveDatabaseState(updated);
        return updated;
      });

      incrementSessionQualified();
      showToast(`Lead "${newLead.name}" cadastrado com sucesso!`);
      return newLead;
    },
    [incrementSessionQualified, showToast]
  );

  // Cadastro Rápido de Leads
  const fastAddLead = useCallback(
    (data: { name: string; contact: string; niche: string; notes?: string }): Lead => {
      const isPhone = /\d{8,}/.test(cleanDigits(data.contact));
      const whatsapp = isPhone ? cleanDigits(data.contact) : '';
      const instagram = !isPhone ? normalizeInstagramHandle(data.contact) : '';

      return addLead({
        name: data.name,
        niche: data.niche || OFFICIAL_NICHES[0],
        whatsapp,
        instagram,
        notes: data.notes || '',
        source: 'Prospecção Ativa',
        status: 'novo_lead',
        priority: 'medium',
        opportunities: {
          noProfessionalPhotos: false,
          limitedPhotos: true,
          noBioLink: false,
          poorBioLink: false,
          noWebsite: false,
          poorWebsite: false,
          needsBranding: false,
          complementaryServices: false,
        },
        tags: [],
      });
    },
    [addLead]
  );

  const updateLead = useCallback(
    (id: string, updates: Partial<Lead>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          leads: prev.leads.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Lead atualizado');
    },
    [showToast]
  );

  const deleteLead = useCallback(
    (id: string) => {
      setState((prev) => {
        const lead = prev.leads.find((l) => l.id === id);
        const updated = {
          ...prev,
          leads: prev.leads.filter((l) => l.id !== id),
        };
        saveDatabaseState(updated);
        showToast(`Lead "${lead?.name || id}" excluído`);
        return updated;
      });
    },
    [showToast]
  );

  const addTimelineEvent = useCallback(
    (leadId: string, event: Omit<ActivityTimelineEvent, 'id' | 'timestamp'>) => {
      const newEvent: ActivityTimelineEvent = {
        ...event,
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
      };

      setState((prev) => {
        const updated = {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  timeline: [newEvent, ...(l.timeline || [])],
                }
              : l
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });
    },
    []
  );

  const updateLeadStatus = useCallback(
    (id: string, status: LeadStatus, note?: string) => {
      setState((prev) => {
        const lead = prev.leads.find((l) => l.id === id);
        if (!lead) return prev;

        const now = new Date().toISOString();
        const event: ActivityTimelineEvent = {
          id: `ev-${Date.now()}`,
          timestamp: now,
          type: 'status_changed',
          title: `Etapa alterada para: ${status}`,
          description: note || `Mudança de status no funil comercial.`,
        };

        const updated = {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status,
                  timeline: [event, ...(l.timeline || [])],
                }
              : l
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast(`Status atualizado`);
    },
    [showToast]
  );

  const confirmApproach = useCallback(
    (leadId: string, scriptId?: string, creativeId?: string) => {
      const now = new Date().toISOString();
      const event: ActivityTimelineEvent = {
        id: `ev-${Date.now()}`,
        timestamp: now,
        type: 'approach_confirmed',
        title: 'Abordagem realizada manualmente',
        description: `Contato abordado via WhatsApp/Instagram.`,
      };

      setState((prev) => {
        const lead = prev.leads.find((l) => l.id === leadId);
        const nextStatus: LeadStatus = lead && lead.status === 'novo_lead' ? 'demonstracao_enviada' : (lead?.status || 'demonstracao_enviada');

        const updated: DatabaseState = {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: nextStatus,
                  scriptId: scriptId || l.scriptId,
                  creativeId: creativeId || l.creativeId,
                  tags: Array.from(new Set([...(l.tags || []), 'aguardando_resposta'])),
                  timeline: [event, ...(l.timeline || [])],
                }
              : l
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });

      incrementSessionApproach();
      showToast('Abordagem confirmada e salva no histórico!');
    },
    [incrementSessionApproach, showToast]
  );

  const recordResponse = useCallback(
    (leadId: string, notes?: string) => {
      const event: ActivityTimelineEvent = {
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'response_received',
        title: 'Resposta do lead recebida',
        description: notes || 'O lead retornou a mensagem.',
      };

      setState((prev) => {
        const updated = {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  tags: (l.tags || []).filter((t) => t !== 'aguardando_resposta'),
                  timeline: [event, ...(l.timeline || [])],
                }
              : l
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Resposta registrada no histórico!');
    },
    [showToast]
  );

  const markInterested = useCallback(
    (leadId: string, packageId?: string) => {
      const event: ActivityTimelineEvent = {
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'interested_marked',
        title: 'Interesse manifestado',
        description: packageId ? `Interesse no pacote ID: ${packageId}` : 'Lead demonstrou interesse no ensaio.',
      };

      setState((prev) => {
        const updated: DatabaseState = {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: 'interessado' as LeadStatus,
                  packageInterestId: packageId || l.packageInterestId,
                  timeline: [event, ...(l.timeline || [])],
                }
              : l
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Lead marcado como Interessado!');
    },
    [showToast]
  );

  const scheduleFollowUp = useCallback(
    (leadId: string, date: string, actionText: string) => {
      const event: ActivityTimelineEvent = {
        id: `ev-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'followup_scheduled',
        title: `Retorno agendado para ${date}`,
        description: actionText,
      };

      setState((prev) => {
        const lead = prev.leads.find((l) => l.id === leadId);
        const newTask: TaskItem = {
          id: `task-${Date.now()}`,
          leadId,
          leadName: lead?.name || 'Lead',
          title: actionText,
          dueDate: date,
          priority: lead?.priority || 'medium',
          completed: false,
        };

        const updated = {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  nextFollowUpDate: date,
                  nextAction: actionText,
                  tags: Array.from(new Set([...(l.tags || []), 'precisa_retorno'])),
                  timeline: [event, ...(l.timeline || [])],
                }
              : l
          ),
          tasks: [newTask, ...prev.tasks],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Acompanhamento agendado e tarefa criada!');
    },
    [showToast]
  );

  // Vendas e Pagamentos
  const addSale = useCallback(
    (saleData: Omit<Sale, 'id'>) => {
      const id = `sale-${Date.now()}`;
      const newSale: Sale = {
        ...saleData,
        id,
      };

      setState((prev) => {
        const updated: DatabaseState = {
          ...prev,
          sales: [newSale, ...prev.sales],
          leads: prev.leads.map((l) =>
            l.id === saleData.leadId
              ? {
                  ...l,
                  status: (newSale.status === 'paid' ? 'pago' : 'pagamento_pendente') as LeadStatus,
                  timeline: [
                    {
                      id: `ev-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      type: 'sale_closed',
                      title: `Venda de R$ ${newSale.finalValue.toFixed(2)} registrada`,
                      description: `Serviço: ${newSale.serviceName}. Status: ${newSale.status}`,
                    },
                    ...(l.timeline || []),
                  ],
                }
              : l
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Venda registrada com sucesso!');
    },
    [showToast]
  );

  const updateSale = useCallback(
    (id: string, updates: Partial<Sale>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          sales: prev.sales.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Registro de venda atualizado');
    },
    [showToast]
  );

  const addPaymentToSale = useCallback(
    (saleId: string, payment: Omit<PaymentEntry, 'id'>) => {
      const newEntry: PaymentEntry = {
        ...payment,
        id: `pay-${Date.now()}`,
      };

      setState((prev) => {
        const sale = prev.sales.find((s) => s.id === saleId);
        if (!sale) return prev;

        const currentPayments = [...(sale.payments || []), newEntry];
        const totalPaid = currentPayments.reduce((acc, p) => acc + p.amount, 0);
        const isFullyPaid = totalPaid >= sale.finalValue;

        const updatedSales = prev.sales.map((s) =>
          s.id === saleId
            ? {
                ...s,
                payments: currentPayments,
                status: (isFullyPaid ? 'paid' : 'partially_paid') as any,
              }
            : s
        );

        const updatedLeads = isFullyPaid
          ? prev.leads.map((l) => (l.id === sale.leadId ? { ...l, status: 'pago' as LeadStatus } : l))
          : prev.leads;

        const updated = {
          ...prev,
          sales: updatedSales,
          leads: updatedLeads,
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Pagamento registrado no caixa!');
    },
    [showToast]
  );

  const addExpense = useCallback(
    (expenseData: Omit<Expense, 'id'>) => {
      const newExpense: Expense = {
        ...expenseData,
        id: `exp-${Date.now()}`,
      };
      setState((prev) => {
        const updated = {
          ...prev,
          expenses: [newExpense, ...prev.expenses],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Despesa registrada');
    },
    [showToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setState((prev) => {
        const updated = {
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== id),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Despesa removida');
    },
    [showToast]
  );

  // Scripts
  const addScript = useCallback(
    (script: Omit<Script, 'id' | 'createdAt'>) => {
      const newScript: Script = {
        ...script,
        id: `sc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => {
        const updated = {
          ...prev,
          scripts: [newScript, ...prev.scripts],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Novo script cadastrado na biblioteca!');
    },
    [showToast]
  );

  const updateScript = useCallback(
    (id: string, updates: Partial<Script>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          scripts: prev.scripts.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Script atualizado');
    },
    [showToast]
  );

  const deleteScript = useCallback(
    (id: string) => {
      setState((prev) => {
        const updated = {
          ...prev,
          scripts: prev.scripts.filter((s) => s.id !== id),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Script removido');
    },
    [showToast]
  );

  // Criativos e Upload de Imagens
  const addCreative = useCallback(
    (creative: Omit<Creative, 'id' | 'createdAt'>) => {
      const newCreative: Creative = {
        ...creative,
        id: `cr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => {
        const updated = {
          ...prev,
          creatives: [newCreative, ...prev.creatives],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Criativo cadastrado!');
    },
    [showToast]
  );

  const uploadCreativeImage = useCallback(
    async (
      file: File,
      meta: {
        name: string;
        niche: string;
        format: CreativeFormat;
        resultsCount: number;
        hasTitle: boolean;
        notes?: string;
      }
    ) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const fileSizeKb = Math.round(file.size / 1024);

          const newCreative: Creative = {
            id: `cr-${Date.now()}`,
            name: meta.name || file.name.replace(/\.[^/.]+$/, ''),
            version: 'v1.0',
            niche: meta.niche,
            format: meta.format,
            resultsCount: meta.resultsCount || 1,
            hasTitle: meta.hasTitle,
            notes: meta.notes || '',
            dataUrl,
            fileSizeKb,
            active: true,
            createdAt: new Date().toISOString(),
          };

          setState((prev) => {
            const updated = {
              ...prev,
              creatives: [newCreative, ...prev.creatives],
            };
            saveDatabaseState(updated);
            return updated;
          });

          showToast(`Imagem "${newCreative.name}" carregada no banco local!`);
          resolve();
        };
        reader.onerror = () => {
          showToast('Erro ao ler arquivo de imagem.');
          reject(new Error('Erro ao carregar imagem'));
        };
        reader.readAsDataURL(file);
      });
    },
    [showToast]
  );

  const updateCreative = useCallback(
    (id: string, updates: Partial<Creative>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          creatives: prev.creatives.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Criativo atualizado');
    },
    [showToast]
  );

  const deleteCreative = useCallback(
    (id: string) => {
      setState((prev) => {
        const updated = {
          ...prev,
          creatives: prev.creatives.filter((c) => c.id !== id),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Criativo excluído');
    },
    [showToast]
  );

  // Pacotes e Experimentos
  const addPackage = useCallback(
    (pkg: Omit<PackageOffer, 'id'>) => {
      const newPkg: PackageOffer = {
        ...pkg,
        id: `pkg-${Date.now()}`,
      };
      setState((prev) => {
        const updated = {
          ...prev,
          packages: [...prev.packages, newPkg],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Pacote comercial adicionado');
    },
    [showToast]
  );

  const updatePackage = useCallback(
    (id: string, updates: Partial<PackageOffer>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          packages: prev.packages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Pacote atualizado');
    },
    [showToast]
  );

  const addExperiment = useCallback(
    (exp: Omit<Experiment, 'id'>) => {
      const newExp: Experiment = {
        ...exp,
        id: `exp-${Date.now()}`,
      };
      setState((prev) => {
        const updated = {
          ...prev,
          experiments: [newExp, ...prev.experiments],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Experimento comercial criado!');
    },
    [showToast]
  );

  const updateExperiment = useCallback(
    (id: string, updates: Partial<Experiment>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          experiments: prev.experiments.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Experimento atualizado');
    },
    [showToast]
  );

  const updateVariantStats = useCallback(
    (expId: string, variantId: string, stats: Partial<ExperimentVariant>) => {
      setState((prev) => {
        const updated = {
          ...prev,
          experiments: prev.experiments.map((e) =>
            e.id === expId
              ? {
                  ...e,
                  variants: e.variants.map((v) => (v.id === variantId ? { ...v, ...stats } : v)),
                }
              : e
          ),
        };
        saveDatabaseState(updated);
        return updated;
      });
    },
    []
  );

  // Tarefas
  const addTask = useCallback(
    (task: Omit<TaskItem, 'id'>) => {
      const newTask: TaskItem = {
        ...task,
        id: `task-${Date.now()}`,
      };
      setState((prev) => {
        const updated = {
          ...prev,
          tasks: [newTask, ...prev.tasks],
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Tarefa criada');
    },
    [showToast]
  );

  const toggleTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const updated = {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        };
        saveDatabaseState(updated);
        return updated;
      });
    },
    []
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const updated = {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
        };
        saveDatabaseState(updated);
        return updated;
      });
      showToast('Tarefa removida');
    },
    [showToast]
  );

  // Configurações & Utilitários
  const updateSettings = useCallback(
    async (settings: Partial<AppSettings>) => {
      let updatedState: DatabaseState | null = null;
      setState((prev) => {
        const updated = {
          ...prev,
          settings: {
            ...prev.settings,
            ...settings,
          },
        };
        updatedState = updated;
        return updated;
      });
      if (updatedState) {
        await saveDatabaseState(updatedState);
      }
      showToast('Configurações salvas!');
    },
    [showToast]
  );

  const toggleDemoData = useCallback(async () => {
    if (state.settings.isDemoData) {
      const clean = await resetToCleanState(state.settings);
      setState(clean);
      showToast('Base real ativada. Suas metas e configurações foram mantidas.');
    } else {
      const demo = await resetToDemoState(state.settings);
      setState(demo);
      showToast('Modo exemplo restaurado. Suas metas e configurações foram mantidas.');
    }
  }, [state.settings, showToast]);

  const resetToClean = useCallback(async () => {
    const clean = await resetToCleanState(state.settings);
    setState(clean);
    showToast('Base limpa com sucesso! Suas configurações foram preservadas.');
  }, [state.settings, showToast]);

  const exportBackup = useCallback(() => {
    exportDatabaseBackupJson(state);
    showToast('Backup JSON exportado com sucesso!');
  }, [state, showToast]);

  const importBackup = useCallback(
    async (file: File) => {
      try {
        const imported = await importDatabaseBackupJson(file);
        setState(imported);
        showToast('Backup restaurado com sucesso!');
      } catch (err: any) {
        showToast(`Erro ao restaurar: ${err.message}`);
      }
    },
    [showToast]
  );

  const exportCsv = useCallback(() => {
    exportLeadsToCsv(state.leads);
    showToast('Leads exportados para CSV!');
  }, [state.leads, showToast]);

  const contextValue = useMemo<LuminaContextType>(
    () => ({
      state,
      loading,
      activeTab,
      setActiveTab,
      isLeadDrawerOpen,
      editingLeadId,
      openNewLeadModal,
      openEditLeadModal,
      closeLeadModal,
      isSearchOpen,
      setIsSearchOpen,
      toastMessage,
      showToast,
      timerActive,
      timerSeconds,
      timerSessionApproaches,
      timerSessionQualified,
      startTimer,
      pauseTimer,
      resetTimer,
      finishTimerSession,
      incrementSessionApproach,
      incrementSessionQualified,
      addLead,
      fastAddLead,
      updateLead,
      deleteLead,
      updateLeadStatus,
      addTimelineEvent,
      confirmApproach,
      recordResponse,
      markInterested,
      scheduleFollowUp,
      addSale,
      updateSale,
      addPaymentToSale,
      addExpense,
      deleteExpense,
      addScript,
      updateScript,
      deleteScript,
      addCreative,
      uploadCreativeImage,
      updateCreative,
      deleteCreative,
      addPackage,
      updatePackage,
      addExperiment,
      updateExperiment,
      updateVariantStats,
      addTask,
      toggleTask,
      deleteTask,
      theme: state.settings.theme || 'dark',
      toggleTheme,
      updateSettings,
      checkDuplicateLead,
      toggleDemoData,
      resetToClean,
      exportBackup,
      importBackup,
      exportCsv,
    }),
    [
      state,
      loading,
      activeTab,
      isLeadDrawerOpen,
      editingLeadId,
      openNewLeadModal,
      openEditLeadModal,
      closeLeadModal,
      isSearchOpen,
      toastMessage,
      showToast,
      timerActive,
      timerSeconds,
      timerSessionApproaches,
      timerSessionQualified,
      startTimer,
      pauseTimer,
      resetTimer,
      finishTimerSession,
      incrementSessionApproach,
      incrementSessionQualified,
      addLead,
      fastAddLead,
      updateLead,
      deleteLead,
      updateLeadStatus,
      addTimelineEvent,
      confirmApproach,
      recordResponse,
      markInterested,
      scheduleFollowUp,
      addSale,
      updateSale,
      addPaymentToSale,
      addExpense,
      deleteExpense,
      addScript,
      updateScript,
      deleteScript,
      addCreative,
      uploadCreativeImage,
      updateCreative,
      deleteCreative,
      addPackage,
      updatePackage,
      addExperiment,
      updateExperiment,
      updateVariantStats,
      addTask,
      toggleTask,
      deleteTask,
      toggleTheme,
      updateSettings,
      checkDuplicateLead,
      toggleDemoData,
      resetToClean,
      exportBackup,
      importBackup,
      exportCsv,
    ]
  );

  return <LuminaContext.Provider value={contextValue}>{children}</LuminaContext.Provider>;
}

export function useLumina() {
  const context = useContext(LuminaContext);
  if (!context) {
    throw new Error('useLumina deve ser usado dentro de LuminaProvider');
  }
  return context;
}
