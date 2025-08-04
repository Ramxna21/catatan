import React, { useState, useEffect } from 'react';
import { Save, X, Heart, Lock, Globe, Tag, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { DiaryEntry } from '../types';
import ShareModal from './ShareModal';

interface EntryEditorProps {
  entry: DiaryEntry | null;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const EntryEditor: React.FC<EntryEditorProps> = ({ entry, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DiaryEntry['mood']>('love');
  const [isPrivate, setIsPrivate] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Common tags for suggestions
  const commonTags = [
    'romantis', 'kenangan', 'anniversary', 'special', 'first-date', 'valentine',
    'birthday', 'surprise', 'sweet', 'cute', 'funny', 'sad', 'happy',
    'grateful', 'hopeful', 'dream', 'future', 'past', 'present'
  ];

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setIsPrivate(entry.isPrivate);
      setTags(entry.tags);
    } else {
      setTitle('');
      setContent('');
      setMood('love');
      setIsPrivate(true);
      setTags([]);
    }
    
    // Load existing tags from localStorage for autocomplete
    const savedEntries = localStorage.getItem('catatanHatiEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      const allTags = entries.flatMap((entry: DiaryEntry) => entry.tags);
      const uniqueTags = Array.from(new Set([...allTags, ...commonTags]));
      setAvailableTags(uniqueTags);
    } else {
      setAvailableTags(commonTags);
    }
  }, [entry]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Judul wajib diisi';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Isi catatan wajib diisi';
    }
    
    if (tags.length > 5) {
      newErrors.tags = 'Maksimal 5 tag diperbolehkan';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        title: title.trim(),
        content: content.trim(),
        mood,
        isPrivate,
        tags
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setTimeout(() => onCancel(), 1000);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (selectedSuggestionIndex >= 0 && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        addTag(tagInput.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      
      // Clear tag error if it exists
      if (errors.tags) {
        setErrors(prev => ({ ...prev, tags: '' }));
      }
    }
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    
    if (value.trim()) {
      const filtered = availableTags.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) && 
        !tags.includes(tag)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    
    // Clear tag error if removing tags
    if (errors.tags && tags.length <= 5) {
      setErrors(prev => ({ ...prev, tags: '' }));
    }
  };

  const getMoodEmoji = (moodValue: string) => {
    switch (moodValue) {
      case 'love': return '💕';
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'hopeful': return '🌟';
      case 'grateful': return '🙏';
      default: return '💭';
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Success notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <CheckCircle className="h-5 w-5" />
          <span>Catatan berhasil disimpan!</span>
        </div>
      )}
      
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl animate-scale-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-pink-500 fill-current animate-pulse-soft" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {entry ? 'Edit Catatan' : 'Catatan Baru'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Judul Catatan
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: '' }));
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg transition-all duration-300 focus:scale-105 ${
                errors.title 
                  ? 'border-red-500 dark:border-red-400' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Berikan judul untuk catatan Anda..."
            />
            {errors.title && (
              <div className="flex items-center space-x-1 mt-2 text-red-500 text-sm animate-slide-up">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.title}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as DiaryEntry['mood'])}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300 focus:scale-105"
              >
                <option value="love">{getMoodEmoji('love')} Cinta</option>
                <option value="happy">{getMoodEmoji('happy')} Bahagia</option>
                <option value="sad">{getMoodEmoji('sad')} Sedih</option>
                <option value="hopeful">{getMoodEmoji('hopeful')} Berharap</option>
                <option value="grateful">{getMoodEmoji('grateful')} Bersyukur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Privasi
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pribadi</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Publik</span>
                </label>
              </div>
                
                {!isPrivate && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 animate-slide-up">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Catatan Publik</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Catatan ini dapat dibagikan dan dilihat oleh orang lain
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (Label Catatan) - {tags.length}/5
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Tambahkan kata kunci untuk memudahkan pencarian catatan. Contoh: romantis, kenangan, anniversary
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 dark:from-pink-900 dark:to-purple-900 dark:text-pink-200 animate-scale-in hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md border border-pink-200 dark:border-pink-700 group"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 dark:from-pink-900 dark:to-pink-800 dark:text-pink-200 animate-scale-in hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md border border-pink-200 dark:border-pink-700 group"
                >
                  <span className="text-pink-500 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300">#</span>
                  <span className="font-medium">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200 hover:scale-125 transition-all duration-300 hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold hover:rotate-90"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
              type="text"
              value={tagInput}
                onChange={(e) => handleTagInputChange(e.target.value)}
              onKeyDown={handleAddTag}
                onFocus={() => {
                  if (tagInput.trim() && filteredSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicking
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                disabled={tags.length >= 5}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300 focus:scale-105 ${
                  tags.length >= 5 
                    ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50' 
                    : errors.tags
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Ketik tag dan tekan Enter (contoh: romantis, kenangan, special)"
            />
              
              {/* Autocomplete suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto animate-slide-up">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addTag(suggestion)}
                      className={`w-full text-left px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2 ${
                        index === selectedSuggestionIndex 
                          ? 'bg-pink-100 dark:bg-gray-600 text-pink-700 dark:text-pink-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-pink-500 dark:text-pink-400">#</span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {errors.tags && (
              <div className="flex items-center space-x-1 mt-2 text-red-500 text-sm animate-slide-up">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.tags}</span>
              </div>
            )}
            
            {tags.length === 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                  <Tag className="h-4 w-4 animate-bounce-gentle" />
                  <span className="text-sm font-medium">Tips Tags</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Tags membantu Anda mengorganisir dan mencari catatan dengan mudah.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {['romantis', 'kenangan', 'anniversary', 'special', 'first-date'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => addTag(example)}
                      disabled={tags.length >= 5}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                    >
                      <span className="text-blue-500 dark:text-blue-400">#</span>
                      {example}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 italic">
                  Klik contoh di atas untuk menambahkan tag
                </p>
              </div>
            )}
            
            {tags.length >= 5 && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg animate-slide-up">
                <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Batas Maksimal Tag</span>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Anda telah mencapai batas maksimal 5 tag. Hapus beberapa tag untuk menambah yang baru.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Isi Catatan
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) {
                  setErrors(prev => ({ ...prev, content: '' }));
                }
              }}
              rows={12}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all duration-300 focus:scale-105 ${
                errors.content 
                  ? 'border-red-500 dark:border-red-400' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Tulis isi hati Anda di sini..."
            />
            {errors.content && (
              <div className="flex items-center space-x-1 mt-2 text-red-500 text-sm animate-slide-up">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.content}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 group"
            >
              <Save className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
      
      {showShareModal && entry && !entry.isPrivate && (
        <ShareModal
          isOpen={showShareModal}
          entry={entry}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default EntryEditor;