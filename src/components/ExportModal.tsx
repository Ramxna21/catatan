import React, { useState } from 'react';
import { X, Download, Filter, Check, AlertCircle } from 'lucide-react';
import { DiaryEntry } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  entries: DiaryEntry[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, entries, onClose }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'csv'>('json');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [includePrivate, setIncludePrivate] = useState(true);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const moods = [
    { value: 'love', label: 'Cinta', emoji: '💕' },
    { value: 'happy', label: 'Bahagia', emoji: '😊' },
    { value: 'sad', label: 'Sedih', emoji: '😢' },
    { value: 'hopeful', label: 'Berharap', emoji: '🌟' },
    { value: 'grateful', label: 'Bersyukur', emoji: '🙏' }
  ];

  const getFilteredEntries = () => {
    let filtered = entries;

    // Filter by privacy
    if (!includePrivate) {
      filtered = filtered.filter(entry => !entry.isPrivate);
    }

    // Filter by mood
    if (selectedMoods.length > 0) {
      filtered = filtered.filter(entry => selectedMoods.includes(entry.mood));
    }

    // Filter by date range
    const now = new Date();
    switch (dateRange) {
      case 'month': {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = filtered.filter(entry => new Date(entry.createdAt) >= monthAgo);
        break;
      }
      case 'year': {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filtered = filtered.filter(entry => new Date(entry.createdAt) >= yearAgo);
        break;
      }
      case 'custom':
        if (customStartDate) {
          filtered = filtered.filter(entry => new Date(entry.createdAt) >= new Date(customStartDate));
        }
        if (customEndDate) {
          filtered = filtered.filter(entry => new Date(entry.createdAt) <= new Date(customEndDate));
        }
        break;
    }

    return filtered;
  };

  const handleMoodToggle = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const filteredEntries = getFilteredEntries();
    return `catatan-hati-${filteredEntries.length}-entries-${date}.${exportFormat}`;
  };

  const exportAsJSON = (entries: DiaryEntry[]) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: entries.length,
      filters: {
        dateRange,
        selectedMoods,
        includePrivate,
        customStartDate,
        customEndDate
      },
      entries: entries.map(entry => ({
        ...entry,
        exportNote: 'Exported from Catatan Hati'
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  const exportAsText = (entries: DiaryEntry[]) => {
    let content = `KENANG - EXPORT DATA\n`;
    content += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n`;
    content += `Total Catatan: ${entries.length}\n`;
    content += `${'='.repeat(50)}\n\n`;

    entries.forEach((entry, index) => {
      content += `${index + 1}. ${entry.title}\n`;
      content += `Tanggal: ${new Date(entry.createdAt).toLocaleDateString('id-ID')}\n`;
      content += `Mood: ${entry.mood} ${moods.find(m => m.value === entry.mood)?.emoji || ''}\n`;
      content += `Status: ${entry.isPrivate ? 'Pribadi' : 'Publik'}\n`;
      if (entry.tags.length > 0) {
        content += `Tags: ${entry.tags.map(tag => `#${tag}`).join(', ')}\n`;
      }
      content += `\nIsi:\n${entry.content}\n`;
      content += `${'-'.repeat(30)}\n\n`;
    });

    return content;
  };

  const exportAsCSV = (entries: DiaryEntry[]) => {
    const headers = ['No', 'Judul', 'Tanggal', 'Mood', 'Status', 'Tags', 'Isi'];
    let csv = headers.join(',') + '\n';

    entries.forEach((entry, index) => {
      const row = [
        index + 1,
        `"${entry.title.replace(/"/g, '""')}"`,
        new Date(entry.createdAt).toLocaleDateString('id-ID'),
        entry.mood,
        entry.isPrivate ? 'Pribadi' : 'Publik',
        `"${entry.tags.map(tag => `#${tag}`).join(', ')}"`,
        `"${entry.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredEntries = getFilteredEntries();
      
      if (filteredEntries.length === 0) {
        alert('Tidak ada catatan yang sesuai dengan filter yang dipilih.');
        setIsExporting(false);
        return;
      }

      let content = '';
      let mimeType = '';

      switch (exportFormat) {
        case 'json':
          content = exportAsJSON(filteredEntries);
          mimeType = 'application/json';
          break;
        case 'txt':
          content = exportAsText(filteredEntries);
          mimeType = 'text/plain';
          break;
        case 'csv':
          content = exportAsCSV(filteredEntries);
          mimeType = 'text/csv';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Terjadi kesalahan saat mengexport data.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredEntries = getFilteredEntries();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      {exportSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <Check className="h-5 w-5 animate-bounce" />
          <span>Export berhasil!</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-pink-500 animate-pulse-soft" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Export Catatan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Format Export
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'json', label: 'JSON', desc: 'Data lengkap dengan metadata', icon: '📄' },
                { value: 'txt', label: 'Text', desc: 'Format teks yang mudah dibaca', icon: '📝' },
                { value: 'csv', label: 'CSV', desc: 'Untuk Excel/spreadsheet', icon: '📊' }
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value as 'json' | 'txt' | 'csv')}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 text-left ${
                    exportFormat === format.value
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{format.icon}</div>
                  <div className="font-semibold text-sm">{format.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {format.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Rentang Waktu
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { value: 'all', label: 'Semua Catatan' },
                { value: 'month', label: 'Bulan Terakhir' },
                { value: 'year', label: 'Tahun Terakhir' },
                { value: 'custom', label: 'Pilih Tanggal' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value as 'all' | 'month' | 'year' | 'custom')}
                  className={`p-3 rounded-lg border transition-all duration-300 hover:scale-105 ${
                    dateRange === range.value
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 animate-slide-up">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mood Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filter Mood (Opsional)
            </h4>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodToggle(mood.value)}
                  className={`px-3 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105 flex items-center space-x-1 ${
                    selectedMoods.includes(mood.value)
                      ? 'bg-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/20'
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
            {selectedMoods.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tidak ada filter mood - semua mood akan disertakan
              </p>
            )}
          </div>

          {/* Privacy Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Pengaturan Privasi
            </h4>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includePrivate}
                onChange={(e) => setIncludePrivate(e.target.checked)}
                className="w-4 h-4 text-pink-500 focus:ring-pink-500 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Sertakan catatan pribadi
              </span>
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Preview Export
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>📊 Total catatan yang akan diexport: <strong>{filteredEntries.length}</strong></p>
              <p>📁 Format: <strong>{exportFormat.toUpperCase()}</strong></p>
              <p>📅 Periode: <strong>
                {dateRange === 'all' ? 'Semua waktu' :
                 dateRange === 'month' ? 'Bulan terakhir' :
                 dateRange === 'year' ? 'Tahun terakhir' :
                 'Custom range'}
              </strong></p>
              {selectedMoods.length > 0 && (
                <p>😊 Mood: <strong>{selectedMoods.join(', ')}</strong></p>
              )}
              <p>🔒 Privasi: <strong>{includePrivate ? 'Termasuk pribadi' : 'Hanya publik'}</strong></p>
            </div>
            
            {filteredEntries.length === 0 && (
              <div className="flex items-center space-x-2 mt-3 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Tidak ada catatan yang sesuai dengan filter</span>
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Batal
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || filteredEntries.length === 0}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Mengexport...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>Export ({filteredEntries.length} catatan)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;