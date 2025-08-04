import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, X, Tag, Clock, Heart, SlidersHorizontal } from 'lucide-react';
import { DiaryEntry } from '../types';

interface AdvancedSearchProps {
  entries: DiaryEntry[];
  onFilteredResults: (results: DiaryEntry[]) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  entries, 
  onFilteredResults, 
  searchTerm, 
  onSearchTermChange 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    moods: [] as string[],
    tags: [] as string[],
    dateRange: 'all' as 'all' | 'week' | 'month' | 'year' | 'custom',
    customStartDate: '',
    customEndDate: '',
    privacy: 'all' as 'all' | 'private' | 'public',
    sortBy: 'newest' as 'newest' | 'oldest' | 'title' | 'mood',
    contentLength: 'all' as 'all' | 'short' | 'medium' | 'long'
  });

  const moods = [
    { value: 'love', label: 'Cinta', emoji: '💕', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
    { value: 'happy', label: 'Bahagia', emoji: '😊', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'sad', label: 'Sedih', emoji: '😢', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'hopeful', label: 'Berharap', emoji: '🌟', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'grateful', label: 'Bersyukur', emoji: '🙏', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  ];

  // Get all unique tags from entries
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)));

  useEffect(() => {
    const filtered = getFilteredEntries();
    onFilteredResults(filtered);
  }, [searchTerm, filters, entries]);

  const getFilteredEntries = () => {
    let filtered = [...entries];

    // Text search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const titleMatch = entry.title.toLowerCase().includes(searchLower);
        const contentMatch = entry.content.toLowerCase().includes(searchLower);
        const tagMatch = entry.tags.some(tag => 
          tag.toLowerCase().includes(searchLower) ||
          searchLower.includes(`#${tag.toLowerCase()}`)
        );
        return titleMatch || contentMatch || tagMatch;
      });
    }

    // Mood filter
    if (filters.moods.length > 0) {
      filtered = filtered.filter(entry => filters.moods.includes(entry.mood));
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(entry => 
        filters.tags.some(tag => entry.tags.includes(tag))
      );
    }

    // Privacy filter
    if (filters.privacy !== 'all') {
      filtered = filtered.filter(entry => 
        filters.privacy === 'private' ? entry.isPrivate : !entry.isPrivate
      );
    }

    // Date range filter
    const now = new Date();
    switch (filters.dateRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(entry => new Date(entry.createdAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = filtered.filter(entry => new Date(entry.createdAt) >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filtered = filtered.filter(entry => new Date(entry.createdAt) >= yearAgo);
        break;
      case 'custom':
        if (filters.customStartDate) {
          filtered = filtered.filter(entry => new Date(entry.createdAt) >= new Date(filters.customStartDate));
        }
        if (filters.customEndDate) {
          filtered = filtered.filter(entry => new Date(entry.createdAt) <= new Date(filters.customEndDate));
        }
        break;
    }

    // Content length filter
    if (filters.contentLength !== 'all') {
      filtered = filtered.filter(entry => {
        const length = entry.content.length;
        switch (filters.contentLength) {
          case 'short': return length <= 200;
          case 'medium': return length > 200 && length <= 800;
          case 'long': return length > 800;
          default: return true;
        }
      });
    }

    // Sort results
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'mood':
        filtered.sort((a, b) => a.mood.localeCompare(b.mood));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  };

  const handleMoodToggle = (mood: string) => {
    setFilters(prev => ({
      ...prev,
      moods: prev.moods.includes(mood) 
        ? prev.moods.filter(m => m !== mood)
        : [...prev.moods, mood]
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      moods: [],
      tags: [],
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      privacy: 'all',
      sortBy: 'newest',
      contentLength: 'all'
    });
    onSearchTermChange('');
  };

  const hasActiveFilters = () => {
    return searchTerm.trim() !== '' ||
           filters.moods.length > 0 ||
           filters.tags.length > 0 ||
           filters.dateRange !== 'all' ||
           filters.privacy !== 'all' ||
           filters.sortBy !== 'newest' ||
           filters.contentLength !== 'all';
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filters.moods.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.privacy !== 'all') count++;
    if (filters.sortBy !== 'newest') count++;
    if (filters.contentLength !== 'all') count++;
    return count;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari dalam judul, isi, atau tag catatan..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300 focus:scale-105"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 relative ${
              showAdvanced || hasActiveFilters()
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/20'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40"
            >
              <X className="h-4 w-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6 animate-slide-up border-t border-gray-200 dark:border-gray-600 pt-6">
          {/* Mood Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Filter berdasarkan Mood</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodToggle(mood.value)}
                  className={`px-3 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-1 ${
                    filters.moods.includes(mood.value)
                      ? 'bg-pink-500 text-white shadow-lg'
                      : `${mood.color} hover:scale-110`
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Filter berdasarkan Tag</span>
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-1 ${
                      filters.tags.includes(tag)
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/20'
                    }`}
                  >
                    <span className="text-pink-500">#</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Filter berdasarkan Tanggal</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'week', label: 'Minggu ini' },
                { value: 'month', label: 'Bulan ini' },
                { value: 'year', label: 'Tahun ini' },
                { value: 'custom', label: 'Custom' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: range.value as any }))}
                  className={`p-2 rounded-lg border text-sm transition-all duration-300 hover:scale-105 ${
                    filters.dateRange === range.value
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-pink-300 text-gray-700 dark:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 animate-slide-up">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Privacy Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Privasi
              </h4>
              <select
                value={filters.privacy}
                onChange={(e) => setFilters(prev => ({ ...prev, privacy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">Semua</option>
                <option value="private">Pribadi</option>
                <option value="public">Publik</option>
              </select>
            </div>

            {/* Content Length Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Panjang Isi
              </h4>
              <select
                value={filters.contentLength}
                onChange={(e) => setFilters(prev => ({ ...prev, contentLength: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">Semua</option>
                <option value="short">Pendek (≤200 kata)</option>
                <option value="medium">Sedang (200-800 kata)</option>
                <option value="long">Panjang (&gt;800 kata)</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Urutkan
              </h4>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="title">Judul A-Z</option>
                <option value="mood">Mood A-Z</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>
              Menampilkan {getFilteredEntries().length} dari {entries.length} catatan
            </span>
          </div>
          
          {hasActiveFilters() && (
            <div className="flex items-center space-x-2">
              <span className="text-pink-600 dark:text-pink-400 font-medium">
                {getActiveFilterCount()} filter aktif
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;