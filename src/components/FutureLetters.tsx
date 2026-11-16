import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Download,
  Info,
  Lock,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  Unlock
} from 'lucide-react';
import { FutureLetter, Mood, User } from '../types';
import { MOODS, getMoodEmoji, getMoodLabel } from '../lib/moods';

interface FutureLettersProps {
  user: User;
  letters: FutureLetter[];
  onSaveLetters: (letters: FutureLetter[]) => void;
  onConvertToDiaryEntry?: (letter: FutureLetter) => void;
}

function createGoogleCalendarUrl(title: string, unlockDate: string, email?: string): string {
  const dateObj = new Date(unlockDate);
  const startStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
  const endStr = endObj.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const details = encodeURIComponent(
    `Saatnya membuka surat masa depan dari aplikasi Kenang! Kunjungi aplikasi untuk membaca pesan yang kamu tulis untuk dirimu sendiri.`
  );
  const eventTitle = encodeURIComponent(`💌 Buka Surat Masa Depan: ${title}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startStr}/${endStr}&details=${details}&add=${encodeURIComponent(
    email || ''
  )}`;
}

function downloadIcsFile(title: string, unlockDate: string): void {
  const dateObj = new Date(unlockDate);
  const startStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
  const endStr = endObj.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kenang//Surat Masa Depan//ID',
    'BEGIN:VEVENT',
    `SUMMARY:💌 Buka Surat Masa Depan: ${title}`,
    `DESCRIPTION:Saatnya membuka surat masa depan yang telah kamu tulis di aplikasi Kenang.`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Surat Masa Depan Kenang',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pengingat-surat-kenang-${Date.now()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function calculateTimeRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) {
    return { isReady: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { isReady: false, days, hours, minutes, seconds };
}

const FutureLetters: React.FC<FutureLettersProps> = ({
  user,
  letters,
  onSaveLetters,
  onConvertToDiaryEntry
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [viewingLetter, setViewingLetter] = useState<FutureLetter | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('hopeful');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['harapan', 'masa-depan']);
  const [targetEmail, setTargetEmail] = useState(user.email || '');

  // Default target date: 1 year from now (e.g. 17 Nov next year)
  const defaultDateString = useMemo(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setHours(9, 0, 0, 0);
    return nextYear.toISOString().slice(0, 16);
  }, []);

  const [unlockDateTime, setUnlockDateTime] = useState(defaultDateString);

  // Live timer tick every second for countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const setPresetDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    d.setHours(9, 0, 0, 0);
    setUnlockDateTime(d.toISOString().slice(0, 16));
  };

  const handleSealLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const unlockIso = new Date(unlockDateTime).toISOString();
    if (new Date(unlockIso).getTime() <= Date.now()) {
      alert('Tanggal buka surat harus di masa depan!');
      return;
    }

    const newLetter: FutureLetter = {
      id: `letter_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      content: content.trim(),
      mood,
      tags,
      createdAt: new Date().toISOString(),
      unlockDate: unlockIso,
      targetEmail: targetEmail.trim() || user.email,
      isOpened: false
    };

    onSaveLetters([newLetter, ...letters]);

    // Reset form
    setTitle('');
    setContent('');
    setMood('hopeful');
    setTags(['harapan', 'masa-depan']);
    setActiveTab('inbox');
    setViewingLetter(newLetter); // show newly sealed letter preview with calendar links
  };

  const handleDeleteLetter = (id: string) => {
    if (window.confirm('Yakin ingin menghapus surat masa depan ini?')) {
      onSaveLetters(letters.filter((l) => l.id !== id));
      if (viewingLetter?.id === id) setViewingLetter(null);
    }
  };

  const handleOpenLetter = (letter: FutureLetter) => {
    const updated = letters.map((l) =>
      l.id === letter.id ? { ...l, isOpened: true, openedAt: l.openedAt || new Date().toISOString() } : l
    );
    onSaveLetters(updated);
    setViewingLetter({ ...letter, isOpened: true });
  };

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      const remaining = calculateTimeRemaining(l.unlockDate);
      if (filter === 'locked') return !remaining.isReady;
      if (filter === 'unlocked') return remaining.isReady;
      return true;
    });
  }, [letters, filter]);

  const readyToOpenCount = useMemo(() => {
    return letters.filter((l) => calculateTimeRemaining(l.unlockDate).isReady).length;
  }, [letters]);

  const sealedCount = letters.length - readyToOpenCount;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Kapsul Waktu Kenang
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Surat untuk Masa Depan 💌
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-pink-100 sm:text-base">
              Tulis pesan, doa, dan mimpimu hari ini untuk dibaca oleh dirimu di masa depan. Surat akan
              <strong> terkunci rapat</strong> hingga tanggal buka tiba dan dilengkapi pengingat email/kalender.
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold shadow-lg transition-all active:scale-95 ${
                activeTab === 'compose'
                  ? 'bg-white text-pink-600'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              <Plus className="h-4 w-4" />
              Tulis Surat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold shadow-lg transition-all active:scale-95 ${
                activeTab === 'inbox'
                  ? 'bg-white text-pink-600'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              <Mail className="h-4 w-4" />
              Kotak Surat ({letters.length})
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:w-fit">
          <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
            <span className="text-xs text-pink-200">🔒 Masih Tersegel</span>
            <p className="text-xl font-bold">{sealedCount} Surat</p>
          </div>
          <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
            <span className="text-xs text-pink-200">🎉 Siap Dibuka</span>
            <p className="text-xl font-bold">{readyToOpenCount} Surat</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'compose' ? (
        /* Form Tulis Surat */
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tulis Surat untuk Masa Depan</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Setelah disegel, isi surat ini tidak dapat diedit agar momen tetap otentik.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSealLetter} className="space-y-6">
            {/* Judul Surat */}
            <div>
              <label htmlFor="letter-title" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Judul Surat
              </label>
              <input
                id="letter-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Untuk Diriku Satu Tahun dari Sekarang (17 November 2027)"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Isi Surat */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="letter-content" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Isi Surat
                </label>
                <span className="text-xs text-gray-400">{content.length} karakter</span>
              </div>
              <textarea
                id="letter-content"
                required
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Halo diriku di masa depan...&#10;&#10;Saat kamu membaca surat ini, kuharap kamu sedang berbahagia. Hari ini aku ingin bercerita tentang apa yang sedang kurasakan, impian yang sedang kuperjuangkan, dan orang-orang yang kusayangi..."
                className="w-full rounded-2xl border border-gray-300 p-4 text-base leading-relaxed text-gray-900 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Mood & Tag */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Mood Saat Menulis Surat
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMood(m.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        mood === m.value
                          ? 'bg-pink-500 text-white shadow-md'
                          : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      }`}
                    >
                      <span>{getMoodEmoji(m.value)}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="letter-tag" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tag Surat
                </label>
                <div className="flex gap-2">
                  <input
                    id="letter-tag"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Tambah tag lalu Enter"
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    Tambah
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-pink-800 dark:hover:text-pink-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Waktu Pembukaan (Unlock Date) */}
            <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-5 dark:border-pink-900/30 dark:bg-pink-950/20">
              <label htmlFor="letter-unlock-date" className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">
                📅 Kapan Surat Ini Boleh Dibuka?
              </label>

              {/* Quick Presets */}
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { label: '1 Bulan Lagi', months: 1 },
                  { label: '3 Bulan Lagi', months: 3 },
                  { label: '6 Bulan Lagi', months: 6 },
                  { label: '1 Tahun Lagi (17 Nov...)', months: 12 },
                  { label: '3 Tahun Lagi', months: 36 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPresetDate(preset.months)}
                    className="rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100 dark:border-pink-800 dark:bg-gray-800 dark:text-pink-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Pilih Tanggal & Jam Buka:
                  </span>
                  <input
                    id="letter-unlock-date"
                    type="datetime-local"
                    required
                    value={unlockDateTime}
                    onChange={(e) => setUnlockDateTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="letter-target-email" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Email Pengingat (Gmail):
                  </label>
                  <input
                    id="letter-target-email"
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-pink-800 dark:text-pink-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Surat akan dibuka pada{' '}
                  <strong>
                    {new Date(unlockDateTime).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </strong>
                  . Setelah disegel, Anda dapat langsung menambahkan pengingat otomatis ke Google Calendar & Gmail Anda.
                </span>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab('inbox')}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-pink-600 hover:to-purple-700 active:scale-95"
              >
                <Lock className="h-4 w-4" />
                Segel Surat Ini 🔒
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Inbox / Daftar Surat Masa Depan */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  filter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                Semua ({letters.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('locked')}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  filter === 'locked'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                🔒 Masih Terkunci ({sealedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unlocked')}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  filter === 'unlocked'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                🎉 Siap Dibuka ({readyToOpenCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-pink-600 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Tulis Surat Baru
            </button>
          </div>

          {/* Letters Grid */}
          {filteredLetters.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-500 dark:bg-pink-950/40">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Belum Ada Surat Masa Depan</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Tulis satu surat untuk dirimu 1 tahun lagi. Tuangkan mimpi, harapan, dan perasaanmu hari ini!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-pink-600"
              >
                <Plus className="h-4 w-4" />
                Mulai Tulis Surat Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredLetters.map((letter) => {
                const remaining = calculateTimeRemaining(letter.unlockDate);
                const isReady = remaining.isReady;

                return (
                  <div
                    key={letter.id}
                    className={`relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-lg ${
                      isReady
                        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white dark:border-emerald-800 dark:from-emerald-950/20 dark:to-gray-800'
                        : 'border-pink-200 bg-gradient-to-br from-purple-50/40 via-white to-pink-50/40 dark:border-pink-900/40 dark:from-gray-800 dark:to-gray-850'
                    } p-6`}
                  >
                    {/* Top Status */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <Unlock className="h-3.5 w-3.5" />
                            Siap Dibuka! 🎉
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700 dark:bg-pink-900/50 dark:text-pink-300">
                            <Lock className="h-3.5 w-3.5" />
                            Tersegel Rapat 🔒
                          </span>
                        )}
                        <span className="text-sm">{getMoodEmoji(letter.mood)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLetter(letter.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                        title="Hapus surat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Judul Surat */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                      {letter.title}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Ditulis pada {new Date(letter.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>

                    {/* Countdown or Ready Banner */}
                    <div className="my-5 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800">
                      {isReady ? (
                        <div className="text-center py-2">
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            ✨ Waktu yang ditentukan telah tiba!
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Surat ini siap kamu buka dan baca.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Hitung Mundur Pembukaan
                          </span>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="rounded-xl bg-pink-50 p-2 dark:bg-pink-950/40">
                              <span className="block text-xl font-black text-pink-600 dark:text-pink-400">
                                {remaining.days}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-gray-500">Hari</span>
                            </div>
                            <div className="rounded-xl bg-pink-50 p-2 dark:bg-pink-950/40">
                              <span className="block text-xl font-black text-pink-600 dark:text-pink-400">
                                {String(remaining.hours).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-gray-500">Jam</span>
                            </div>
                            <div className="rounded-xl bg-pink-50 p-2 dark:bg-pink-950/40">
                              <span className="block text-xl font-black text-pink-600 dark:text-pink-400">
                                {String(remaining.minutes).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-gray-500">Mnt</span>
                            </div>
                            <div className="rounded-xl bg-pink-50 p-2 dark:bg-pink-950/40">
                              <span className="block text-xl font-black text-pink-600 dark:text-pink-400">
                                {String(remaining.seconds).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-gray-500">Dtk</span>
                            </div>
                          </div>
                          <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            Akan terbuka pada:{' '}
                            <strong className="text-gray-700 dark:text-gray-300">
                              {new Date(letter.unlockDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Preview Box */}
                    {isReady ? (
                      <button
                        type="button"
                        onClick={() => handleOpenLetter(letter)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 font-semibold text-white shadow-md transition hover:from-emerald-600 hover:to-teal-700 active:scale-95"
                      >
                        <Mail className="h-4 w-4" />
                        Buka & Baca Surat 🎉
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-gray-100/70 p-3 text-center text-xs text-gray-500 dark:bg-gray-800/70 dark:text-gray-400">
                          🔒 Isi surat disembunyikan sampai waktu pembukaan tiba.
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={createGoogleCalendarUrl(letter.title, letter.unlockDate, letter.targetEmail)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50 py-2.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-300"
                            title="Simpan pengingat ke Google Calendar / Gmail"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Ingatkan di Gmail
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadIcsFile(letter.title, letter.unlockDate)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            title="Unduh file kalender .ics"
                          >
                            <Download className="h-3.5 w-3.5" />
                            .ics
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Baca Surat Terbuka */}
      {viewingLetter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewingLetter(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-800 sm:p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-6 border-b border-gray-100 pb-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                  <Mail className="h-3.5 w-3.5" />
                  Surat Masa Depan
                </span>
                <button
                  type="button"
                  onClick={() => setViewingLetter(null)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>

              <h2 className="mt-3 text-2xl font-black text-gray-900 dark:text-white">
                {viewingLetter.title}
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ditulis pada{' '}
                <strong>
                  {new Date(viewingLetter.createdAt).toLocaleDateString('id-ID', {
                    dateStyle: 'full'
                  })}
                </strong>{' '}
                • Mood saat menulis: {getMoodEmoji(viewingLetter.mood)} {getMoodLabel(viewingLetter.mood)}
              </p>
            </div>

            {/* Content Check: Is it unlocked or just previewing? */}
            {calculateTimeRemaining(viewingLetter.unlockDate).isReady ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                  💌 Halo! Ini adalah pesan dari dirimu di masa lalu. Luangkan waktu sejenak untuk
                  menghayati kembali apa yang pernah kamu rasakan saat menulis pesan ini.
                </div>

                <div className="whitespace-pre-wrap rounded-2xl bg-gray-50 p-6 text-base leading-relaxed text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-100 dark:border-gray-800">
                  {viewingLetter.content}
                </div>

                {viewingLetter.tags && viewingLetter.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {viewingLetter.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {onConvertToDiaryEntry && (
                    <button
                      type="button"
                      onClick={() => {
                        onConvertToDiaryEntry(viewingLetter);
                        setViewingLetter(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-pink-600 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      Simpan ke Catatan Harian
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${viewingLetter.title}\n\n${viewingLetter.content}\n\n- Ditulis pada ${new Date(
                          viewingLetter.createdAt
                        ).toLocaleDateString('id-ID')}`
                      );
                      alert('Isi surat berhasil disalin ke clipboard!');
                    }}
                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Salin Teks
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingLetter(null)}
                    className="rounded-xl bg-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* Still Sealed Preview */
              <div className="space-y-6 text-center py-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400 animate-pulse">
                  <Lock className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Surat Ini Masih Tersegel Rapat</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Surat ini dijadwalkan terbuka pada{' '}
                    <strong>
                      {new Date(viewingLetter.unlockDate).toLocaleDateString('id-ID', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}
                    </strong>
                    . Tunggu hingga waktunya tiba ya!
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-50 p-4 text-xs text-pink-700 dark:bg-pink-950/30 dark:text-pink-300 max-w-md mx-auto">
                  💡 Jangan lupa pasang pengingat di Google Calendar / Gmail Anda agar tidak terlewatkan saat surat terbuka:
                </div>

                <div className="flex justify-center gap-3">
                  <a
                    href={createGoogleCalendarUrl(viewingLetter.title, viewingLetter.unlockDate, viewingLetter.targetEmail)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-pink-600"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Pasang Pengingat di Gmail
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadIcsFile(viewingLetter.title, viewingLetter.unlockDate)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    <Download className="h-4 w-4" />
                    Unduh Kalender .ics
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureLetters;
