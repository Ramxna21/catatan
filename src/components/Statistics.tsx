import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Heart, PieChart, Clock, Target, Award, RefreshCw } from 'lucide-react';
import { DiaryEntry } from '../types';

interface StatisticsProps {
  entries: DiaryEntry[];
}

const Statistics: React.FC<StatisticsProps> = ({ entries }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when entries change
  useEffect(() => {
    setLastUpdateTime(new Date().toLocaleTimeString('id-ID'));
    setDebugInfo(`Received ${entries?.length || 0} entries at ${new Date().toLocaleTimeString()}`);
    setForceUpdate(prev => prev + 1);
    console.log('Statistics useEffect - entries:', entries);
    console.log('Statistics useEffect - entries length:', entries?.length);
  }, [entries]);

  // DIRECT CALCULATION - No complex filtering first
  const directStats = useMemo(() => {
    console.log('=== DIRECT STATS CALCULATION ===');
    console.log('Raw entries received:', entries);
    console.log('Entries length:', entries?.length);
    console.log('Entries type:', typeof entries);
    console.log('Is array?', Array.isArray(entries));
    
    // Immediate return if no entries
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      console.log('No entries found, returning zeros');
      return {
        totalEntries: 0,
        totalWords: 0,
        averageWords: 0,
        moodCounts: {},
        tagCounts: {},
        writingStreak: 0,
        privateEntries: 0,
        publicEntries: 0,
        longestEntry: null
      };
    }

    // Direct calculations without complex logic
    const totalEntries = entries.length;
    console.log('Total entries (direct):', totalEntries);

    const totalWords = entries.reduce((sum, entry) => {
      if (entry && entry.content && typeof entry.content === 'string') {
        const words = entry.content.trim().split(/\s+/).filter(word => word.length > 0);
        return sum + words.length;
      }
      return sum;
    }, 0);
    console.log('Total words (direct):', totalWords);

    const averageWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    console.log('Average words (direct):', averageWords);

    const moodCounts = entries.reduce((acc, entry) => {
      if (entry && entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    console.log('Mood counts (direct):', moodCounts);

    const tagCounts = entries.reduce((acc, entry) => {
      if (entry && entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          if (tag) {
            acc[tag] = (acc[tag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);
    console.log('Tag counts (direct):', tagCounts);

    const privateEntries = entries.filter(entry => entry && entry.isPrivate === true).length;
    const publicEntries = entries.filter(entry => entry && entry.isPrivate === false).length;
    console.log('Privacy counts (direct):', { privateEntries, publicEntries });

    const longestEntry = entries.reduce((longest, entry) => {
      if (!entry || !entry.content) return longest;
      if (!longest || !longest.content) return entry;
      return entry.content.length > longest.content.length ? entry : longest;
    }, null);
    console.log('Longest entry (direct):', longestEntry?.title);

    const result = {
      totalEntries,
      totalWords,
      averageWords,
      moodCounts,
      tagCounts,
      writingStreak: 0, // Simplified for now
      privateEntries,
      publicEntries,
      longestEntry
    };

    console.log('=== FINAL DIRECT STATS ===', result);
    return result;
  }, [entries, forceUpdate]);

  // Filtered entries based on time range
  const filteredEntries = useMemo(() => {
    if (!entries || !Array.isArray(entries)) return [];
    
    const now = new Date();
    let filtered = [...entries];
    
    switch (timeRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(entry => {
          try {
            return new Date(entry.createdAt) >= weekAgo;
          } catch {
            return false;
          }
        });
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = filtered.filter(entry => {
          try {
            return new Date(entry.createdAt) >= monthAgo;
          } catch {
            return false;
          }
        });
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filtered = filtered.filter(entry => {
          try {
            return new Date(entry.createdAt) >= yearAgo;
          } catch {
            return false;
          }
        });
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    return filtered;
  }, [entries, timeRange]);

  // Statistics for the filtered time range
  const statistics = useMemo(() => {
    if (timeRange === 'all') {
      return directStats;
    }

    // Calculate stats for filtered entries
    const totalEntries = filteredEntries.length;
    const totalWords = filteredEntries.reduce((sum, entry) => {
      if (entry && entry.content) {
        return sum + entry.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      }
      return sum;
    }, 0);

    const moodCounts = filteredEntries.reduce((acc, entry) => {
      if (entry && entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const tagCounts = filteredEntries.reduce((acc, entry) => {
      if (entry && entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          if (tag) {
            acc[tag] = (acc[tag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntries,
      totalWords,
      averageWords: totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0,
      moodCounts,
      tagCounts,
      writingStreak: directStats.writingStreak,
      privateEntries: filteredEntries.filter(e => e && e.isPrivate === true).length,
      publicEntries: filteredEntries.filter(e => e && e.isPrivate === false).length,
      longestEntry: filteredEntries.reduce((longest, entry) => {
        if (!entry || !entry.content) return longest;
        if (!longest || !longest.content) return entry;
        return entry.content.length > longest.content.length ? entry : longest;
      }, null)
    };
  }, [filteredEntries, directStats, timeRange]);

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
      case 'love': return 'bg-pink-500';
      case 'happy': return 'bg-yellow-500';
      case 'sad': return 'bg-blue-500';
      case 'hopeful': return 'bg-purple-500';
      case 'grateful': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const topTags = Object.entries(statistics.tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const mostFrequentMood = Object.entries(statistics.moodCounts)
    .sort(([,a], [,b]) => b - a)[0];

  // Handle empty state
  if (!Array.isArray(entries) || entries.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="animate-slide-up">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Statistik Catatan
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Analisis pola dan tren dalam catatan hati Anda
            </p>
          </div>
        </div>

        <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl">
          <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 animate-pulse-soft" />
          <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Belum ada catatan
          </h3>
          <p className="text-gray-400 dark:text-gray-500 mb-4">
            Mulai tulis catatan pertama Anda untuk melihat statistik
          </p>
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-4 w-4" />
            <span>Data akan otomatis terupdate saat Anda menambah catatan</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Statistik Catatan
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Analisis pola dan tren dalam catatan hati Anda
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Debug: {debugInfo}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Raw entries: {entries?.length || 0} | Filtered: {filteredEntries?.length || 0} | Stats total: {statistics.totalEntries}
          </div>
          {lastUpdateTime && (
            <div className="flex items-center space-x-2 mt-1">
              <RefreshCw className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">
                Terupdate: {lastUpdateTime}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>
      </div>

      {/* Real-time Data Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-700 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Real-time: {entries?.length || 0} total catatan
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Menampilkan {filteredEntries?.length || 0} catatan untuk periode {timeRange === 'all' ? 'semua waktu' : timeRange}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Total Catatan</p>
              <p className="text-3xl font-bold">{statistics.totalEntries}</p>
              <p className="text-pink-200 text-xs mt-1">
                dari {entries.length} total
              </p>
            </div>
            <Heart className="h-12 w-12 text-pink-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Kata</p>
              <p className="text-3xl font-bold">{statistics.totalWords.toLocaleString()}</p>
              <p className="text-blue-200 text-xs mt-1">
                periode {timeRange}
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Rata-rata Kata</p>
              <p className="text-3xl font-bold">{statistics.averageWords}</p>
              <p className="text-purple-200 text-xs mt-1">
                per catatan
              </p>
            </div>
            <Target className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Streak Menulis</p>
              <p className="text-3xl font-bold">{statistics.writingStreak}</p>
              <p className="text-green-100 text-xs">hari berturut-turut</p>
            </div>
            <Award className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Distribution */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center space-x-2 mb-6">
            <PieChart className="h-6 w-6 text-pink-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Distribusi Mood
            </h3>
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              {Object.keys(statistics.moodCounts).length} mood berbeda
            </div>
          </div>
          
          {Object.keys(statistics.moodCounts).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(statistics.moodCounts).map(([mood, count]) => {
                const percentage = statistics.totalEntries > 0 ? (count / statistics.totalEntries) * 100 : 0;
                return (
                  <div key={mood} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getMoodEmoji(mood)}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {mood}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${getMoodColor(mood)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                Belum ada data mood
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tulis beberapa catatan untuk melihat distribusi mood
              </p>
            </div>
          )}

          {mostFrequentMood && (
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-700">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-pink-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mood Terfavorit
                </span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-2xl">{getMoodEmoji(mostFrequentMood[0])}</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                  {mostFrequentMood[0]}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({mostFrequentMood[1]} catatan)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top Tags */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="h-6 w-6 text-pink-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tag Terpopuler
            </h3>
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              {Object.keys(statistics.tagCounts).length} tag unik
            </div>
          </div>
          
          {topTags.length > 0 ? (
            <div className="space-y-4">
              {topTags.map(([tag, count], index) => {
                const maxCount = topTags[0][1];
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={tag} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-pink-500 font-bold">#{index + 1}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          #{tag}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {count} catatan
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                Belum ada tag yang digunakan
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mulai menambahkan tag pada catatan Anda
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Privacy Distribution */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Distribusi Privasi
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Pribadi</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {statistics.privateEntries}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Publik</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {statistics.publicEntries}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
              <div
                className="bg-pink-500 rounded-full h-2 transition-all duration-1000"
                style={{ 
                  width: `${statistics.totalEntries > 0 ? (statistics.privateEntries / statistics.totalEntries) * 100 : 0}%` 
                }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {statistics.totalEntries > 0 ? 
                `${((statistics.privateEntries / statistics.totalEntries) * 100).toFixed(1)}% pribadi` : 
                'Belum ada data'
              }
            </div>
          </div>
        </div>

        {/* Longest Entry */}
        {statistics.longestEntry && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Catatan Terpanjang
            </h4>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                {statistics.longestEntry.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statistics.longestEntry.content.length} karakter
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(statistics.longestEntry.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {/* Writing Frequency */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Frekuensi Menulis
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Periode: {timeRange === 'all' ? 'Semua waktu' : 
                         timeRange === 'year' ? 'Tahun ini' :
                         timeRange === 'month' ? 'Bulan ini' : 'Minggu ini'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.totalEntries > 0 && timeRange !== 'all' ? (
                timeRange === 'week' ? (statistics.totalEntries / 7).toFixed(1) :
                timeRange === 'month' ? (statistics.totalEntries / 30).toFixed(1) :
                (statistics.totalEntries / 365).toFixed(1)
              ) : statistics.totalEntries}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {timeRange !== 'all' ? 'catatan per hari' : 'total catatan'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;