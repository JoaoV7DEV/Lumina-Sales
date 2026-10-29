'use client';

import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  DatabaseState,
  Lead,
  Sale,
  TaskItem,
  Script,
  Creative,
  PackageOffer,
  Expense,
  Experiment,
  ProductivitySession,
  AppSettings,
} from './types';

// Tipos de Estado de Sincronização em Nuvem
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface MigrationSummary {
  leadsCount: number;
  salesCount: number;
  tasksCount: number;
  scriptsCount: number;
  creativesCount: number;
  packagesCount: number;
  expensesCount: number;
  experimentsCount: number;
  sessionsCount: number;
  settingsSaved: boolean;
  timestamp: string;
}

// 1. Gerenciamento da Conta Proprietária
export async function syncAccountOwner(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const accountRef = doc(db, 'accounts', user.uid);
  const snap = await getDoc(accountRef);

  if (!snap.exists()) {
    await setDoc(accountRef, {
      ownerUid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Proprietário Lumina',
      photoURL: user.photoURL || '',
      role: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      accountRef,
      {
        email: user.email || '',
        displayName: user.displayName || 'Proprietário Lumina',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

// 2. Caminhos Base do Firestore
function getEnvDocPath(ownerUid: string, envId: string) {
  return `accounts/${ownerUid}/environments/${envId}`;
}

// 3. Carregamento Completo Inicial de um Ambiente
export async function loadEnvironmentStateFromCloud(
  ownerUid: string,
  envId: 'real' | 'demo'
): Promise<DatabaseState | null> {
  try {
    const basePath = getEnvDocPath(ownerUid, envId);

    // Settings
    const settingsSnap = await getDoc(doc(db, `${basePath}/settings/current`));
    const leadsSnap = await getDocs(collection(db, `${basePath}/leads`));

    // Se não existirem documentos nem configurações salvas nesta conta, retorna null (permite migração limpa)
    if (!settingsSnap.exists() && leadsSnap.empty) {
      return null;
    }

    const salesSnap = await getDocs(collection(db, `${basePath}/sales`));
    const tasksSnap = await getDocs(collection(db, `${basePath}/tasks`));
    const scriptsSnap = await getDocs(collection(db, `${basePath}/scripts`));
    const creativesSnap = await getDocs(collection(db, `${basePath}/creatives`));
    const packagesSnap = await getDocs(collection(db, `${basePath}/packages`));
    const expensesSnap = await getDocs(collection(db, `${basePath}/expenses`));
    const experimentsSnap = await getDocs(collection(db, `${basePath}/experiments`));
    const sessionsSnap = await getDocs(collection(db, `${basePath}/productivity`));

    const leads = leadsSnap.docs.map((d) => d.data() as Lead);
    const sales = salesSnap.docs.map((d) => d.data() as Sale);
    const tasks = tasksSnap.docs.map((d) => d.data() as TaskItem);
    const scripts = scriptsSnap.docs.map((d) => d.data() as Script);
    const creatives = creativesSnap.docs.map((d) => d.data() as Creative);
    const packages = packagesSnap.docs.map((d) => d.data() as PackageOffer);
    const expenses = expensesSnap.docs.map((d) => d.data() as Expense);
    const experiments = experimentsSnap.docs.map((d) => d.data() as Experiment);
    const productivitySessions = sessionsSnap.docs.map((d) => d.data() as ProductivitySession);

    const settingsData = settingsSnap.exists()
      ? (settingsSnap.data() as AppSettings)
      : ({
          attendantName: 'João',
          defaultPriceTable: 'tabela_1',
          dailyGoal: 20,
          dailyRevenueGoal: 150,
          monthlyRevenueGoal: 3500,
          sidebarCollapsed: false,
          theme: 'dark',
          timezone: 'America/Sao_Paulo',
          isDemoData: envId === 'demo',
          customNiches: [],
        } as AppSettings);

    return {
      version: '1.4.0',
      lastUpdated: new Date().toISOString(),
      leads,
      sales,
      tasks,
      scripts,
      creatives,
      packages,
      expenses,
      experiments,
      productivitySessions,
      settings: settingsData,
    };
  } catch (error) {
    console.error('Erro ao carregar estado da nuvem:', error);
    throw error;
  }
}

// 4. Inscrição em Tempo Real (Sync Multidispositivo)
export function subscribeToCloudChanges(
  ownerUid: string,
  envId: 'real' | 'demo',
  callbacks: {
    onLeadsChange: (leads: Lead[]) => void;
    onSalesChange: (sales: Sale[]) => void;
    onTasksChange: (tasks: TaskItem[]) => void;
    onSettingsChange: (settings: AppSettings) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const basePath = getEnvDocPath(ownerUid, envId);
  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Leads
    const unsubLeads = onSnapshot(
      collection(db, `${basePath}/leads`),
      (snapshot) => {
        const leads = snapshot.docs.map((docSnap) => docSnap.data() as Lead);
        callbacks.onLeadsChange(leads);
      },
      callbacks.onError
    );
    unsubs.push(unsubLeads);

    // 2. Vendas
    const unsubSales = onSnapshot(
      collection(db, `${basePath}/sales`),
      (snapshot) => {
        const sales = snapshot.docs.map((docSnap) => docSnap.data() as Sale);
        callbacks.onSalesChange(sales);
      },
      callbacks.onError
    );
    unsubs.push(unsubSales);

    // 3. Tarefas
    const unsubTasks = onSnapshot(
      collection(db, `${basePath}/tasks`),
      (snapshot) => {
        const tasks = snapshot.docs.map((docSnap) => docSnap.data() as TaskItem);
        callbacks.onTasksChange(tasks);
      },
      callbacks.onError
    );
    unsubs.push(unsubTasks);

    // 4. Configurações e Metas
    const unsubSettings = onSnapshot(
      doc(db, `${basePath}/settings/current`),
      (docSnap) => {
        if (docSnap.exists()) {
          callbacks.onSettingsChange(docSnap.data() as AppSettings);
        }
      },
      callbacks.onError
    );
    unsubs.push(unsubSettings);
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    callbacks.onError(errorObj);
  }

  // Retorna função unificada para limpar todos os listeners
  return () => {
    unsubs.forEach((u) => u());
  };
}

// 5. Migração Segura em Lotes (IndexedDB -> Firestore)
export async function migrateLocalStateToFirestore(
  ownerUid: string,
  envId: 'real' | 'demo',
  state: DatabaseState
): Promise<MigrationSummary> {
  const basePath = getEnvDocPath(ownerUid, envId);
  const now = new Date().toISOString();

  // Helper de gravação em lotes (limite seguro de 300 por lote)
  async function commitBatch(items: any[], subcollectionName: string) {
    const CHUNK_SIZE = 300;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const docRef = doc(db, `${basePath}/${subcollectionName}`, item.id);
        batch.set(
          docRef,
          {
            ...item,
            ownerUid,
            updatedAt: now,
          },
          { merge: true }
        );
      });

      await batch.commit();
    }
  }

  // 1. Gravar Leads
  await commitBatch(state.leads || [], 'leads');

  // 2. Gravar Vendas
  await commitBatch(state.sales || [], 'sales');

  // 3. Gravar Tarefas
  await commitBatch(state.tasks || [], 'tasks');

  // 4. Gravar Scripts
  await commitBatch(state.scripts || [], 'scripts');

  // 5. Gravar Criativos (Metadados seguros, sem base64 gigante)
  const safeCreatives = (state.creatives || []).map((c) => ({
    ...c,
    // Não envia dados binários pesados de imagem para evitar exceder 1MB do Firestore
    dataUrl: c.dataUrl && c.dataUrl.length > 50000 ? undefined : c.dataUrl,
    hasLocalDataUrl: Boolean(c.dataUrl),
  }));
  await commitBatch(safeCreatives, 'creatives');

  // 6. Gravar Pacotes
  await commitBatch(state.packages || [], 'packages');

  // 7. Gravar Despesas
  await commitBatch(state.expenses || [], 'expenses');

  // 8. Gravar Experimentos
  await commitBatch(state.experiments || [], 'experiments');

  // 9. Gravar Sessões de Produtividade
  await commitBatch(state.productivitySessions || [], 'productivity');

  // 10. Gravar Metas e Configurações
  await setDoc(
    doc(db, `${basePath}/settings/current`),
    {
      ...state.settings,
      ownerUid,
      updatedAt: now,
    },
    { merge: true }
  );

  return {
    leadsCount: (state.leads || []).length,
    salesCount: (state.sales || []).length,
    tasksCount: (state.tasks || []).length,
    scriptsCount: (state.scripts || []).length,
    creativesCount: safeCreatives.length,
    packagesCount: (state.packages || []).length,
    expensesCount: (state.expenses || []).length,
    experimentsCount: (state.experiments || []).length,
    sessionsCount: (state.productivitySessions || []).length,
    settingsSaved: true,
    timestamp: now,
  };
}

// 6. Operações Granulares na Nuvem
export async function saveLeadToCloud(ownerUid: string, envId: 'real' | 'demo', lead: Lead): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/leads`, lead.id);
  await setDoc(ref, { ...lead, ownerUid, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteLeadFromCloud(ownerUid: string, envId: 'real' | 'demo', leadId: string): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/leads`, leadId);
  await deleteDoc(ref);
}

