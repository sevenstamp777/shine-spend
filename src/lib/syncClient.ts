// Cliente de sincronização celular ↔ desktop
// Envia/baixa o snapshot completo dos dados via /api/sync (Neon Postgres).

import type { FileSystemStorageData } from '@/hooks/useFileSystemStorage';

export interface SyncSnapshot {
  data: FileSystemStorageData | null;
  updatedAt: string | null;
}

const SYNC_TOKEN_KEY = 'finapp_sync_token';
// Sem token padrão embutido: cada pessoa que abrir o app fica com os próprios
// dados (sem sincronizar) até digitar um token na barra de sincronização.
// Quem usa o mesmo token compartilha os dados (ex.: celular ↔ desktop do dono).

export function getSyncToken(): string {
  try {
    return localStorage.getItem(SYNC_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setSyncToken(token: string): void {
  try {
    localStorage.setItem(SYNC_TOKEN_KEY, token.trim());
  } catch {
    // ignore
  }
}

export function clearSyncToken(): void {
  try {
    localStorage.removeItem(SYNC_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function fetchSnapshot(token: string): Promise<SyncSnapshot> {
  const res = await fetch(`/api/sync?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`sync fetch failed (${res.status})`);
  return res.json();
}

export async function pushSnapshot(token: string, data: FileSystemStorageData): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-token': token,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`sync push failed (${res.status})`);
}

// ——— Merge por id ———

type WithKey = { id?: string; categoryId?: string };

function keyOf(item: WithKey): string {
  return item.id || item.categoryId || '';
}

function mergeById<T extends WithKey>(local: T[], remote: T[] | undefined, preferRemote: boolean): T[] {
  if (!remote) return local;
  const map = new Map<string, T>();

  // Insere todos os locais primeiro
  for (const item of local) {
    const k = keyOf(item);
    if (k) map.set(k, item);
  }

  // Remote vence em conflito quando preferRemote (remoto mais recente)
  for (const item of remote) {
    const k = keyOf(item);
    if (!k) continue;
    if (preferRemote || !map.has(k)) {
      map.set(k, item);
    }
  }

  return Array.from(map.values());
}

// Combina dois snapshots. No conflito de mesmo id, prevalece o lado
// com lastSaved mais recente (merge por id evita perder lançamentos).
export function mergeSnapshots(local: FileSystemStorageData, remote: FileSystemStorageData): FileSystemStorageData {
  const localTime = local.lastSaved ? new Date(local.lastSaved).getTime() : 0;
  const remoteTime = remote.lastSaved ? new Date(remote.lastSaved).getTime() : 0;
  const preferRemote = remoteTime > localTime;

  return {
    categories: mergeById(local.categories, remote.categories, preferRemote),
    paymentMethods: mergeById(local.paymentMethods, remote.paymentMethods, preferRemote),
    products: mergeById(local.products || [], remote.products, preferRemote),
    budgets: mergeById(local.budgets || [], remote.budgets, preferRemote),
    transactions: mergeById(local.transactions, remote.transactions, preferRemote),
    lastSaved: preferRemote ? remote.lastSaved : local.lastSaved,
  };
}
