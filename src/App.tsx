import React, { useState, useEffect } from 'react';
import { Heart, Moon, Sun, Plus, Calendar, Lock, Globe, Edit, Trash2, User, LogOut, MessageCircle } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import ConfirmDialog from './components/ConfirmDialog';
import Dashboard from './components/Dashboard';
import EntryEditor from './components/EntryEditor';
import DarkModeToggle from './components/DarkModeToggle';
import Statistics from './components/Statistics';
import Backup from './components/Backup';
import MoodAnalytics from './components/MoodAnalytics';
import SmartReminders from './components/SmartReminders';
import MemoryTimeline from './components/MemoryTimeline';
import AIChat from './components/AIChat';
import { DiaryEntry, User as UserType } from './types';

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'landing' | 'statistics' | 'backup' | 'analytics' | 'reminders' | 'timeline'>('landing');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
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
    const savedUser = localStorage.getItem('catatanHatiUser');
    const savedDarkMode = localStorage.getItem('catatanHatiDarkMode');
    const savedEntries = localStorage.getItem('catatanHatiEntries');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('catatanHatiDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogin = (email: string, password: string) => {
    const newUser: UserType = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      provider: 'email',
      createdAt: new Date().toISOString()
    };
    
    setUser(newUser);
    localStorage.setItem('catatanHatiUser', JSON.stringify(newUser));
    setShowAuthModal(false);
    setCurrentView('dashboard');
  };

  const handleGoogleLogin = (googleUser: UserType) => {
    setUser(googleUser);
    localStorage.setItem('catatanHatiUser', JSON.stringify(googleUser));
    setShowAuthModal(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Logout',
      message: 'Apakah Anda yakin ingin keluar dari akun?',
      onConfirm: () => {
        setUser(null);
        localStorage.removeItem('catatanHatiUser');
        setCurrentView('landing');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      type: 'warning'
    });
  };

  const handleSaveEntry = (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: editingEntry?.id || Date.now().toString(),
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedEntries;
    if (editingEntry) {
      updatedEntries = entries.map(e => e.id === editingEntry.id ? newEntry : e);
    } else {
      updatedEntries = [newEntry, ...entries];
    }

    setEntries(updatedEntries);
    localStorage.setItem('catatanHatiEntries', JSON.stringify(updatedEntries));
    setCurrentView('dashboard');
    setEditingEntry(null);
  };

  const handleRestoreData = (restoredEntries: DiaryEntry[]) => {
    const updatedEntries = [...entries, ...restoredEntries];
    setEntries(updatedEntries);
    localStorage.setItem('catatanHatiEntries', JSON.stringify(updatedEntries));
  };

  const handleDeleteEntry = (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Catatan',
      message: `Apakah Anda yakin ingin menghapus catatan "${entryToDelete?.title}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        const updatedEntries = entries.filter(e => e.id !== id);
        setEntries(updatedEntries);
        localStorage.setItem('catatanHatiEntries', JSON.stringify(updatedEntries));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      type: 'danger'
    });
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setCurrentView('editor');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!user && currentView === 'landing') {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LandingPage 
          onLogin={() => setShowAuthModal(true)}
          onDarkModeToggle={toggleDarkMode}
          darkMode={darkMode}
        />
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)}
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
          />
        )}
        {confirmDialog.isOpen && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            type={confirmDialog.type}
            confirmText={confirmDialog.type === 'danger' ? 'Hapus' : 'Ya'}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-pink-200 dark:border-gray-700 sticky top-0 z-50 animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <Heart className="h-8 w-8 text-pink-500 fill-current animate-pulse-soft" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Catatan Hati
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
                
                <nav className="hidden md:flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      currentView === 'dashboard'
                        ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('statistics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      currentView === 'statistics'
                        ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Statistik
                  </button>
                  <button
                    onClick={() => setCurrentView('backup')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      currentView === 'backup'
                        ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Backup
                  </button>
                  
                  {/* AI Chat Button - Enhanced dengan clue yang jelas */}
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50 border border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md group overflow-hidden"
                    title="Chat dengan AI Assistant - Teman curhat dan writing coach yang cerdas"
                  >
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200/0 to-pink-200/0 group-hover:from-purple-200/50 group-hover:to-pink-200/50 transition-all duration-300"></div>
                    
                    <div className="relative z-10 flex items-center space-x-2">
                      {/* Chat icon dengan animasi */}
                      <div className="relative">
                        <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        {/* Notification dot */}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                      </div>
                      
                      <span className="font-medium">AI Chat</span>
                      
                      {/* Sparkle effect */}
                      <div className="relative">
                        <span className="text-xs opacity-75">✨</span>
                        <div className="absolute inset-0 animate-ping opacity-30">✨</div>
                      </div>
                    </div>
                    
                    {/* Hover tooltip enhancement */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg">
                      🤖 Teman curhat AI yang cerdas
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                    </div>
                  </button>
                </nav>
                
                {/* Mobile AI Chat Button - Compact version */}
                <div className="md:hidden">
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="relative p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 group border border-purple-400"
                    title="AI Chat"
                  >
                    {/* Mobile button glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/50 to-pink-400/50 rounded-full animate-pulse group-hover:animate-none"></div>
                    
                    <div className="relative z-10">
                      <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border border-white rounded-full animate-pulse"></div>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="h-8 w-8 rounded-full border-2 border-pink-200 dark:border-pink-700 hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {user?.name}
                  </span>
                  {user?.provider === 'google' && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <svg className="h-3 w-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Google</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-pink-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {currentView === 'dashboard' && (
            <Dashboard
              entries={entries}
              onNewEntry={() => {
                setEditingEntry(null);
                setCurrentView('editor');
              }}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          )}
          
          {currentView === 'statistics' && (
            <Statistics entries={entries} key={entries.length} />
          )}
          
          {currentView === 'backup' && user && (
            <Backup 
              entries={entries} 
              user={user}
              onRestore={handleRestoreData}
            />
          )}
          
          {currentView === 'analytics' && (
            <MoodAnalytics entries={entries} />
          )}
          
          {currentView === 'reminders' && (
            <SmartReminders entries={entries} />
          )}
          
          {currentView === 'timeline' && (
            <MemoryTimeline entries={entries} />
          )}
          
          {currentView === 'editor' && (
            <EntryEditor
              entry={editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => {
                setCurrentView('dashboard');
                setEditingEntry(null);
              }}
            />
          )}
        </main>
        
        {confirmDialog.isOpen && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            type={confirmDialog.type}
            confirmText={confirmDialog.type === 'danger' ? 'Hapus' : 'Ya'}
          />
        )}
      </div>
      
      {/* AI Chat Modal */}
      {showAIChat && user && (
        <AIChat
          entries={entries}
          user={user}
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </div>
  );
}

export default App;