export async function saveSaleToCloud(ownerUid: string, envId: 'real' | 'demo', sale: Sale): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/sales`, sale.id);
  await setDoc(ref, { ...sale, ownerUid, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function saveTaskToCloud(ownerUid: string, envId: 'real' | 'demo', task: TaskItem): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/tasks`, task.id);
  await setDoc(ref, { ...task, ownerUid, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteTaskFromCloud(ownerUid: string, envId: 'real' | 'demo', taskId: string): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/tasks`, taskId);
  await deleteDoc(ref);
}

export async function saveSettingsToCloud(
  ownerUid: string,
  envId: 'real' | 'demo',
  settings: Partial<AppSettings>
): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/settings/current`);
  await setDoc(ref, { ...settings, ownerUid, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function saveScriptToCloud(ownerUid: string, envId: 'real' | 'demo', script: Script): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/scripts`, script.id);
  await setDoc(ref, { ...script, ownerUid, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteScriptFromCloud(ownerUid: string, envId: 'real' | 'demo', scriptId: string): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/scripts`, scriptId);
  await deleteDoc(ref);
}

export async function savePackageToCloud(
  ownerUid: string,
  envId: 'real' | 'demo',
  pkg: PackageOffer
): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/packages`, pkg.id);
  await setDoc(ref, { ...pkg, ownerUid, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function saveCreativeToCloud(ownerUid: string, envId: 'real' | 'demo', creative: Creative): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/creatives`, creative.id);
  const safeData = {
    ...creative,
    dataUrl: creative.dataUrl && creative.dataUrl.length > 50000 ? undefined : creative.dataUrl,
    hasLocalDataUrl: Boolean(creative.dataUrl),
    ownerUid,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, safeData, { merge: true });
}

export async function deleteCreativeFromCloud(
  ownerUid: string,
  envId: 'real' | 'demo',
  creativeId: string
): Promise<void> {
  const ref = doc(db, `${getEnvDocPath(ownerUid, envId)}/creatives`, creativeId);
  await deleteDoc(ref);
}
