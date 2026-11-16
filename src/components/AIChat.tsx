import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Brain,
  Heart,
  Lightbulb,
  Loader,
  PenLine,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react';
import { DiaryEntry, User as UserType } from '../types';
import {
  ChatIdea,
  getQuickChips,
  getWelcomeReply
} from '../lib/assistant';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  chips?: string[];
  ideas?: ChatIdea[];
}

interface AIChatProps {
  entries: DiaryEntry[];
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUseIdea: (idea: ChatIdea) => void;
}

type Personality = 'supportive' | 'creative' | 'analytical';

interface ChatSettings {
  personality: Personality;
}

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const FALLBACK_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const ENV_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  supportive:
    'Berikan respons yang hangat, mendukung, dan penuh empati. Fokus pada dukungan emosional dan motivasi.',
  creative:
    'Berikan respons yang kreatif, inspiratif, dan penuh ide. Bantu dengan brainstorming dan eksplorasi kreatif.',
  analytical:
    'Berikan respons yang analitis, objektif, dan berbasis data. Fokus pada pola, insight, dan saran praktis.'
};

const AIChat: React.FC<AIChatProps> = ({ entries, user, isOpen, onClose, onUseIdea }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<Personality>('supportive');
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Muat pengaturan & riwayat per akun.
  useEffect(() => {
    const settingsKey = `kenang.aiSettings.v2:${user.id}`;
    const messagesKey = `kenang.aiMessages.v2:${user.id}`;

    let savedPersonality: Personality = 'supportive';

    const rawSettings = localStorage.getItem(settingsKey);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings) as Partial<ChatSettings>;
        if (
          parsed.personality === 'supportive' ||
          parsed.personality === 'creative' ||
          parsed.personality === 'analytical'
        ) {
          savedPersonality = parsed.personality;
        }
      } catch {
        // abaikan pengaturan rusak
      }
    }

    setAiPersonality(savedPersonality);

    const rawMessages = localStorage.getItem(messagesKey);
    if (rawMessages) {
      try {
        const parsed = JSON.parse(rawMessages) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setHydrated(true);
          return;
        }
      } catch {
        // lanjut ke pesan sambutan
      }
    }

    const welcome = getWelcomeReply(user, entries);
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: welcome.content,
        timestamp: new Date().toISOString(),
        chips: welcome.chips
      }
    ]);
    setHydrated(true);
    // entries sengaja tidak menjadi dependency agar sambutan tidak direset tiap catatan berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(`kenang.aiMessages.v2:${user.id}`, JSON.stringify(messages));
  }, [messages, user.id, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const settings: ChatSettings = { personality: aiPersonality };
    localStorage.setItem(`kenang.aiSettings.v2:${user.id}`, JSON.stringify(settings));
  }, [aiPersonality, user.id, hydrated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const quickChips = useMemo(() => getQuickChips(), []);

  const generateOnlineResponse = async (history: Message[]) => {
    const activeKey = ENV_API_KEY;
    if (!activeKey) {
      return 'API key Gemini belum dikonfigurasi. Tambahkan VITE_GEMINI_API_KEY di file .env untuk mengaktifkan asisten AI.';
    }

    try {
      const recentEntries = entries
        .slice(0, 5)
        .map(
          (entry) =>
            `Tanggal: ${new Date(entry.createdAt).toLocaleDateString('id-ID')}, Mood: ${entry.mood}, Judul: ${entry.title}, Isi: ${entry.content.substring(0, 200)}`
        )
        .join('\n');

      const systemPrompt = [
        'Anda adalah asisten diary bernama Kenang yang hangat, empatik, dan membantu.',
        PERSONALITY_PROMPTS[aiPersonality],
        'Anda bisa mengobrol, memberi dukungan emosional, membantu mencari ide menulis, serta menyarankan judul dan tag.',
        'Selalu gunakan bahasa Indonesia yang natural. Jangan menghakimi. Jika pengguna membutuhkan bantuan profesional, sarankan dengan lembut.',
        `Konteks pengguna: nama ${user.name}, total ${entries.length} catatan.`,
        recentEntries ? `Catatan terbaru:\n${recentEntries}` : 'Pengguna belum punya catatan.'
      ].join('\n');

      // Gemini memakai role "user" dan "model", serta field "parts".
      const conversation = history
        .filter((message) => !message.isTyping && message.id !== 'welcome' && message.content.trim())
        .slice(-10)
        .map((message) => ({
          role: message.type === 'user' ? 'user' : 'model',
          parts: [{ text: message.content }]
        }));

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: conversation,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200
        }
      };

      const sendRequest = (targetModel: string) =>
        fetch(
          `${GEMINI_ENDPOINT}/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(activeKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': activeKey
            },
            body: JSON.stringify(payload)
          }
        );

      let response = await sendRequest(DEFAULT_GEMINI_MODEL);

      // Otomatis fallback bertingkat jika model 404
      if (response.status === 404) {
        for (const fbModel of FALLBACK_GEMINI_MODELS) {
          const fallback = await sendRequest(fbModel);
          if (fallback.ok) {
            response = fallback;
            break;
          }
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        throw new Error(
          `API Error: ${response.status} - ${data.error?.message || 'Unknown error'}`
        );
      }

      const candidate = data.candidates?.[0];
      const text = Array.isArray(candidate?.content?.parts)
        ? candidate.content.parts
            .map((part: { text?: string }) => part.text)
            .filter(Boolean)
            .join('\n')
        : '';

      if (!text) {
        if (candidate?.finishReason === 'SAFETY') {
          return 'Maaf, respons ini terhalang oleh filter keamanan Gemini. Coba tulis dengan cara lain, ya.';
        }
        return 'Maaf, Gemini tidak mengembalikan jawaban. Coba lagi sebentar lagi.';
      }

      return text;
    } catch (error) {
      console.error('Gemini Response Error:', error);
      return `Maaf, terjadi kesalahan saat menghubungi Gemini: ${
        error instanceof Error ? error.message : 'Unknown error'
      }. Periksa koneksi internet atau konfigurasi API key di file .env Anda.`;
    }
  };

  const handleSendMessage = async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? inputMessage).trim();
    if (!prompt || isLoading) return;

    const userMessage: Message = {
      id: makeId(),
      type: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    const historyForApi = [...messages, userMessage];
    setMessages((previous) => [...previous, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const typingMessage: Message = {
      id: 'typing',
      type: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true
    };
    setMessages((previous) => [...previous, typingMessage]);

    try {
      const content = await generateOnlineResponse(historyForApi);
      const reply: { content: string; chips?: string[]; ideas?: ChatIdea[] } = {
        content,
        chips: ['Beri aku ide menulis', 'Ringkas pola catatanku']
      };

      setMessages((previous) => {
        const withoutTyping = previous.filter((message) => message.id !== 'typing');
        return [
          ...withoutTyping,
          {
            id: makeId(),
            type: 'ai',
            content: reply.content,
            timestamp: new Date().toISOString(),
            chips: reply.chips,
            ideas: reply.ideas
          }
        ];
      });
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((previous) => {
        const withoutTyping = previous.filter((message) => message.id !== 'typing');
        return [
          ...withoutTyping,
          {
            id: makeId(),
            type: 'ai',
            content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
            timestamp: new Date().toISOString()
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const saveSettings = () => {
    setShowSettings(false);
  };

  const clearChat = () => {
    const welcome = getWelcomeReply(user, entries);
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: welcome.content,
        timestamp: new Date().toISOString(),
        chips: welcome.chips
      }
    ]);
  };

  const personalityIcon = () => {
    switch (aiPersonality) {
      case 'supportive':
        return <Heart className="h-4 w-4" />;
      case 'creative':
        return <Sparkles className="h-4 w-4" />;
      case 'analytical':
        return <Brain className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-white/20 p-2">{personalityIcon()}</div>
            <div>
              <h3 className="font-semibold">Asisten Kenang</h3>
              <p className="flex items-center gap-1.5 text-xs opacity-90">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Gemini 3.8 Flash</span> •
                <span className="capitalize"> {aiPersonality}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              className="rounded-full p-2 transition-colors hover:bg-white/20"
              aria-label="Pengaturan asisten"
              aria-expanded={showSettings}
              title="Pengaturan Asisten"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-white/20"
              aria-label="Tutup asisten"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50/70 p-3 dark:border-purple-900/50 dark:bg-purple-900/20">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                    Model AI
                  </span>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Google Gemini 3.8 Flash
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Default Aktif
                </span>
              </div>

              {!ENV_API_KEY && (
                <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  API key belum terpasang di file <code>.env</code> (<code>VITE_GEMINI_API_KEY</code>).
                </p>
              )}

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Gaya Bicara
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'supportive', label: 'Suportif', icon: Heart },
                    { key: 'creative', label: 'Kreatif', icon: Sparkles },
                    { key: 'analytical', label: 'Analitis', icon: Brain }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAiPersonality(key as Personality)}
                      aria-pressed={aiPersonality === key}
                      className={`flex flex-col items-center space-y-1 rounded-lg p-2 text-xs font-medium transition-colors ${
                        aiPersonality === key
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={saveSettings}
                  className="flex-1 rounded-lg bg-purple-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[85%] items-start space-x-2 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`rounded-full p-2 ${
                    message.type === 'user' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div className="space-y-2">
                  <div
                    className={`rounded-2xl p-3 ${
                      message.type === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center space-x-1">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Mengetik...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>

                  {message.ideas && message.ideas.length > 0 && (
                    <div className="space-y-2">
                      {message.ideas.map((idea) => (
                        <div
                          key={idea.id}
                          className="rounded-xl border border-purple-200 bg-white p-3 shadow-sm dark:border-purple-800 dark:bg-gray-800"
                        >
                          <div className="flex items-start gap-2">
                            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {idea.title}
                              </p>
                              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-gray-500 dark:text-gray-400">
                                {idea.content}
                              </p>
                              <button
                                type="button"
                                onClick={() => onUseIdea(idea)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-purple-600 hover:to-pink-600"
                              >
                                <PenLine className="h-3.5 w-3.5" />
                                Tulis catatan ini
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.chips && message.chips.length > 0 && !isLoading && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.chips.map((chip) => (
                        <button
                          key={`${message.id}-${chip}`}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-gray-100 px-4 pt-3 dark:border-gray-800">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-purple-300 hover:text-purple-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesanmu, atau ceritakan harimu..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              disabled={isLoading}
              aria-label="Pesan untuk asisten"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="rounded-full bg-purple-500 p-2 text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Kirim pesan"
            >
              {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Asisten bisa salah. Untuk keputusan penting, tetap dengarkan dirimu sendiri. 💙
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
