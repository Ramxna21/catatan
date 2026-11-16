import React, { useMemo } from 'react';
import { TrendingUp, Calendar, Heart, BarChart3, Activity, Zap } from 'lucide-react';
import { DiaryEntry } from '../types';

interface MoodAnalyticsProps {
  entries: DiaryEntry[];
}

const getMostProductiveDay = (entries: DiaryEntry[]) => {
  const dayCount = entries.reduce((acc, entry) => {
    const day = new Date(entry.createdAt).toLocaleDateString('id-ID', { weekday: 'long' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(dayCount).sort(([, a], [, b]) => b - a)[0];
};

const getAverageWordsPerMood = (entries: DiaryEntry[]) => {
  const moodWords = entries.reduce((acc, entry) => {
    const wordCount = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0;
    if (!acc[entry.mood]) {
      acc[entry.mood] = { total: 0, count: 0 };
    }
    acc[entry.mood].total += wordCount;
    acc[entry.mood].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return Object.entries(moodWords).map(([mood, data]) => ({
    mood,
    average: Math.round(data.total / data.count)
  })).sort((a, b) => b.average - a.average);
};

const getMoodStreaks = (entries: DiaryEntry[]) => {
  if (entries.length === 0) return [];

  const sortedEntries = [...entries].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const streaks: { mood: string; length: number; startDate: string; endDate: string }[] = [];
  let currentStreak = { mood: sortedEntries[0].mood, length: 1, startDate: sortedEntries[0].createdAt };

  for (let i = 1; i < sortedEntries.length; i++) {
    if (sortedEntries[i].mood === currentStreak.mood) {
      currentStreak.length++;
    } else {
      if (currentStreak.length >= 3) {
        streaks.push({
          ...currentStreak,
          endDate: sortedEntries[i - 1].createdAt
        });
      }
      currentStreak = {
        mood: sortedEntries[i].mood,
        length: 1,
        startDate: sortedEntries[i].createdAt
      };
    }
  }

  if (currentStreak.length >= 3) {
    streaks.push({
      ...currentStreak,
      endDate: sortedEntries[sortedEntries.length - 1].createdAt
    });
  }

  return streaks.sort((a, b) => b.length - a.length).slice(0, 3);
};

const MoodAnalytics: React.FC<MoodAnalyticsProps> = ({ entries }) => {
  const analytics = useMemo(() => {
    // Group entries by month for trend analysis
    const monthlyMoods = entries.reduce((acc, entry) => {
      const date = new Date(entry.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { love: 0, happy: 0, sad: 0, hopeful: 0, grateful: 0, total: 0 };
      }
      
      acc[monthKey][entry.mood]++;
      acc[monthKey].total++;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Calculate mood trends
    const sortedMonths = Object.keys(monthlyMoods).sort();
    const recentMonths = sortedMonths.slice(-6); // Last 6 months
    
    // Calculate mood percentages for recent months
    const moodTrends = recentMonths.map(month => {
      const data = monthlyMoods[month];
      return {
        month,
        love: (data.love / data.total) * 100,
        happy: (data.happy / data.total) * 100,
        sad: (data.sad / data.total) * 100,
        hopeful: (data.hopeful / data.total) * 100,
        grateful: (data.grateful / data.total) * 100,
        total: data.total
      };
    });

    // Calculate overall mood score (weighted positive emotions)
    const totalEntries = entries.length;
    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moodScore = totalEntries > 0 ? (
      ((moodCounts.love || 0) * 5 +
       (moodCounts.happy || 0) * 4 +
       (moodCounts.grateful || 0) * 4 +
       (moodCounts.hopeful || 0) * 3 +
       (moodCounts.sad || 0) * 1) / totalEntries
    ) : 0;

    // Detect patterns
    const patterns = {
      mostProductiveDay: getMostProductiveDay(entries),
      averageWordsPerMood: getAverageWordsPerMood(entries),
      moodStreaks: getMoodStreaks(entries)
    };

    return {
      monthlyMoods,
      moodTrends,
      moodScore,
      patterns,
      totalEntries
    };
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
      case 'love': return 'bg-pink-500';
      case 'happy': return 'bg-yellow-500';
      case 'sad': return 'bg-blue-500';
      case 'hopeful': return 'bg-purple-500';
      case 'grateful': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Sangat Positif';
    if (score >= 4) return 'Positif';
    if (score >= 3) return 'Netral';
    if (score >= 2) return 'Kurang Positif';
    return 'Perlu Perhatian';
  };

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analitik Mood
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Pahami pola emosi dan suasana hati dari catatan Anda
        </p>
      </div>
      {/* Mood Score Overview */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-2xl p-8 shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8" />
            <h3 className="text-2xl font-bold">Skor Mood Keseluruhan</h3>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{analytics.moodScore.toFixed(1)}</div>
            <div className="text-pink-100 text-sm">dari 5.0</div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-pink-100">Status Emosional:</span>
            <span className="font-bold text-lg">{getScoreLabel(analytics.moodScore)}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-1000"
              style={{ width: `${(analytics.moodScore / 5) * 100}%` }}
            />
          </div>
          <p className="text-pink-100 text-sm mt-3">
            Berdasarkan analisis {analytics.totalEntries} catatan hati Anda
          </p>
        </div>
      </div>

      {/* Mood Trends Chart */}
      {analytics.moodTrends.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-6 w-6 text-pink-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tren Mood 6 Bulan Terakhir
            </h3>
          </div>
          
          <div className="space-y-4">
            {analytics.moodTrends.map((monthData, index) => {
              const monthName = new Date(monthData.month + '-01').toLocaleDateString('id-ID', { 
                month: 'long', 
                year: 'numeric' 
              });
              
              return (
                <div key={monthData.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {monthName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {monthData.total} catatan
                    </span>
                  </div>
                  
                  <div className="flex h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {['love', 'happy', 'grateful', 'hopeful', 'sad'].map((mood) => {
                      const percentage = monthData[mood as keyof typeof monthData] as number;
                      if (percentage === 0) return null;
                      
                      return (
                        <div
                          key={mood}
                          className={`${getMoodColor(mood)} transition-all duration-1000`}
                          style={{ 
                            width: `${percentage}%`,
                            animationDelay: `${index * 0.1}s`
                          }}
                          title={`${mood}: ${percentage.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Productive Day */}
        {analytics.patterns.mostProductiveDay && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-pink-500" />
              <h4 className="font-bold text-gray-900 dark:text-white">Hari Paling Produktif</h4>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                {analytics.patterns.mostProductiveDay[0]}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {analytics.patterns.mostProductiveDay[1]} catatan
              </div>
            </div>
          </div>
        )}

        {/* Average Words per Mood */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-pink-500" />
            <h4 className="font-bold text-gray-900 dark:text-white">Kata per Mood</h4>
          </div>
          <div className="space-y-2">
            {analytics.patterns.averageWordsPerMood.slice(0, 3).map((item) => (
              <div key={item.mood} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{getMoodEmoji(item.mood)}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {item.mood}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.average} kata
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Streaks */}
        {analytics.patterns.moodStreaks.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-pink-500" />
              <h4 className="font-bold text-gray-900 dark:text-white">Streak Terpanjang</h4>
            </div>
            <div className="space-y-3">
              {analytics.patterns.moodStreaks.map((streak, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span>{getMoodEmoji(streak.mood)}</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {streak.mood}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                      {streak.length} hari
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(streak.startDate).toLocaleDateString('id-ID')} - {new Date(streak.endDate).toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Rekomendasi Personal
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.moodScore < 3 && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                💙 Tingkatkan Mood Positif
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Coba tulis tentang hal-hal yang Anda syukuri atau momen bahagia hari ini.
              </p>
            </div>
          )}
          
          {analytics.patterns.mostProductiveDay && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                📅 Manfaatkan Hari Produktif
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hari {analytics.patterns.mostProductiveDay[0]} adalah hari paling produktif Anda untuk menulis.
              </p>
            </div>
          )}
          
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              ✨ Konsistensi Menulis
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Tulis catatan secara rutin untuk mendapatkan insight yang lebih akurat.
            </p>
          </div>
          
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              🎯 Refleksi Berkala
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Gunakan analisis ini untuk memahami pola emosi dan pertumbuhan personal Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodAnalytics;