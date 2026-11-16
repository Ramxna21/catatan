import React, { useState, useRef } from 'react';
import { X, Copy, Share2, Facebook, Twitter, MessageCircle, Download, Check, Sparkles, Eye } from 'lucide-react';
import { ShareModalProps } from '../types';

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, entry, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'story' | 'quote' | 'minimal'>('story');
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);
  const [showShareAnimation, setShowShareAnimation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

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

  const getFormattedContent = () => {
    switch (selectedFormat) {
      case 'story':
        return {
          title: entry.title,
          content: entry.content,
          shareText: `📖 "${entry.title}"\n\n${entry.content}\n\n${getMoodEmoji(entry.mood)} ${entry.mood} • ${new Date(entry.createdAt).toLocaleDateString('id-ID')}\n\n💕 Dibagikan dari Kenang`,
          description: 'Cerita lengkap dengan semua detail'
        };
      
      case 'quote': {
        // Extract the most meaningful sentence (first sentence or up to 100 chars)
        const sentences = entry.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const bestQuote = sentences[0]?.trim() || entry.content.substring(0, 100) + '...';
        return {
          title: `"${bestQuote}"`,
          content: `- ${entry.title}`,
          shareText: `✨ "${bestQuote}"\n\n- ${entry.title}\n${getMoodEmoji(entry.mood)} ${new Date(entry.createdAt).toLocaleDateString('id-ID')}\n\n💕 Kutipan dari Kenang`,
          description: 'Kutipan indah yang menyentuh hati'
        };
      }

      case 'minimal': {
        const shortContent = entry.content.length > 80 
          ? entry.content.substring(0, 80) + '...' 
          : entry.content;
        return {
          title: entry.title,
          content: shortContent,
          shareText: `💭 ${entry.title}\n\n${shortContent}\n\n${getMoodEmoji(entry.mood)} ${new Date(entry.createdAt).toLocaleDateString('id-ID')} • Kenang 💕`,
          description: 'Ringkasan singkat dan padat'
        };
      }
      
      default:
        return {
          title: entry.title,
          content: entry.content,
          shareText: entry.content,
          description: ''
        };
    }
  };

  const formatData = getFormattedContent();
  const shareUrl = `${window.location.origin}${window.location.pathname}#beranda`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${formatData.shareText}\n\n🔗 ${shareUrl}`);
      setCopied(true);
      setShowCopyAnimation(true);
      setTimeout(() => {
        setCopied(false);
        setShowCopyAnimation(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedText = encodeURIComponent(formatData.shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
    }
    
    if (shareLink) {
      setShowShareAnimation(true);
      setTimeout(() => setShowShareAnimation(false), 1000);
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  const generateShareImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Different backgrounds for different formats
    let gradient;
    switch (selectedFormat) {
      case 'story':
        gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#fdf2f8');
        gradient.addColorStop(0.5, '#fce7f3');
        gradient.addColorStop(1, '#f3e8ff');
        break;
      case 'quote':
        gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(0.5, '#e0f2fe');
        gradient.addColorStop(1, '#f0f4ff');
        break;
      case 'minimal':
        gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#f9fafb');
        gradient.addColorStop(0.5, '#f3f4f6');
        gradient.addColorStop(1, '#e5e7eb');
        break;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Add decorative elements based on format
    if (selectedFormat === 'story') {
      // Book-like decorations
      ctx.fillStyle = 'rgba(236, 72, 153, 0.1)';
      ctx.beginPath();
      ctx.arc(100, 100, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(147, 51, 234, 0.1)';
      ctx.beginPath();
      ctx.arc(700, 500, 80, 0, Math.PI * 2);
      ctx.fill();
    } else if (selectedFormat === 'quote') {
      // Quote marks
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.font = 'bold 120px serif';
      ctx.fillText('"', 50, 150);
      ctx.fillText('"', 650, 500);
    } else {
      // Minimal dots
      ctx.fillStyle = 'rgba(107, 114, 128, 0.3)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(100 + i * 150, 100, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = selectedFormat === 'quote' ? 'italic 28px serif' : 'bold 32px Arial';
    ctx.textAlign = 'center';
    
    // Wrap text for title
    const titleWords = formatData.title.split(' ');
    let titleLine = '';
    let titleY = selectedFormat === 'quote' ? 250 : 200;
    
    for (let i = 0; i < titleWords.length; i++) {
      const testLine = titleLine + titleWords[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > 700 && i > 0) {
        ctx.fillText(titleLine, 400, titleY);
        titleLine = titleWords[i] + ' ';
        titleY += 40;
      } else {
        titleLine = testLine;
      }
    }
    ctx.fillText(titleLine, 400, titleY);
    
    // Content
    if (selectedFormat !== 'quote') {
      ctx.fillStyle = '#4b5563';
      ctx.font = '20px Arial';
      const words = formatData.content.split(' ');
      let line = '';
      let y = titleY + 60;
      
      for (let i = 0; i < words.length && y < 450; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > 700 && i > 0) {
          ctx.fillText(line, 400, y);
          line = words[i] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      if (y < 450) {
        ctx.fillText(line, 400, y);
      }
    }
    
    // Mood and date
    ctx.fillStyle = '#6b7280';
    ctx.font = '18px Arial';
    ctx.fillText(
      `${getMoodEmoji(entry.mood)} ${entry.mood} • ${new Date(entry.createdAt).toLocaleDateString('id-ID')}`,
      400,
      520
    );
    
    // Branding
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('💕 Kenang', 400, 560);
    
    // Download the image
    const link = document.createElement('a');
    const formatName = selectedFormat === 'story' ? 'cerita' : selectedFormat === 'quote' ? 'kutipan' : 'ringkas';
    link.download = `kenang-${formatName}-${entry.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'story': return '📖';
      case 'quote': return '✨';
      case 'minimal': return '💭';
      default: return '📝';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'story': return 'from-pink-500 to-purple-500';
      case 'quote': return 'from-blue-500 to-indigo-500';
      case 'minimal': return 'from-gray-500 to-slate-500';
      default: return 'from-pink-500 to-pink-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      {/* Copy Animation */}
      {showCopyAnimation && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <Check className="h-5 w-5 animate-bounce" />
          <span>Berhasil disalin!</span>
        </div>
      )}
      
      {/* Share Animation */}
      {showShareAnimation && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-slide-down">
          <Share2 className="h-5 w-5 animate-pulse" />
          <span>Membuka aplikasi...</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-pink-500 animate-pulse-soft" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bagikan Catatan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Share Format Options */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Pilih Format Berbagi
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {[
              { 
                id: 'story', 
                label: 'Cerita Lengkap', 
                icon: '📖', 
                desc: 'Bagikan cerita lengkap dengan semua detail dan konteks'
              },
              { 
                id: 'quote', 
                label: 'Kutipan Indah', 
                icon: '✨', 
                desc: 'Ambil kalimat terbaik sebagai kutipan yang menginspirasi'
              },
              { 
                id: 'minimal', 
                label: 'Ringkas', 
                icon: '💭', 
                desc: 'Versi singkat dan padat untuk berbagi cepat'
              }
            ].map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id as 'story' | 'quote' | 'minimal')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 text-left ${
                  selectedFormat === format.id
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{format.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{format.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {format.desc}
                    </div>
                  </div>
                  {selectedFormat === format.id && (
                    <Check className="h-5 w-5 text-pink-500 animate-bounce" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview Format: {getFormatIcon(selectedFormat)} {selectedFormat === 'story' ? 'Cerita Lengkap' : selectedFormat === 'quote' ? 'Kutipan Indah' : 'Ringkas'}
            </h4>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1 text-sm text-pink-500 hover:text-pink-600 transition-colors duration-300"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Sembunyikan' : 'Lihat'} Preview</span>
            </button>
          </div>
          
          {showPreview && (
            <div className={`bg-gradient-to-br ${getFormatColor(selectedFormat)} p-6 rounded-xl text-white animate-slide-up shadow-lg`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className={`font-bold mb-2 ${selectedFormat === 'quote' ? 'italic text-lg' : 'text-xl'}`}>
                  {formatData.title}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed mb-3">
                  {formatData.content}
                </p>
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>{getMoodEmoji(entry.mood)} {entry.mood}</span>
                  <span>{new Date(entry.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="text-center mt-3 text-xs text-white/60">
                  💕 Kenang
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy Link */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Salin Teks & Link
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
              Teks yang akan dibagikan:
            </div>
            <div className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded border max-h-32 overflow-y-auto">
              {formatData.shareText}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 animate-bounce" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Media Share */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Bagikan ke Media Sosial
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { platform: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600 hover:bg-blue-700' },
              { platform: 'twitter', label: 'Twitter', icon: Twitter, color: 'bg-sky-500 hover:bg-sky-600' },
              { platform: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-600 hover:bg-green-700' },
              { platform: 'telegram', label: 'Telegram', icon: MessageCircle, color: 'bg-blue-500 hover:bg-blue-600' }
            ].map((social) => (
              <button
                key={social.platform}
                onClick={() => handleSocialShare(social.platform)}
                className={`${social.color} text-white p-3 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center space-y-1 group`}
              >
                <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-medium">{social.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Download as Image */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <button
            onClick={generateShareImage}
            className={`w-full bg-gradient-to-r ${getFormatColor(selectedFormat)} text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group`}
          >
            <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            <span>Unduh sebagai Gambar ({selectedFormat === 'story' ? 'Cerita' : selectedFormat === 'quote' ? 'Kutipan' : 'Ringkas'})</span>
            <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Gambar akan disesuaikan dengan format yang dipilih
          </p>
        </div>
      </div>
      
      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ShareModal;