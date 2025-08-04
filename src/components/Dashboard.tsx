import React, { useState } from 'react';
import { Plus, Calendar, Heart, Lock, Globe, Edit, Trash2, Share2, Tag, Download } from 'lucide-react';
import { DiaryEntry } from '../types';
import ShareModal from './ShareModal';
import ExportModal from './ExportModal';
import AdvancedSearch from './AdvancedSearch';

interface DashboardProps {
  entries: DiaryEntry[];
  onNewEntry: () => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, onNewEntry, onEditEntry, onDeleteEntry }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>(entries);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    entry: DiaryEntry | null;
  }>({
    isOpen: false,
    entry: null
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // Update filtered entries when entries prop changes
  React.useEffect(() => {
    console.log('Dashboard received entries:', entries);
    if (searchTerm === '') {
      setFilteredEntries(entries);
    }
  }, [entries]);

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'love': return '💕';
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'hopeful': return '🌟';
      case 'grateful': return '🙏';
      default: return '💭';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'love': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'happy': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'sad': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'hopeful': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'grateful': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleShare = (entry: DiaryEntry) => {
    if (!entry.isPrivate) {
      setShareModal({
        isOpen: true,
        entry
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Catatan Hati Anda
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {entries.length} catatan tersimpan • {filteredEntries.length} ditampilkan
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 animate-slide-up group"
          >
            <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={onNewEntry}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 animate-slide-up group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Tulis Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* Advanced Search Component */}
      <AdvancedSearch
        entries={entries}
        onFilteredResults={setFilteredEntries}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-pulse-soft" />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {entries.length === 0 ? 'Belum ada catatan' : 'Tidak ada catatan yang cocok'}
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              {entries.length === 0 
                ? 'Mulai tulis catatan pertama Anda' 
                : 'Coba ubah kata kunci pencarian atau filter'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-gray-200 dark:border-gray-700 group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(entry.mood)} group-hover:scale-110 transition-transform duration-300`}>
                      {getMoodEmoji(entry.mood)} {entry.mood}
                    </span>
                    {entry.isPrivate ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {!entry.isPrivate && (
                      <button
                        onClick={() => handleShare(entry)}
                        className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900 transition-all duration-300 hover:scale-110 active:scale-95 group"
                        title="Bagikan catatan"
                      >
                        <Share2 className="h-4 w-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-300 hover:scale-110 active:scale-95"
                      title="Hapus catatan"
                    >
                      <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
                  {entry.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {entry.content}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(entry.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                
                {entry.tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-1 mb-2">
                      <Tag className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 dark:from-pink-900 dark:to-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-700 hover:scale-110 transition-all duration-300 cursor-pointer hover:shadow-md hover:from-pink-200 hover:to-pink-300 dark:hover:from-pink-800 dark:hover:to-pink-700"
                          onClick={() => setSearchTerm(`#${tag}`)}
                          title={`Cari catatan dengan tag "${tag}"`}
                        >
                          <span className="text-pink-500 dark:text-pink-400">#</span>
                          <span className="font-medium">{tag}</span>
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          <span className="font-medium">+{entry.tags.length - 3}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
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