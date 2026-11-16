import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Cloud,
  Globe,
  Heart,
  Lock,
  Save,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { DiaryEntry, EntrySeed, Mood } from '../types';
import { MOODS, countCharacters, countWords, getMoodEmoji } from '../lib/moods';
import { clearDraft, loadDraft, saveDraft } from '../lib/storage';

interface EntryEditorProps {
  entry: DiaryEntry | null;
  seed?: EntrySeed | null;
  entries: DiaryEntry[];
  userId: string;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const COMMON_TAGS = [
  'romantis',
  'kenangan',
  'anniversary',
  'spesial',
  'kencan-pertama',
  'valentine',
  'ulang-tahun',
  'kejutan',
  'manis',
  'lucu',
  'sedih',
  'bahagia',
  'bersyukur',
  'harapan',
  'mimpi',
  'masa-depan'
];

const EntryEditor: React.FC<EntryEditorProps> = ({ entry, seed, entries, userId, onSave, onCancel }) => {
  const seedDraft = entry ? null : seed ?? null;
  const [restoredDraft] = useState(() => (entry || seedDraft ? null : loadDraft(userId)));
  const [title, setTitle] = useState(entry?.title ?? seedDraft?.title ?? restoredDraft?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? seedDraft?.content ?? restoredDraft?.content ?? '');
  const [mood, setMood] = useState<Mood>(entry?.mood ?? seedDraft?.mood ?? restoredDraft?.mood ?? 'love');
  const [isPrivate, setIsPrivate] = useState(entry?.isPrivate ?? restoredDraft?.isPrivate ?? true);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? seedDraft?.tags ?? restoredDraft?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showDraftBanner, setShowDraftBanner] = useState(Boolean(restoredDraft));
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!entry) return;
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setIsPrivate(entry.isPrivate);
    setTags(entry.tags);
  }, [entry]);

  const availableTags = useMemo(() => {
    const existing = entries.flatMap((item) => item.tags);
    return Array.from(new Set([...existing, ...COMMON_TAGS])).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const filteredSuggestions = useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    if (!query) return [];
    return availableTags
      .filter((tag) => tag.toLowerCase().includes(query) && !tags.includes(tag))
      .slice(0, 8);
  }, [availableTags, tagInput, tags]);

  // Autosave draft hanya untuk catatan baru, agar edit catatan lama tidak tertimpa draft usang.
  useEffect(() => {
    if (entry) return;
    if (!title.trim() && !content.trim()) {
      clearDraft(userId);
      setDraftSavedAt(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      const saved = saveDraft(userId, { title, content, mood, isPrivate, tags });
      if (saved) setDraftSavedAt(new Date());
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [title, content, mood, isPrivate, tags, userId, entry]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Judul wajib diisi';
    if (content.trim().length < 3) nextErrors.content = 'Isi catatan minimal 3 karakter';
    if (title.trim().length > 120) nextErrors.title = 'Judul maksimal 120 karakter';
    if (tags.length > 5) nextErrors.tags = 'Maksimal 5 tag diperbolehkan';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      mood,
      isPrivate,
      tags
    });

    if (!entry) clearDraft(userId);
  };

  const addTag = (rawTag: string) => {
    const normalized = rawTag.trim().toLowerCase().replace(/^#/, '').slice(0, 24);
    if (!normalized || tags.includes(normalized) || tags.length >= 5) return;
    setTags((previous) => [...previous, normalized]);
    setTagInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setErrors((previous) => ({ ...previous, tags: '' }));
    tagInputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    setTags((previous) => previous.filter((tag) => tag !== tagToRemove));
    setErrors((previous) => ({ ...previous, tags: '' }));
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        addTag(tagInput);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedSuggestionIndex((previous) =>
        previous < filteredSuggestions.length - 1 ? previous + 1 : 0
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedSuggestionIndex((previous) =>
        previous > 0 ? previous - 1 : filteredSuggestions.length - 1
      );
      return;
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleTagChange = (value: string) => {
    setTagInput(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(value.trim().length > 0);
  };

  const discardDraft = () => {
    clearDraft(userId);
    setTitle('');
    setContent('');
    setMood('love');
    setIsPrivate(true);
    setTags([]);
    setTagInput('');
    setShowDraftBanner(false);
    setDraftSavedAt(null);
  };

  const words = countWords(content);
  const characters = countCharacters(content);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80 sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
              <Heart className="h-6 w-6 fill-current text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {entry ? 'Edit Catatan' : 'Catatan Baru'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {entry
                  ? 'Perbarui kenangan ini kapan pun Anda mau.'
                  : 'Tulis apa yang sedang Anda rasakan hari ini.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!entry && draftSavedAt && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <Cloud className="h-4 w-4" />
                Draft tersimpan {draftSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Tutup editor"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showDraftBanner && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 animate-slide-up">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Draft sebelumnya berhasil dipulihkan.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDraftBanner(false)}
                className="rounded-lg px-3 py-1.5 font-medium transition hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                Lanjutkan
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="rounded-lg px-3 py-1.5 font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Mulai baru
              </button>
            </div>
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
            if (event.key === 'Escape' && event.target === event.currentTarget) {
              onCancel();
            }
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="entry-title" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Judul Catatan <span className="text-red-500">*</span>
            </label>
            <input
              id="entry-title"
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) => {
                setTitle(event.target.value);
                setErrors((previous) => ({ ...previous, title: '' }));
              }}
              className={`w-full rounded-xl border px-4 py-3 text-lg text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white ${
                errors.title ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Berikan judul untuk catatan Anda..."
              autoFocus
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.title ? (
                <span className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" /> {errors.title}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Ctrl/Cmd + S untuk menyimpan cepat</span>
              )}
              <span className="text-xs text-gray-400">{title.length}/120</span>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bagaimana perasaan Anda?
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Pilih mood">
              {MOODS.map((option) => {
                const selected = mood === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMood(option.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                      selected
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm dark:border-pink-500 dark:bg-pink-900/30 dark:text-pink-300'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300 hover:bg-pink-50/50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-pink-500/60'
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">{option.emoji}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Privasi</legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  aria-pressed={isPrivate}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition ${
                    isPrivate
                      ? 'border-pink-500 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-900/30 dark:text-pink-300'
                      : 'border-gray-200 text-gray-600 hover:border-pink-300 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block font-semibold">Pribadi</span>
                    <span className="text-xs opacity-70">Hanya Anda</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  aria-pressed={!isPrivate}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition ${
                    !isPrivate
                      ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/30 dark:text-green-300'
                      : 'border-gray-200 text-gray-600 hover:border-green-300 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block font-semibold">Publik</span>
                    <span className="text-xs opacity-70">Bisa dibagikan</span>
                  </span>
                </button>
              </div>
            </fieldset>

            <div>
              <label htmlFor="entry-tag" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags <span className="font-normal text-gray-400">({tags.length}/5)</span>
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="entry-tag"
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(event) => handleTagChange(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => {
                    if (tagInput.trim()) setShowSuggestions(true);
                  }}
                  onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                  disabled={tags.length >= 5}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 text-sm text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder={tags.length >= 5 ? 'Batas tag tercapai' : 'Ketik lalu Enter, mis. romantis'}
                  autoComplete="off"
                />

                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-600 dark:bg-gray-700">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => addTag(suggestion)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                          index === selectedSuggestionIndex
                            ? 'bg-pink-50 text-pink-700 dark:bg-gray-600 dark:text-pink-300'
                            : 'text-gray-700 hover:bg-pink-50 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-pink-500">#</span>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.tags && (
                <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.tags}
                </span>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-3 py-1.5 text-sm font-medium text-pink-800 dark:border-pink-700 dark:from-pink-900/40 dark:to-purple-900/40 dark:text-pink-200 animate-scale-in"
                >
                  <span className="text-pink-500 dark:text-pink-400">#</span>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold text-pink-500 transition hover:bg-pink-200 hover:text-pink-800 dark:hover:bg-pink-800 dark:hover:text-pink-100"
                    aria-label={`Hapus tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="entry-content" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Isi Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="entry-content"
              value={content}
              maxLength={20000}
              onChange={(event) => {
                setContent(event.target.value);
                setErrors((previous) => ({ ...previous, content: '' }));
              }}
              rows={12}
              className={`w-full resize-y rounded-xl border px-4 py-3 leading-7 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white ${
                errors.content ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Tulis isi hati Anda di sini..."
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              {errors.content ? (
                <span className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" /> {errors.content}
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  {words} kata • {characters} karakter
                </span>
              )}
              <span className="text-xs text-gray-400">{content.length}/20.000</span>
            </div>
          </div>

          {!isPrivate && (
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              <Globe className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Catatan ini bisa dibagikan ke media sosial setelah disimpan.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 active:scale-95"
            >
              <Save className="h-5 w-5" />
              {entry ? 'Simpan Perubahan' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-500">
        <Check className="h-3.5 w-3.5" />
        {entry ? 'Perubahan akan disimpan ke perangkat ini.' : 'Draft tersimpan otomatis selama Anda menulis.'}
        <span className="mx-1">•</span>
        {getMoodEmoji(mood)} {MOODS.find((item) => item.value === mood)?.label}
      </p>
    </div>
  );
};

export default EntryEditor;
