export type Mood = 'love' | 'happy' | 'sad' | 'hopeful' | 'grateful';

export type AppView =
  | 'dashboard'
  | 'editor'
  | 'landing'
  | 'statistics'
  | 'backup'
  | 'analytics'
  | 'reminders'
  | 'timeline'
  | 'future-letters';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Draft {
  title: string;
  content: string;
  mood: Mood;
  isPrivate: boolean;
  tags: string[];
  updatedAt: string;
}

/** Benih catatan dari asisten AI untuk langsung dibuka di editor. */
export interface EntrySeed {
  id: string;
  title: string;
  content: string;
  mood?: Mood;
  tags?: string[];
}

export interface AuthModalProps {
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export interface ShareModalProps {
  isOpen: boolean;
  entry: DiaryEntry;
  onClose: () => void;
}

export interface FutureLetter {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  createdAt: string;
  unlockDate: string; // ISO string tanggal dan jam buka
  targetEmail?: string;
  isOpened?: boolean;
  openedAt?: string;
}
