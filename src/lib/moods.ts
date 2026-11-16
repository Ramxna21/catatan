import { DiaryEntry, Mood } from '../types';

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
  badge: string;
  soft: string;
  dot: string;
}

export const MOODS: MoodOption[] = [
  {
    value: 'love',
    label: 'Cinta',
    emoji: '💕',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200',
    soft: 'bg-pink-50 dark:bg-pink-900/20',
    dot: 'bg-pink-500'
  },
  {
    value: 'happy',
    label: 'Bahagia',
    emoji: '😊',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200',
    soft: 'bg-yellow-50 dark:bg-yellow-900/20',
    dot: 'bg-yellow-500'
  },
  {
    value: 'sad',
    label: 'Sedih',
    emoji: '😢',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    soft: 'bg-blue-50 dark:bg-blue-900/20',
    dot: 'bg-blue-500'
  },
  {
    value: 'hopeful',
    label: 'Berharap',
    emoji: '🌟',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
    soft: 'bg-purple-50 dark:bg-purple-900/20',
    dot: 'bg-purple-500'
  },
  {
    value: 'grateful',
    label: 'Bersyukur',
    emoji: '🙏',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',
    soft: 'bg-green-50 dark:bg-green-900/20',
    dot: 'bg-green-500'
  }
];

const FALLBACK: MoodOption = {
  value: 'love',
  label: 'Lainnya',
  emoji: '💭',
  badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/60 dark:text-gray-200',
  soft: 'bg-gray-50 dark:bg-gray-900/20',
  dot: 'bg-gray-400'
};

export function getMoodOption(mood: string): MoodOption {
  return MOODS.find((item) => item.value === mood) ?? FALLBACK;
}

export function getMoodEmoji(mood: string): string {
  return getMoodOption(mood).emoji;
}

export function getMoodLabel(mood: string): string {
  return getMoodOption(mood).label;
}

export function getMoodBadge(mood: string): string {
  return getMoodOption(mood).badge;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.trim().length;
}

export function getReadingTime(text: string): number {
  return Math.max(1, Math.ceil(countWords(text) / 200));
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toDayKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Menghitung berapa hari berturut-turut user menulis.
 * Hari ini boleh kosong tanpa memutus streak (selama kemarin ada catatan).
 */
export function getWritingStreak(entries: DiaryEntry[]): number {
  const days = new Set<string>();
  entries.forEach((entry) => {
    const key = toDayKey(entry.createdAt);
    if (key) days.add(key);
  });

  if (!days.size) return 0;

  const cursor = new Date();
  const todayKey = toDayKey(cursor.toISOString());
  if (!todayKey || !days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const key = toDayKey(cursor.toISOString());
    if (!key || !days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getDominantMood(entries: DiaryEntry[]): MoodOption | null {
  if (!entries.length) return null;
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return winner ? getMoodOption(winner[0]) : null;
}

export function getTotalWords(entries: DiaryEntry[]): number {
  return entries.reduce((total, entry) => total + countWords(entry.content), 0);
}
