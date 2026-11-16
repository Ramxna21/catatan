import { DiaryEntry, Draft, FutureLetter, Mood } from '../types';

const LEGACY_KEYS = {
  user: 'catatanHatiUser',
  entries: 'catatanHatiEntries',
  darkMode: 'catatanHatiDarkMode'
} as const;

export const STORAGE_KEYS = {
  session: 'kenang.session.v1',
  accounts: 'kenang.accounts.v1',
  entries: (userId: string) => `kenang.entries.v1:${userId}`,
  draft: (userId: string) => `kenang.draft.v1:${userId}`,
  futureLetters: (userId: string) => `kenang.futureLetters.v1:${userId}`,
  darkMode: 'kenang.darkMode.v1',
  lastView: 'kenang.lastView.v1'
} as const;

export const LEGACY_STORAGE_KEYS = LEGACY_KEYS;

const VALID_MOODS: Mood[] = ['love', 'happy', 'sad', 'hopeful', 'grateful'];

function canUseStorage(): boolean {
  try {
    const probe = '__kenang_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = typeof window !== 'undefined' && canUseStorage();

export function safeGet(key: string): string | null {
  if (!storageAvailable) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  if (!storageAvailable) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string): void {
  if (!storageAvailable) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    return safeSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/** Membersihkan data localStorage yang bentuknya tidak valid. */
export function sanitizeEntries(value: unknown): DiaryEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const mood = VALID_MOODS.includes(item.mood as Mood) ? (item.mood as Mood) : 'love';
      const tags = Array.isArray(item.tags)
        ? item.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 5)
        : [];
      const createdAt =
        typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
          ? item.createdAt
          : new Date().toISOString();

      return {
        id: typeof item.id === 'string' ? item.id : `entry_${Math.random().toString(36).slice(2)}`,
        title: typeof item.title === 'string' ? item.title : '',
        content: typeof item.content === 'string' ? item.content : '',
        mood,
        isPrivate: typeof item.isPrivate === 'boolean' ? item.isPrivate : true,
        tags,
        createdAt,
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined
      } satisfies DiaryEntry;
    })
    .filter((entry) => entry.title.trim() !== '' || entry.content.trim() !== '');
}

function migrateLegacyEntries(userId: string): DiaryEntry[] {
  const scopedKey = STORAGE_KEYS.entries(userId);
  const scoped = readJSON<unknown>(scopedKey, null);
  if (Array.isArray(scoped)) return sanitizeEntries(scoped);

  const legacy = readJSON<unknown>(LEGACY_KEYS.entries, null);
  if (!Array.isArray(legacy)) return [];

  const migrated = sanitizeEntries(legacy);
  if (migrated.length > 0) {
    writeJSON(scopedKey, migrated);
    safeRemove(LEGACY_KEYS.entries);
  }
  return migrated;
}

export function loadEntries(userId: string): DiaryEntry[] {
  return migrateLegacyEntries(userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveEntries(userId: string, entries: DiaryEntry[]): boolean {
  return writeJSON(STORAGE_KEYS.entries(userId), entries);
}

export function loadDraft(userId: string): Draft | null {
  const draft = readJSON<Partial<Draft> | null>(STORAGE_KEYS.draft(userId), null);
  if (!draft || typeof draft !== 'object') return null;
  if (typeof draft.title !== 'string' && typeof draft.content !== 'string') return null;

  return {
    title: typeof draft.title === 'string' ? draft.title : '',
    content: typeof draft.content === 'string' ? draft.content : '',
    mood: VALID_MOODS.includes(draft.mood as Mood) ? (draft.mood as Mood) : 'love',
    isPrivate: typeof draft.isPrivate === 'boolean' ? draft.isPrivate : true,
    tags: Array.isArray(draft.tags)
      ? draft.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 5)
      : [],
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : new Date().toISOString()
  };
}

export function saveDraft(userId: string, draft: Omit<Draft, 'updatedAt'>): boolean {
  return writeJSON(STORAGE_KEYS.draft(userId), {
    ...draft,
    updatedAt: new Date().toISOString()
  } satisfies Draft);
}

export function loadFutureLetters(userId: string): FutureLetter[] {
  const raw = readJSON<unknown[]>(STORAGE_KEYS.futureLetters(userId), []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : `letter_${Math.random().toString(36).slice(2)}`,
      title: typeof item.title === 'string' ? item.title : 'Surat Tanpa Judul',
      content: typeof item.content === 'string' ? item.content : '',
      mood: VALID_MOODS.includes(item.mood as Mood) ? (item.mood as Mood) : 'hopeful',
      tags: Array.isArray(item.tags)
        ? item.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 5)
        : [],
      createdAt:
        typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))
          ? item.createdAt
          : new Date().toISOString(),
      unlockDate:
        typeof item.unlockDate === 'string' && !Number.isNaN(Date.parse(item.unlockDate))
          ? item.unlockDate
          : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      targetEmail: typeof item.targetEmail === 'string' ? item.targetEmail : undefined,
      isOpened: typeof item.isOpened === 'boolean' ? item.isOpened : false,
      openedAt: typeof item.openedAt === 'string' ? item.openedAt : undefined
    }));
}

export function saveFutureLetters(userId: string, letters: FutureLetter[]): boolean {
  return writeJSON(STORAGE_KEYS.futureLetters(userId), letters);
}

export function clearDraft(userId: string): void {
  safeRemove(STORAGE_KEYS.draft(userId));
}

export function loadDarkMode(): boolean {
  const stored = readJSON<boolean | null>(STORAGE_KEYS.darkMode, null);
  if (typeof stored === 'boolean') return stored;

  const legacy = readJSON<boolean | null>(LEGACY_KEYS.darkMode, null);
  if (typeof legacy === 'boolean') {
    writeJSON(STORAGE_KEYS.darkMode, legacy);
    return legacy;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export function saveDarkMode(enabled: boolean): void {
  writeJSON(STORAGE_KEYS.darkMode, enabled);
}
