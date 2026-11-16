import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Download,
  Edit,
  Flame,
  Globe,
  Heart,
  Lock,
  Plus,
  Share2,
  Tag,
  Trash2,
  TrendingUp,
  User
} from 'lucide-react';
import { DiaryEntry } from '../types';
import ShareModal from './ShareModal';
import ExportModal from './ExportModal';
import AdvancedSearch from './AdvancedSearch';
import {
  formatDate,
  getDominantMood,
  getMoodBadge,
  getMoodEmoji,
  getMoodLabel,
  getTotalWords,
  getWritingStreak
} from '../lib/moods';

interface DashboardProps {
  entries: DiaryEntry[];
  userName: string;
  avatar?: string;
  onEditProfile?: () => void;
  onNewEntry: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onViewEntry: (entry: DiaryEntry) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  entries,
  userName,
  avatar,
  onEditProfile,
  onNewEntry,
  onEditEntry,
  onDeleteEntry,
  onViewEntry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>(entries);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; entry: DiaryEntry | null }>({
    isOpen: false,
    entry: null
  });
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setFilteredEntries(entries);
  }, [entries]);

  const stats = useMemo(() => {
    const dominantMood = getDominantMood(entries);
    return [
      {
        label: 'Total catatan',
        value: entries.length.toString(),
        icon: BookOpen,
        accent: 'from-pink-500 to-rose-500'
      },
      {
        label: 'Streak menulis',
        value: `${getWritingStreak(entries)} hari`,
        icon: Flame,
        accent: 'from-orange-500 to-amber-500'
      },
      {
        label: 'Kata tertulis',
        value: getTotalWords(entries).toLocaleString('id-ID'),
        icon: TrendingUp,
        accent: 'from-purple-500 to-indigo-500'
      },
      {
        label: 'Mood favorit',
        value: dominantMood ? `${dominantMood.emoji} ${dominantMood.label}` : '—',
        icon: Heart,
        accent: 'from-blue-500 to-cyan-500'
      }
    ];
  }, [entries]);

  const handleShare = (entry: DiaryEntry) => {
    if (!entry.isPrivate) setShareModal({ isOpen: true, entry });
  };

  const openEntry = (entry: DiaryEntry) => onViewEntry(entry);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 animate-slide-up">
          {avatar ? (
            <button
              type="button"
              onClick={onEditProfile}
              title="Ganti Avatar Profil"
              className="group relative shrink-0 focus:outline-none"
            >
              <img
                src={avatar}
                alt={userName}
                className="h-14 w-14 rounded-full border-2 border-pink-300 object-cover shadow-md transition group-hover:scale-105 group-hover:ring-2 group-hover:ring-pink-400 dark:border-pink-700"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[10px] text-white shadow-xs">
                ✏️
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onEditProfile}
              title="Pilih Avatar Berwarna"
              className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 text-white shadow-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <User className="h-7 w-7" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white shadow-xs">
                +
              </span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                Halo, {userName} 👋
              </p>
              {onEditProfile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700 transition hover:bg-pink-200 dark:bg-pink-900/50 dark:text-pink-300"
                >
                  Edit Profil
                </button>
              )}
            </div>
            <h2 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Catatan Hati Anda
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">
              {entries.length} catatan tersimpan • {filteredEntries.length} ditampilkan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
          >
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={onNewEntry}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-pink-600 hover:to-pink-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>Tulis Catatan</span>
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80 animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} shadow-sm`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <p className="truncate text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <AdvancedSearch
        entries={entries}
        onFilteredResults={setFilteredEntries}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80 sm:p-6">
        {filteredEntries.length === 0 ? (
          <div className="py-14 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 dark:bg-pink-900/20">
              <Heart className="h-8 w-8 text-pink-400 dark:text-pink-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-600 dark:text-gray-300">
              {entries.length === 0 ? 'Belum ada catatan' : 'Tidak ada catatan yang cocok'}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-gray-400 dark:text-gray-500">
              {entries.length === 0
                ? 'Mulai tulis catatan pertama Anda. Setiap kenangan kecil layak untuk disimpan.'
                : 'Coba ubah kata kunci pencarian atau filter yang aktif.'}
            </p>
            {entries.length === 0 && (
              <button
                type="button"
                onClick={onNewEntry}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-pink-600 hover:to-pink-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Tulis Catatan Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry, index) => (
              <article
                key={entry.id}
                role="button"
                tabIndex={0}
                onClick={() => openEntry(entry)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openEntry(entry);
                  }
                }}
                aria-label={`Baca catatan ${entry.title}`}
                className="group flex cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-pink-500/40 animate-slide-up"
                style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getMoodBadge(entry.mood)}`}>
                      {getMoodEmoji(entry.mood)} {getMoodLabel(entry.mood)}
                    </span>
                    {entry.isPrivate ? (
                      <Lock className="h-3.5 w-3.5 text-gray-400" aria-label="Pribadi" />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-gray-400" aria-label="Publik" />
                    )}
                  </div>
                  <div className="-mr-1 flex shrink-0 items-center gap-0.5 opacity-80 transition group-hover:opacity-100">
                    {!entry.isPrivate && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleShare(entry);
                        }}
                        className="rounded-full p-1.5 transition hover:bg-green-100 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:hover:bg-green-900/40"
                        title="Bagikan catatan"
                        aria-label={`Bagikan ${entry.title}`}
                      >
                        <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditEntry(entry);
                      }}
                      className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                      aria-label={`Edit ${entry.title}`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteEntry(entry.id);
                      }}
                      className="rounded-full p-1.5 text-red-500 transition hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:text-red-400 dark:hover:bg-red-900/40"
                      aria-label={`Hapus ${entry.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-pink-600 dark:text-white dark:group-hover:text-pink-400">
                  {entry.title}
                </h3>
                <p className="mb-4 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {entry.content}
                </p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(entry.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-pink-600 opacity-0 transition group-hover:opacity-100 dark:text-pink-400">
                    Baca <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                {entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSearchTerm(`#${tag}`);
                        }}
                        className="inline-flex items-center gap-0.5 rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700 transition hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50"
                        title={`Cari catatan dengan tag "${tag}"`}
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </button>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{entry.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {shareModal.isOpen && shareModal.entry && (
        <ShareModal
          isOpen={shareModal.isOpen}
          entry={shareModal.entry}
          onClose={() => setShareModal({ isOpen: false, entry: null })}
        />
      )}

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          entries={entries}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
