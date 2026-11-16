import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Edit,
  Globe,
  Lock,
  Share2,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { DiaryEntry } from '../types';
import ShareModal from './ShareModal';
import {
  countWords,
  formatDate,
  formatDateTime,
  getMoodBadge,
  getMoodEmoji,
  getMoodLabel,
  getReadingTime
} from '../lib/moods';

interface EntryDetailProps {
  entry: DiaryEntry;
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entry, onClose, onEdit, onDelete }) => {
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showShare) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, showShare]);

  const words = countWords(entry.content);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-detail-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="my-4 w-full max-w-3xl rounded-3xl bg-white shadow-2xl dark:bg-gray-800 animate-scale-in">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 p-6 dark:border-gray-700 sm:p-8">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${getMoodBadge(entry.mood)}`}
              >
                <span aria-hidden="true">{getMoodEmoji(entry.mood)}</span>
                {getMoodLabel(entry.mood)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {entry.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                {entry.isPrivate ? 'Pribadi' : 'Publik'}
              </span>
            </div>
            <h2
              id="entry-detail-title"
              className="break-words text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-3xl"
            >
              {entry.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(entry.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {getReadingTime(entry.content)} menit baca
              </span>
              <span>{words} kata</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Tutup catatan"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-6 sm:px-8">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-8 text-gray-700 dark:text-gray-200">
            {entry.content}
          </p>

          {entry.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-5 dark:border-gray-700">
              <Tag className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
            <p className="mt-4 text-xs italic text-gray-400 dark:text-gray-500">
              Terakhir diperbarui {formatDateTime(entry.updatedAt)}
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-700 sm:p-6">
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
          <button
            type="button"
            onClick={() => setShowShare(true)}
            disabled={entry.isPrivate}
            title={entry.isPrivate ? 'Jadikan catatan publik untuk membagikannya' : 'Bagikan catatan'}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <Share2 className="h-4 w-4" />
            Bagikan
          </button>
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 active:scale-95"
          >
            <Edit className="h-4 w-4" />
            Edit Catatan
          </button>
        </footer>
      </article>

      {showShare && !entry.isPrivate && (
        <ShareModal isOpen={showShare} entry={entry} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

export default EntryDetail;
