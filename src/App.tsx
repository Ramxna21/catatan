import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  Clock,
  Database,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  Smile,
  Sparkles,
  User,
  X
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import ConfirmDialog from './components/ConfirmDialog';
import Dashboard from './components/Dashboard';
import EntryEditor from './components/EntryEditor';
import EntryDetail from './components/EntryDetail';
import DarkModeToggle from './components/DarkModeToggle';
import Statistics from './components/Statistics';
import Backup from './components/Backup';
import MoodAnalytics from './components/MoodAnalytics';
import SmartReminders from './components/SmartReminders';
import MemoryTimeline from './components/MemoryTimeline';
import FutureLetters from './components/FutureLetters';
import AIChat from './components/AIChat';
import { ProfileModal } from './components/ProfileModal';
import { AppView, DiaryEntry, EntrySeed, FutureLetter, User as UserType } from './types';
import { getCurrentUser, logout } from './lib/auth';
import {
  STORAGE_KEYS,
  loadDarkMode,
  loadEntries,
  loadFutureLetters,
  sanitizeEntries,
  saveDarkMode,
  saveEntries,
  saveFutureLetters
} from './lib/storage';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
}

const NAV_ITEMS: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'future-letters', label: 'Surat Masa Depan', icon: Mail },
  { view: 'statistics', label: 'Statistik', icon: BarChart3 },
  { view: 'analytics', label: 'Mood', icon: Smile },
  { view: 'timeline', label: 'Timeline', icon: Clock },
  { view: 'reminders', label: 'Pengingat', icon: Bell },
  { view: 'backup', label: 'Backup', icon: Database }
];

