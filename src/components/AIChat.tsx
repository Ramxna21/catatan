import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Heart, Sparkles, Loader, X, Settings, Zap, Brain, Lightbulb, Star, Wand2 } from 'lucide-react';
import { DiaryEntry, User as UserType } from '../types';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  mood?: string;
  isTyping?: boolean;
}

interface AIChatProps {
  entries: DiaryEntry[];
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ entries, user, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<'supportive' | 'creative' | 'analytical'>('supportive');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load saved API key and messages
    const savedApiKey = localStorage.getItem('openrouterApiKey') || '';
    const savedMessages = localStorage.getItem('aiChatMessages');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Welcome message
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: `Halo ${user.name}! 👋 Saya AI assistant untuk Kenang.

Untuk menggunakan AI Chat, Anda perlu mengatur API key terlebih dahulu:

1. Klik ikon Settings (⚙️) di atas
2. Masukkan OpenRouter API key Anda
3. Masukkan API key dan simpan

${apiKey ? `Setelah API key valid diatur, saya siap membantu dengan:
💭 Ide untuk menulis catatan baru
💙 Dukungan emosional dan motivasi  
✨ Analisis pola mood dan saran
📝 Tips menulis yang lebih ekspresif

Apa yang ingin kita bicarakan hari ini?` : `Setelah itu saya siap membantu Anda! 🚀`}`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [user.name, entries.length, apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save messages to localStorage
    localStorage.setItem('aiChatMessages', JSON.stringify(messages));
  }, [messages]);

  const getPersonalityPrompt = () => {
    switch (aiPersonality) {
      case 'supportive':
        return 'Berikan respons yang hangat, mendukung, dan penuh empati. Fokus pada dukungan emosional dan motivasi.';
      case 'creative':
        return 'Berikan respons yang kreatif, inspiratif, dan penuh ide. Bantu dengan brainstorming dan eksplorasi kreatif.';
      case 'analytical':
        return 'Berikan respons yang analitis, objektif, dan berbasis data. Fokus pada pola, insight, dan saran praktis.';
      default:
        return 'Berikan respons yang seimbang antara dukungan emosional dan saran praktis.';
    }
  };

  const generateAIResponse = async (userMessage: string) => {
    if (!apiKey) {
      return 'Maaf, API key belum diatur. Silakan klik ikon Settings (⚙️) untuk mengatur API key Anda terlebih dahulu.';
    }

    try {
      const recentEntries = entries.slice(-5).map(entry => 
        `Tanggal: ${new Date(entry.createdAt).toLocaleDateString('id-ID')}, Mood: ${entry.mood}, Isi: ${entry.content.substring(0, 200)}...`
      ).join('\n');

      const prompt = `${getPersonalityPrompt()}

Konteks pengguna:
- Nama: ${user.name}
- Total catatan: ${entries.length}
- Catatan terbaru:
${recentEntries}

Pesan pengguna: ${userMessage}

Berikan respons dalam bahasa Indonesia yang natural, hangat, dan membantu. Gunakan emoji yang sesuai.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Kenang - Love Diary App'
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5',
          messages: [
            {
              role: 'system',
              content: 'Anda adalah AI assistant yang hangat dan empathetic untuk aplikasi diary bernama Kenang. Berikan respons dalam bahasa Indonesia yang natural dan membantu.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa memberikan respons saat ini.';
    } catch (error) {
      console.error('AI Response Error:', error);
      return `Maaf, terjadi kesalahan saat menghubungi AI: ${error instanceof Error ? error.message : 'Unknown error'}. Silakan coba lagi nanti.`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      type: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      
      // Remove typing indicator and add actual response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.id !== 'typing');
        return [...withoutTyping, {
          id: Date.now().toString(),
          type: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString()
        }];
      });
    } catch (error) {
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.id !== 'typing');
        return [...withoutTyping, {
          id: Date.now().toString(),
          type: 'ai',
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date().toISOString()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('openrouterApiKey', apiKey);
    setShowSettings(false);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: `Halo ${user.name}! 👋 Chat telah dibersihkan. Apa yang ingin kita bicarakan?`,
      timestamp: new Date().toISOString()
    }]);
  };

  const getPersonalityIcon = () => {
    switch (aiPersonality) {
      case 'supportive': return <Heart className="w-4 h-4" />;
      case 'creative': return <Sparkles className="w-4 h-4" />;
      case 'analytical': return <Brain className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              {getPersonalityIcon()}
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs opacity-90 capitalize">{aiPersonality} Mode</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenRouter API Key
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-purple-500 hover:text-purple-600"
                  >
                    (Dapatkan di sini)
                  </a>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Masukkan OpenRouter API key Anda"
                />
                {!apiKey && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    API key diperlukan untuk menggunakan AI Chat
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Personality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'supportive', label: 'Supportive', icon: Heart },
                    { key: 'creative', label: 'Creative', icon: Sparkles },
                    { key: 'analytical', label: 'Analytical', icon: Brain }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setAiPersonality(key as any)}
                      className={`p-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center space-y-1 ${
                        aiPersonality === key
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={saveApiKey}
                  disabled={!apiKey.trim()}
                  className="flex-1 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Simpan
                </button>
                <button
                  onClick={clearChat}
                  className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-200px)]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div className={`p-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  {message.isTyping ? (
                    <div className="flex items-center space-x-1">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Mengetik...</span>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={apiKey ? "Ketik pesan Anda..." : "Atur API key terlebih dahulu"}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              disabled={isLoading || !apiKey}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !apiKey}
              className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;