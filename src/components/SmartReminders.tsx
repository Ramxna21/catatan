import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Plus, X, Check, AlertCircle } from 'lucide-react';
import { DiaryEntry } from '../types';

interface Reminder {
  id: string;
  title: string;
  message: string;
  time: string;
  days: string[];
  isActive: boolean;
  type: 'daily' | 'weekly' | 'custom';
  createdAt: string;
}

interface SmartRemindersProps {
  entries: DiaryEntry[];
}

const SmartReminders: React.FC<SmartRemindersProps> = ({ entries }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    message: '',
    time: '20:00',
    days: [] as string[],
    type: 'daily' as 'daily' | 'weekly' | 'custom'
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const dayOptions = [
    { value: 'monday', label: 'Senin', short: 'Sen' },
    { value: 'tuesday', label: 'Selasa', short: 'Sel' },
    { value: 'wednesday', label: 'Rabu', short: 'Rab' },
    { value: 'thursday', label: 'Kamis', short: 'Kam' },
    { value: 'friday', label: 'Jumat', short: 'Jum' },
    { value: 'saturday', label: 'Sabtu', short: 'Sab' },
    { value: 'sunday', label: 'Minggu', short: 'Min' }
  ];

  const reminderTemplates = [
    {
      title: 'Refleksi Harian',
      message: 'Waktunya merenungkan hari ini dan menulis kenangan 💕',
      time: '21:00',
      type: 'daily' as const,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    {
      title: 'Gratitude Journal',
      message: 'Tuliskan 3 hal yang Anda syukuri hari ini 🙏',
      time: '19:00',
      type: 'daily' as const,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    {
      title: 'Weekend Reflection',
      message: 'Saatnya merefleksikan minggu yang telah berlalu ✨',
      time: '10:00',
      type: 'weekly' as const,
      days: ['sunday']
    },
    {
      title: 'Love Note',
      message: 'Tulis catatan cinta untuk orang tersayang 💕',
      time: '20:30',
      type: 'weekly' as const,
      days: ['friday', 'saturday']
    }
  ];

  useEffect(() => {
    // Load reminders from localStorage
    const savedReminders = localStorage.getItem('catatanHatiReminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Generate smart suggestions based on user patterns
    generateSmartSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  useEffect(() => {
    // Save reminders to localStorage
    localStorage.setItem('catatanHatiReminders', JSON.stringify(reminders));
    
    // Schedule notifications
    scheduleNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  const generateSmartSuggestions = () => {
    if (entries.length === 0) return;

    // Analyze writing patterns
    const writingTimes = entries.map(entry => {
      const date = new Date(entry.createdAt);
      return date.getHours();
    });

    const averageWritingTime = writingTimes.reduce((sum, time) => sum + time, 0) / writingTimes.length;
    const suggestedTime = `${Math.floor(averageWritingTime).toString().padStart(2, '0')}:00`;

    // Analyze writing frequency
    const dayFrequency = entries.reduce((acc, entry) => {
      const day = new Date(entry.createdAt).getDay();
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDays = Object.entries(dayFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    // Create smart suggestion if no reminders exist
    const savedReminders = localStorage.getItem('catatanHatiReminders');
    if (!savedReminders || JSON.parse(savedReminders).length === 0) {
      const smartReminder: Reminder = {
        id: 'smart-suggestion',
        title: 'Reminder Personal',
        message: `Berdasarkan pola menulis Anda, ini waktu yang tepat untuk refleksi 💭`,
        time: suggestedTime,
        days: mostActiveDays,
        isActive: false,
        type: 'custom',
        createdAt: new Date().toISOString()
      };

      setReminders([smartReminder]);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  const scheduleNotifications = () => {
    // Clear existing timeouts (in a real app, you'd use a more sophisticated scheduling system)
    reminders.forEach(reminder => {
      if (reminder.isActive) {
        scheduleReminderNotification(reminder);
      }
    });
  };

  const scheduleReminderNotification = (reminder: Reminder) => {
    if (notificationPermission !== 'granted') return;

    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    reminder.days.forEach(day => {
      const dayIndex = dayOptions.findIndex(d => d.value === day);
      const targetDate = new Date();
      
      // Calculate next occurrence of this day
      const daysUntilTarget = (dayIndex - now.getDay() + 7) % 7;
      targetDate.setDate(now.getDate() + daysUntilTarget);
      targetDate.setHours(hours, minutes, 0, 0);
      
      // If the time has passed today, schedule for next week
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      
      const timeUntilNotification = targetDate.getTime() - now.getTime();
      
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(reminder.title, {
            body: reminder.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: reminder.id
          });
        }
      }, timeUntilNotification);
    });
  };

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.message || newReminder.days.length === 0) {
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      message: newReminder.message,
      time: newReminder.time,
      days: newReminder.days,
      isActive: true,
      type: newReminder.type,
      createdAt: new Date().toISOString()
    };

    setReminders([...reminders, reminder]);
    setNewReminder({
      title: '',
      message: '',
      time: '20:00',
      days: [],
      type: 'daily'
    });
    setShowAddForm(false);
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(reminder =>
      reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder
    ));
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(reminder => reminder.id !== id));
  };

  const applyTemplate = (template: typeof reminderTemplates[0]) => {
    setNewReminder({
      title: template.title,
      message: template.message,
      time: template.time,
      days: template.days,
      type: template.type
    });
    setShowAddForm(true);
  };

  const toggleDay = (day: string) => {
    setNewReminder(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Setiap hari';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Hari kerja';
    }
    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekend';
    }
    return days.map(day => dayOptions.find(d => d.value === day)?.short).join(', ');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pengingat Cerdas
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Pengingat cerdas untuk membantu konsistensi menulis catatan hati
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Tambah Reminder</span>
        </button>
      </div>

      {/* Notification Permission */}
      {notificationPermission !== 'granted' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
              Izin Notifikasi Diperlukan
            </h3>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            Untuk mendapatkan pengingat, aplikasi memerlukan izin untuk mengirim notifikasi.
          </p>
          <button
            onClick={requestNotificationPermission}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Berikan Izin Notifikasi
          </button>
        </div>
      )}

      {/* Quick Templates */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Template Reminder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminderTemplates.map((template, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => applyTemplate(template)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
                  {template.title}
                </h4>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {template.time}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {template.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                  {formatDays(template.days)}
                </span>
                <Plus className="h-4 w-4 text-pink-500 group-hover:rotate-90 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Reminders */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Reminder Aktif ({reminders.filter(r => r.isActive).length})
        </h3>
        
        {reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Belum ada reminder
            </h4>
            <p className="text-gray-400 dark:text-gray-500">
              Tambahkan reminder untuk membantu konsistensi menulis
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder, index) => (
              <div
                key={reminder.id}
                className={`border rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${
                  reminder.isActive
                    ? 'border-pink-200 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                } animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className={`font-semibold ${
                        reminder.isActive 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {reminder.title}
                      </h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{reminder.time}</span>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-3 ${
                      reminder.isActive 
                        ? 'text-gray-600 dark:text-gray-300' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {reminder.message}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDays(reminder.days)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                        reminder.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}
                      title={reminder.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {reminder.isActive ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all duration-300 hover:scale-110 active:scale-95"
                      title="Hapus reminder"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tambah Reminder Baru
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Judul Reminder
                </label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Contoh: Refleksi Harian"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pesan Reminder
                </label>
                <textarea
                  value={newReminder.message}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Pesan yang akan ditampilkan saat reminder muncul"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Waktu
                </label>
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hari ({newReminder.days.length} dipilih)
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                        newReminder.days.includes(day.value)
                          ? 'bg-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/20'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddReminder}
                  disabled={!newReminder.title || !newReminder.message || newReminder.days.length === 0}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Simpan Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartReminders;