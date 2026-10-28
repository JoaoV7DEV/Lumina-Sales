'use client';

import { DatabaseState, Lead, Script, AppSettings } from './types';
import {
  INITIAL_DATABASE_STATE,
  OFFICIAL_SCRIPTS,
  OFFICIAL_PACKAGES,
  OFFICIAL_NICHES,
  OFFICIAL_CREATIVES,
} from './seed-data';
import { migrateLeadStatus } from './formatters';

const STORAGE_KEY = 'lumina_sales_db_v1';
const DB_NAME = 'LuminaSalesDB';
const DB_VERSION = 2;
const STORE_NAME = 'app_state';

export const CLEAN_DATABASE_STATE: DatabaseState = {
  version: '1.2.0',
  lastUpdated: new Date().toISOString(),
  leads: [],
  scripts: OFFICIAL_SCRIPTS,
  creatives: OFFICIAL_CREATIVES,
  experiments: [],
  packages: OFFICIAL_PACKAGES,
  sales: [],
  expenses: [],
  tasks: [],
  productivitySessions: [],
  settings: {
    attendantName: 'João',
    defaultPriceTable: 'tabela_1',
    dailyGoal: 20,
    theme: 'dark',
    timezone: 'America/Sao_Paulo',
    isDemoData: false,
    customNiches: [],
  },
};

// Helper de acesso ao IndexedDB com fallback para LocalStorage
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Migração segura e idempotente do estado recuperado
function migrateAndEnrichState(rawState: DatabaseState): DatabaseState {
  if (!rawState) return INITIAL_DATABASE_STATE;

  // 1. Migrar status dos leads para o novo funil de 14 etapas
  const migratedLeads = (rawState.leads || []).map((lead) => ({
    ...lead,
    status: migrateLeadStatus(lead.status),
    opportunities: lead.opportunities || {
      noProfessionalPhotos: false,
      limitedPhotos: false,
      noBioLink: false,
      poorBioLink: false,
      noWebsite: false,
      poorWebsite: false,
      needsBranding: false,
      complementaryServices: false,
    },
    timeline: Array.isArray(lead.timeline) ? lead.timeline : [],
    tags: Array.isArray(lead.tags) ? lead.tags : [],
  }));

  // 2. Mesclar scripts oficiais sem sobrescrever edições personalizadas do usuário (removendo sc-p1-saudacao-teste)
  const existingScripts = (rawState.scripts || []).filter((s) => s.id !== 'sc-p1-saudacao-teste');
  const existingScriptIds = new Set(existingScripts.map((s) => s.id));
  const missingOfficialScripts = OFFICIAL_SCRIPTS.filter((s) => !existingScriptIds.has(s.id));
  const mergedScripts = [...existingScripts, ...missingOfficialScripts];

  // 3. Garantir pacotes oficiais das duas tabelas
  const existingPackages = rawState.packages || [];
  const existingPackageIds = new Set(existingPackages.map((p) => p.id));
  const missingPackages = OFFICIAL_PACKAGES.filter((p) => !existingPackageIds.has(p.id));
  const mergedPackages = [...existingPackages, ...missingPackages];

  // 4. Garantir configurações com nome do atendente padrão (João) e novas metas
  const rawSettings = rawState.settings || {};
  const settings: AppSettings = {
    attendantName: rawSettings.attendantName || 'João',
    defaultPriceTable: rawSettings.defaultPriceTable || 'tabela_1',
    dailyGoal: rawSettings.dailyGoal || 20,
    dailyRevenueGoal: rawSettings.dailyRevenueGoal || 150,
    monthlyRevenueGoal: rawSettings.monthlyRevenueGoal || 3500,
    sidebarCollapsed: rawSettings.sidebarCollapsed || false,
    theme: rawSettings.theme || 'dark',
    timezone: rawSettings.timezone || 'America/Sao_Paulo',
    isDemoData: rawSettings.isDemoData !== undefined ? rawSettings.isDemoData : true,
    customNiches: rawSettings.customNiches || [],
  };

  return {
    ...rawState,
    version: '1.3.0',
    leads: migratedLeads,
    scripts: mergedScripts,
    packages: mergedPackages,
    creatives: rawState.creatives && rawState.creatives.length > 0 ? rawState.creatives : OFFICIAL_CREATIVES,
    settings,
  };
}

