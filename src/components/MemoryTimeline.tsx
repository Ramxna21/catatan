import React, { useState, useMemo } from 'react';
import { Calendar, Heart, Clock, MapPin, Users, Star, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { DiaryEntry } from '../types';

interface MemoryTimelineProps {
  entries: DiaryEntry[];
}

interface TimelineGroup {
  period: string;
  entries: DiaryEntry[];
  stats: {
    totalEntries: number;
    dominantMood: string;
    totalWords: number;
    averageWords: number;
  };
}

const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ entries }) => {
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'week'>('month');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const timelineData = useMemo(() => {
    let filteredEntries = entries;

    // Filter by mood
    if (selectedMood !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.mood === selectedMood);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredEntries = filteredEntries.filter(entry =>
        entry.title.toLowerCase().includes(searchLower) ||
        entry.content.toLowerCase().includes(searchLower) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Group entries by time period
    const groups = filteredEntries.reduce((acc, entry) => {
      const date = new Date(entry.createdAt);
      let groupKey = '';

      switch (viewMode) {
        case 'year':
          groupKey = date.getFullYear().toString();
          break;
        case 'month':
          groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          groupKey = weekStart.toISOString().split('T')[0];
          break;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(entry);
      return acc;
    }, {} as Record<string, DiaryEntry[]>);

    // Convert to timeline format with stats
    const timeline: TimelineGroup[] = Object.entries(groups)
      .map(([period, groupEntries]) => {
        const moodCounts = groupEntries.reduce((acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dominantMood = Object.entries(moodCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'love';

        const totalWords = groupEntries.reduce((sum, entry) => 
          sum + entry.content.split(/\s+/).length, 0
        );

        return {
          period,
          entries: groupEntries.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          stats: {
            totalEntries: groupEntries.length,
            dominantMood,
            totalWords,
            averageWords: Math.round(totalWords / groupEntries.length)
          }
        };
      })
      .sort((a, b) => b.period.localeCompare(a.period));

    return timeline;
  }, [entries, viewMode, selectedMood, searchTerm]);

  const formatPeriodLabel = (period: string) => {
    switch (viewMode) {
      case 'year':
        return `Tahun ${period}`;
      case 'month':
        const [year, month] = period.split('-');
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      case 'week':
        const weekStart = new Date(period);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      default:
        return period;
    }
  };

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

  const toggleGroupExpansion = (period: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(period)) {
      newExpanded.delete(period);
    } else {
      newExpanded.add(period);
    }
    setExpandedGroups(newExpanded);
  };

  const getMemoryMilestones = () => {
    if (entries.length === 0) return [];

    const milestones = [];
    
    // First entry
    const firstEntry = entries.reduce((oldest, entry) => 
      new Date(entry.createdAt) < new Date(oldest.createdAt) ? entry : oldest
    );
    milestones.push({
      type: 'first',
      title: 'Catatan Pertama',
      description: `"${firstEntry.title}"`,
      date: firstEntry.createdAt,
      icon: '🌱'
    });

    // 100th entry milestone
    if (entries.length >= 100) {
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      milestones.push({
        type: 'milestone',
        title: 'Catatan ke-100',
        description: `"${sortedEntries[99].title}"`,
        date: sortedEntries[99].createdAt,
        icon: '🎉'
      });
    }

    // Longest writing streak
    const streaks = calculateWritingStreaks();
    if (streaks.length > 0) {
      const longestStreak = streaks[0];
      milestones.push({
        type: 'streak',
        title: `Streak Terpanjang: ${longestStreak.length} hari`,
        description: `${new Date(longestStreak.start).toLocaleDateString('id-ID')} - ${new Date(longestStreak.end).toLocaleDateString('id-ID')}`,
        date: longestStreak.end,
        icon: '🔥'
      });
    }

    return milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateWritingStreaks = () => {
    if (entries.length === 0) return [];
    
    const sortedDates = entries
      .map(entry => new Date(entry.createdAt).toDateString())
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index);

    const streaks = [];
    let currentStreak = { start: sortedDates[0], end: sortedDates[0], length: 1 };

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currentDate = new Date(sortedDates[i]);
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak.end = sortedDates[i];
        currentStreak.length++;
      } else {
        if (currentStreak.length >= 3) {
          streaks.push({ ...currentStreak });
        }
        currentStreak = { start: sortedDates[i], end: sortedDates[i], length: 1 };
      }
    }

    if (currentStreak.length >= 3) {
      streaks.push(currentStreak);
    }

    return streaks.sort((a, b) => b.length - a.length);
  };

  const milestones = getMemoryMilestones();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Memory Timeline
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Perjalanan waktu melalui catatan hati Anda
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tampilan
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="week">Per Minggu</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          </div>

          {/* Mood Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter Mood
            </label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Semua Mood</option>
              <option value="love">💕 Cinta</option>
              <option value="happy">😊 Bahagia</option>
              <option value="sad">😢 Sedih</option>
              <option value="hopeful">🌟 Berharap</option>
              <option value="grateful">🙏 Bersyukur</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cari Memori
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
                placeholder="Cari dalam judul atau isi..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-6 w-6 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Milestone Perjalanan
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {milestones.slice(0, 3).map((milestone, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 animate-slide-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{milestone.icon}</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {milestone.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {milestone.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(milestone.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {timelineData.length === 0 ? (
          <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl">
            <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Tidak ada catatan ditemukan
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </div>
        ) : (
          timelineData.map((group, groupIndex) => (
            <div
              key={group.period}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden animate-slide-up"
              style={{ animationDelay: `${groupIndex * 0.1}s` }}
            >
              {/* Group Header */}
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 cursor-pointer hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                onClick={() => toggleGroupExpansion(group.period)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 rounded-full p-3">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {formatPeriodLabel(group.period)}
                      </h3>
                      <div className="flex items-center space-x-4 text-pink-100 text-sm mt-1">
                        <span>{group.stats.totalEntries} catatan</span>
                        <span>•</span>
                        <span>{group.stats.totalWords.toLocaleString()} kata</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <span>{getMoodEmoji(group.stats.dominantMood)}</span>
                          <span className="capitalize">{group.stats.dominantMood}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{group.stats.averageWords}</div>
                      <div className="text-pink-100 text-xs">rata-rata kata</div>
                    </div>
                    {expandedGroups.has(group.period) ? (
                      <ChevronUp className="h-6 w-6" />
                    ) : (
                      <ChevronDown className="h-6 w-6" />
                    )}
                  </div>
                </div>
              </div>

              {/* Group Content */}
              {expandedGroups.has(group.period) && (
                <div className="p-6 space-y-4 animate-slide-up">
                  {group.entries.map((entry, entryIndex) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up"
                      style={{ animationDelay: `${entryIndex * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(entry.mood)}`}>
                            {getMoodEmoji(entry.mood)} {entry.mood}
                          </span>
                          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.content.split(/\s+/).length} kata
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-pink-600 dark:hover:text-pink-400 transition-colors duration-300">
                        {entry.title}
                      </h4>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-3">
                        {entry.content}
                      </p>
                      
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700"
                            >
                              <span className="text-pink-500">#</span>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoryTimeline;