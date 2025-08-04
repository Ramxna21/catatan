import React, { useState } from 'react';
import { Upload, Download, Shield, AlertTriangle, Check, X, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { DiaryEntry, User } from '../types';

interface BackupProps {
  entries: DiaryEntry[];
  user: User;
  onRestore: (entries: DiaryEntry[]) => void;
}

const Backup: React.FC<BackupProps> = ({ entries, user, onRestore }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<DiaryEntry[] | null>(null);

  const generateBackupData = () => {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      },
      entries: entries.map(entry => ({
        ...entry,
        backupNote: 'Backed up from Kenang'
      })),
      metadata: {
        totalEntries: entries.length,
        privateEntries: entries.filter(e => e.isPrivate).length,
        publicEntries: entries.filter(e => !e.isPrivate).length,
        totalWords: entries.reduce((acc, entry) => acc + entry.content.split(/\s+/).length, 0),
        dateRange: {
          oldest: entries.length > 0 ? entries.reduce((oldest, entry) => 
            new Date(entry.createdAt) < new Date(oldest.createdAt) ? entry : oldest
          ).createdAt : null,
          newest: entries.length > 0 ? entries.reduce((newest, entry) => 
            new Date(entry.createdAt) > new Date(newest.createdAt) ? entry : newest
          ).createdAt : null
        }
      }
    };
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setError('');
    
    try {
      const backupData = generateBackupData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kenang-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (err) {
      setError('Gagal membuat backup. Silakan coba lagi.');
      console.error('Backup error:', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        // Validate backup data structure
        if (!backupData.entries || !Array.isArray(backupData.entries)) {
          throw new Error('Format backup tidak valid');
        }

        // Validate each entry
        const validEntries = backupData.entries.filter((entry: any) => {
          return entry.id && entry.title && entry.content && entry.mood && 
                 typeof entry.isPrivate === 'boolean' && entry.createdAt;
        });

        if (validEntries.length === 0) {
          throw new Error('Tidak ada catatan valid dalam file backup');
        }

        setPendingRestoreData(validEntries);
        setShowRestoreConfirm(true);
        setError('');
      } catch (err) {
        setError('File backup tidak valid atau rusak');
        console.error('Restore error:', err);
      }
    };
    
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const confirmRestore = async () => {
    if (!pendingRestoreData) return;
    
    setIsRestoring(true);
    setShowRestoreConfirm(false);
    
    try {
      // Add unique IDs to avoid conflicts
      const processedEntries = pendingRestoreData.map(entry => ({
        ...entry,
        id: `restored_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        restoredAt: new Date().toISOString()
      }));

      onRestore(processedEntries);
      setRestoreSuccess(true);
      setTimeout(() => setRestoreSuccess(false), 3000);
    } catch (err) {
      setError('Gagal memulihkan data. Silakan coba lagi.');
      console.error('Restore error:', err);
    } finally {
      setIsRestoring(false);
      setPendingRestoreData(null);
    }
  };

  const cancelRestore = () => {
    setShowRestoreConfirm(false);
    setPendingRestoreData(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success/Error Messages */}
      {backupSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <Check className="h-5 w-5" />
          <span>Backup berhasil dibuat!</span>
        </div>
      )}
      
      {restoreSuccess && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <Check className="h-5 w-5" />
          <span>Data berhasil dipulihkan!</span>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Backup & Restore
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Amankan catatan Anda dan pulihkan data jika diperlukan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Backup Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl animate-slide-up">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-full flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Buat Backup
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Unduh semua catatan Anda
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Yang akan di-backup:
                </span>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• {entries.length} catatan hati</li>
                <li>• Semua tag dan metadata</li>
                <li>• Pengaturan privasi</li>
                <li>• Tanggal dan waktu pembuatan</li>
                <li>• Informasi mood dan konten</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Format Backup:
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                File JSON yang dapat dibaca dan dipulihkan kapan saja. 
                Simpan di tempat yang aman seperti cloud storage atau hard drive eksternal.
              </p>
            </div>
          </div>

          <button
            onClick={handleBackup}
            disabled={isBackingUp || entries.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Membuat Backup...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <span>Buat Backup Sekarang</span>
              </>
            )}
          </button>
        </div>

        {/* Restore Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Pulihkan Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Upload file backup untuk memulihkan catatan
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Perhatian:
                </span>
              </div>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Data yang dipulihkan akan ditambahkan ke catatan yang ada</li>
                <li>• Tidak akan menghapus catatan yang sudah ada</li>
                <li>• Pastikan file backup dalam format yang benar</li>
                <li>• Proses ini tidak dapat dibatalkan</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Pilih file backup (.json) untuk dipulihkan
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isRestoring}
                />
                <span className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Pilih File Backup</span>
                </span>
              </label>
            </div>
          </div>

          {isRestoring && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Memulihkan data...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && pendingRestoreData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Konfirmasi Restore
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Anda akan memulihkan <strong>{pendingRestoreData.length} catatan</strong> dari file backup.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Detail Backup:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• {pendingRestoreData.length} catatan akan ditambahkan</li>
                  <li>• {pendingRestoreData.filter(e => e.isPrivate).length} catatan pribadi</li>
                  <li>• {pendingRestoreData.filter(e => !e.isPrivate).length} catatan publik</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Catatan:</strong> Data yang dipulihkan akan ditambahkan ke catatan yang sudah ada. 
                  Tidak ada data yang akan dihapus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={cancelRestore}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={confirmRestore}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Pulihkan Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backup;