export async function loadDatabaseState(): Promise<DatabaseState> {
  if (typeof window === 'undefined') {
    return INITIAL_DATABASE_STATE;
  }

  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(STORAGE_KEY);

    const result = await new Promise<DatabaseState | null>((resolve) => {
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    });

    if (result && result.leads && Array.isArray(result.leads)) {
      const enriched = migrateAndEnrichState(result);
      await saveDatabaseState(enriched);
      return enriched;
    }
  } catch {
    // Fallback silencioso para localStorage
  }

  // Tentar localStorage
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local) as DatabaseState;
      if (parsed && parsed.leads && Array.isArray(parsed.leads)) {
        const enriched = migrateAndEnrichState(parsed);
        await saveDatabaseState(enriched);
        return enriched;
      }
    }
  } catch {
    // Sem cache
  }

  // Se nada existir, inicializa com os dados oficiais V1.2
  await saveDatabaseState(INITIAL_DATABASE_STATE);
  return INITIAL_DATABASE_STATE;
}

export async function saveDatabaseState(state: DatabaseState): Promise<void> {
  if (typeof window === 'undefined') return;

  const stateToSave = {
    ...state,
    version: '1.2.0',
    lastUpdated: new Date().toISOString(),
  };

  // 1. Salvar no IndexedDB
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(stateToSave, STORAGE_KEY);
  } catch {
    // Falha silenciosa no IndexedDB, prossegue com fallback
  }

  // 2. Salvar também no LocalStorage como redundância
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch {
    // LocalStorage cheio ou restrito
  }

  // Disparar evento para componentes ouvintes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lumina-state-changed', { detail: stateToSave }));
  }
}

export async function resetToDemoState(): Promise<DatabaseState> {
  await saveDatabaseState(INITIAL_DATABASE_STATE);
  return INITIAL_DATABASE_STATE;
}

export async function resetToCleanState(): Promise<DatabaseState> {
  await saveDatabaseState(CLEAN_DATABASE_STATE);
  return CLEAN_DATABASE_STATE;
}

export function exportDatabaseBackupJson(state: DatabaseState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `lumina_sales_v1.2_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseBackupJson(file: File): Promise<DatabaseState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as DatabaseState;
        if (!parsed.leads || !Array.isArray(parsed.leads)) {
          throw new Error('Arquivo de backup inválido: estrutura de leads não encontrada.');
        }
        const enriched = migrateAndEnrichState(parsed);
        await saveDatabaseState(enriched);
        resolve(enriched);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao importar JSON';
        reject(new Error(msg));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de backup.'));
    reader.readAsText(file);
  });
}

export function exportLeadsToCsv(leads: Lead[]): void {
  const headers = [
    'ID',
    'Nome',
    'Nome Comercial',
    'Nicho',
    'Status',
    'Prioridade',
    'WhatsApp',
    'Instagram',
    'Cidade/UF',
    'Origem',
    'Data Cadastro',
    'Próxima Ação',
    'Data Follow-up',
    'Observações',
  ];

  const rows = leads.map((l) => [
    l.id,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.businessName || '').replace(/"/g, '""')}"`,
    `"${(l.niche || '').replace(/"/g, '""')}"`,
    `"${l.status}"`,
    `"${l.priority}"`,
    `"${l.whatsapp || ''}"`,
    `"${l.instagram || ''}"`,
    `"${(l.cityState || '').replace(/"/g, '""')}"`,
    `"${(l.source || '').replace(/"/g, '""')}"`,
    `"${l.createdAt || ''}"`,
    `"${(l.nextAction || '').replace(/"/g, '""')}"`,
    `"${l.nextFollowUpDate || ''}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `lumina_leads_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