const sortEntries = (items: DiaryEntry[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [booting, setBooting] = useState(true);
  const [darkMode, setDarkMode] = useState(() => loadDarkMode());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [futureLetters, setFutureLetters] = useState<FutureLetter[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [entrySeed, setEntrySeed] = useState<EntrySeed | null>(null);
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const restoredUser = getCurrentUser();
    if (restoredUser) {
      setUser(restoredUser);
      setCurrentView('dashboard');
    }
    setBooting(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    saveDarkMode(darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setFutureLetters([]);
      return;
    }
    setEntries(loadEntries(user.id));
    setFutureLetters(loadFutureLetters(user.id));
  }, [user]);

  // Sinkronisasi antar tab: catatan dan sesi login ikut diperbarui.
  useEffect(() => {
    if (!user) return;
    const entriesKey = STORAGE_KEYS.entries(user.id);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === entriesKey) {
        setEntries(loadEntries(user.id));
      }
      if (event.key === STORAGE_KEYS.session) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        if (!currentUser) {
          setCurrentView('landing');
          setViewingEntry(null);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeUser = user;

  const pushToast = (
    message: string,
    tone: Toast['tone'] = 'success',
    action?: Toast['action']
  ) => {
    setToast({ id: Date.now(), message, tone, action });
  };

  const commitEntries = (nextEntries: DiaryEntry[]) => {
    if (!activeUser) return;
    const sorted = sortEntries(nextEntries);
    setEntries(sorted);
    if (!saveEntries(activeUser.id, sorted)) {
      pushToast('Penyimpanan browser penuh. Backup catatan Anda sekarang.', 'error');
    }
  };

  const closeConfirm = () => setConfirmDialog((previous) => ({ ...previous, isOpen: false }));

  const handleAuthenticated = (nextUser: UserType) => {
    setUser(nextUser);
    setShowAuthModal(false);
    setCurrentView('dashboard');
    pushToast(`Selamat datang, ${nextUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Keluar dari akun?',
      message: 'Catatan Anda tetap tersimpan di perangkat ini dan bisa dibuka lagi saat masuk.',
      onConfirm: () => {
        logout();
        setUser(null);
        setEntries([]);
        setViewingEntry(null);
        setEditingEntry(null);
        setEntrySeed(null);
        setCurrentView('landing');
        setMobileMenuOpen(false);
        closeConfirm();
        pushToast('Anda telah keluar. Sampai jumpa lagi!', 'info');
      },
      type: 'warning'
    });
  };

  const handleSaveEntry = (payload: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    if (!activeUser) return;
    const now = new Date().toISOString();

    if (editingEntry) {
      const updated: DiaryEntry = { ...editingEntry, ...payload, updatedAt: now };
      commitEntries(entries.map((entry) => (entry.id === editingEntry.id ? updated : entry)));
      pushToast('Catatan berhasil diperbarui.', 'success');
    } else {
      const created: DiaryEntry = {
        ...payload,
        id:
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      commitEntries([created, ...entries]);
      pushToast('Catatan baru berhasil disimpan.', 'success');
    }

    setEditingEntry(null);
    setEntrySeed(null);
    setViewingEntry(null);
    setCurrentView('dashboard');
  };

  const handleRestoreData = (restoredEntries: DiaryEntry[]) => {
    const sanitized = sanitizeEntries(restoredEntries);
    const existingIds = new Set(entries.map((entry) => entry.id));
    const fresh = sanitized.filter((entry) => !existingIds.has(entry.id));
    commitEntries([...fresh, ...entries]);
    pushToast(`${fresh.length} catatan berhasil dipulihkan.`, 'success');
  };

  const handleDeleteEntry = (id: string) => {
    const entryToDelete = entries.find((entry) => entry.id === id);
    if (!entryToDelete) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus catatan?',
      message: `Catatan "${entryToDelete.title}" akan dihapus. Anda masih bisa mengurungkannya sesaat setelah ini.`,
      onConfirm: () => {
        const remaining = entries.filter((entry) => entry.id !== id);
        commitEntries(remaining);
        setViewingEntry(null);
        closeConfirm();
        pushToast(`"${entryToDelete.title}" dihapus.`, 'info', {
          label: 'Urungkan',
          onClick: () => {
            commitEntries([entryToDelete, ...remaining]);
            setToast(null);
            pushToast('Catatan berhasil dikembalikan.', 'success');
          }
        });
      },
      type: 'danger'
    });
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setEntrySeed(null);
    setViewingEntry(null);
    setCurrentView('editor');
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setEntrySeed(null);
    setViewingEntry(null);
    setCurrentView('editor');
  };

  const handleUseIdea = (idea: EntrySeed) => {
    setEditingEntry(null);
    setViewingEntry(null);
    setEntrySeed({
      ...idea,
      id: idea.id || `seed_${Date.now()}`
    });
    setShowAIChat(false);
    setCurrentView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveFutureLetters = (updated: FutureLetter[]) => {
    if (!user) return;
    setFutureLetters(updated);
    saveFutureLetters(user.id, updated);
  };

  const handleConvertLetterToEntry = (letter: FutureLetter) => {
    if (!user) return;
    const newEntry: DiaryEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: `[Dari Masa Lalu] ${letter.title}`,
      content: letter.content,
      mood: letter.mood,
      isPrivate: true,
      tags: Array.from(new Set([...letter.tags, 'surat-masa-lalu'])),
      createdAt: new Date().toISOString()
    };
    const nextEntries = [newEntry, ...entries];
    commitEntries(nextEntries);
    pushToast('Surat masa lalu berhasil disimpan ke Catatan Harian!', 'success');
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (view !== 'editor') {
      setEditingEntry(null);
      setEntrySeed(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  }, []);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <Heart className="h-12 w-12 fill-current text-pink-500 animate-pulse-soft" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Menyiapkan kenangan Anda...</p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LandingPage
          onLogin={() => setShowAuthModal(true)}
          onDarkModeToggle={() => setDarkMode((value) => !value)}
          darkMode={darkMode}
        />
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} onAuthenticated={handleAuthenticated} />
        )}
        <ToastView toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950">
        <header className="sticky top-0 z-40 border-b border-pink-200/70 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80 animate-slide-down">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('dashboard')}
                className="flex shrink-0 items-center gap-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <Heart className="h-7 w-7 fill-current text-pink-500 animate-pulse-soft" />
                <span className="text-left">
                  <span className="block text-lg font-bold leading-tight text-gray-900 dark:text-white">
                    Kenang
                  </span>
                  <span className="hidden text-[10px] font-medium uppercase tracking-wider text-pink-500 sm:block">
                    Catatan Hati
                  </span>
                </span>
              </button>

              <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Navigasi utama">
                {NAV_ITEMS.map((item) => {
                  const active = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      onClick={() => handleNavigate(item.view)}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                        active
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode((value) => !value)} />

                <button
                  type="button"
                  onClick={() => setShowAIChat(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 px-2.5 py-2 text-sm font-medium text-purple-700 transition hover:from-purple-200 hover:to-pink-200 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-purple-700 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-300 sm:px-3.5"
                  title="Chat dengan AI Assistant"
                  aria-label="AI Chat"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Chat</span>
                </button>

                <button
                  type="button"
                  onClick={handleNewEntry}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 active:scale-95 sm:px-4"
                  title="Tulis catatan baru"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tulis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white/70 py-1 pl-1 pr-3 shadow-xs transition hover:border-pink-300 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-pink-700 dark:hover:bg-gray-800 sm:flex group"
                  title="Klik untuk ganti avatar & profil"
                >
                  {activeUser.avatar ? (
                    <img
                      src={activeUser.avatar}
                      alt={activeUser.name}
                      className="h-7 w-7 rounded-full border border-pink-200 object-cover shadow-xs dark:border-pink-700 group-hover:scale-105 transition"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 text-white shadow-xs group-hover:scale-105 transition">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                  <span className="max-w-[110px] truncate text-sm font-semibold text-gray-700 group-hover:text-pink-600 dark:text-gray-200 dark:group-hover:text-pink-400 transition">
                    {activeUser.name}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-full p-2 text-gray-600 transition hover:bg-pink-100 hover:text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-300 dark:hover:bg-gray-800 sm:inline-flex"
                  title="Keluar"
                  aria-label="Keluar dari akun"
                >
                  <LogOut className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-300 dark:hover:bg-gray-800 xl:hidden"
                  aria-label="Buka menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 shadow-lg dark:border-gray-700 dark:bg-gray-900 xl:hidden animate-slide-down">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(true);
                  setMobileMenuOpen(false);
                }}
                className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-3 text-left transition hover:from-pink-100 hover:to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-100/80 dark:border-pink-900/40"
              >
                {activeUser.avatar ? (
                  <img
                    src={activeUser.avatar}
                    alt={activeUser.name}
                    className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-xs dark:border-gray-700"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 text-white shadow-xs">
                    <User className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {greeting}, {activeUser.name}
                    </p>
                    <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400">Ganti Avatar ✏️</span>
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{activeUser.email}</p>
                </div>
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      onClick={() => handleNavigate(item.view)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setShowAIChat(true);
                    setMobileMenuOpen(false);
                  }}
                  className="col-span-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2.5 text-sm font-medium text-purple-700 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-300"
                >
                  <MessageCircle className="h-4 w-4" />
                  AI Chat Assistant
                </button>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 sm:hidden"
              >
                <LogOut className="h-4 w-4" />
                Keluar dari akun
              </button>
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {currentView === 'dashboard' && (
            <Dashboard
              entries={entries}
              userName={activeUser.name}
              avatar={activeUser.avatar}
              onEditProfile={() => setShowProfileModal(true)}
              onNewEntry={handleNewEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onViewEntry={setViewingEntry}
            />
          )}

          {currentView === 'future-letters' && (
            <FutureLetters
              user={activeUser}
              letters={futureLetters}
              onSaveLetters={handleSaveFutureLetters}
              onConvertToDiaryEntry={handleConvertLetterToEntry}
            />
          )}

          {currentView === 'statistics' && <Statistics entries={entries} key={entries.length} />}

          {currentView === 'backup' && (
            <Backup entries={entries} user={activeUser} onRestore={handleRestoreData} />
          )}

          {currentView === 'analytics' && <MoodAnalytics entries={entries} />}

          {currentView === 'reminders' && <SmartReminders entries={entries} />}

          {currentView === 'timeline' && <MemoryTimeline entries={entries} />}

          {currentView === 'editor' && (
            <EntryEditor
              key={editingEntry?.id ?? entrySeed?.id ?? 'new-entry'}
              entry={editingEntry}
              seed={entrySeed}
              entries={entries}
              userId={activeUser.id}
              onSave={handleSaveEntry}
              onCancel={() => {
                setEditingEntry(null);
                setEntrySeed(null);
                setCurrentView('dashboard');
              }}
            />
          )}
        </main>

        <footer className="border-t border-pink-200/60 bg-white/40 py-5 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4 fill-current text-pink-500" />
              Kenang — tempat setiap rasa punya rumah.
            </span>
            <span>Data tersimpan lokal di browser ini • v2.0</span>
          </div>
        </footer>
      </div>

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
          type={confirmDialog.type}
          confirmText={confirmDialog.type === 'danger' ? 'Hapus' : 'Ya, keluar'}
        />
      )}

      {viewingEntry && (
        <EntryDetail
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
        />
      )}

      {showAIChat && (
        <AIChat
          entries={entries}
          user={activeUser}
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          onUseIdea={handleUseIdea}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          user={activeUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={(updated) => {
            setUser(updated);
            pushToast('Profil dan avatar berhasil diperbarui! ✨', 'success');
          }}
        />
      )}

      <ToastView toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const ToastView = ({ toast, onClose }: { toast: Toast | null; onClose: () => void }) => {
  if (!toast) return null;

  const toneClasses: Record<Toast['tone'], string> = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-slate-800'
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4 sm:justify-end sm:pr-6">
      <div
        role="status"
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-2xl animate-slide-down ${toneClasses[toast.tone]}`}
      >
        <span className="flex-1">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="shrink-0 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold transition hover:bg-white/30"
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1 transition hover:bg-white/20"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default App;
