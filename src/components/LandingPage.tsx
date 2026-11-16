import React from 'react';
import { Heart, BookOpen, Lock, Share2, Sparkles, Star } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

interface LandingPageProps {
  onLogin: () => void;
  onDarkModeToggle: () => void;
  darkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onDarkModeToggle, darkMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-float">
          <Heart className="h-8 w-8 text-pink-300/30 dark:text-pink-500/20 fill-current" />
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <Star className="h-6 w-6 text-purple-300/30 dark:text-purple-500/20 fill-current" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: '2s' }}>
          <Sparkles className="h-10 w-10 text-indigo-300/30 dark:text-indigo-500/20" />
        </div>
        <div className="absolute top-60 right-10 animate-float" style={{ animationDelay: '0.5s' }}>
          <Heart className="h-4 w-4 text-pink-400/40 dark:text-pink-600/30 fill-current" />
        </div>
      </div>

      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-pink-200 dark:border-gray-700 sticky top-0 z-50 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-pink-500 fill-current animate-pulse-soft" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Kenang
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DarkModeToggle darkMode={darkMode} onToggle={onDarkModeToggle} />
              
              <button
                onClick={onLogin}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-2 rounded-full hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <Heart className="h-4 w-4 fill-current" />
                <span>Masuk</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in">
          {/* Small header/subheading */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4 animate-slide-up italic">
            "Setiap rasa yang kau simpan, tak pernah benar-benar hilang."
          </p>
          
          {/* Main CTA title */}
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 animate-slide-up">
            Karena Tak Semua Rasa Harus Hilang,<br />
            Simpan di{' '}
            <span className="relative inline-block">
              <span className="font-extrabold kenang-wave">
                <span className="kenang-letter kenang-letter-1">K</span>
                <span className="kenang-letter kenang-letter-2">e</span>
                <span className="kenang-letter kenang-letter-3">n</span>
                <span className="kenang-letter kenang-letter-4">a</span>
                <span className="kenang-letter kenang-letter-5">n</span>
                <span className="kenang-letter kenang-letter-6">g</span>
              </span>
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Kenang adalah tempat istimewa untuk menyimpan setiap momen berharga, 
            kenangan indah, dan perasaan mendalam yang tidak ingin Anda lupakan.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
              Tulis Dengan Bebas
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Ekspresikan perasaan Anda tanpa batas. Tulis surat cinta, kenangan manis, 
              atau bahkan harapan untuk masa depan.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
              Privasi Terjamin
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Setiap catatan Anda aman dan terlindungi. Pilih untuk menjaga privasi 
              atau berbagi kisah indah dengan dunia.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300">
              Berbagi Inspirasi
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Biarkan kisah cinta Anda menginspirasi orang lain. Publikasikan catatan 
              terpilih dan sentuh hati pembaca.
            </p>
          </div>
        </div>

        <div className="text-center animate-bounce-gentle" style={{ animationDelay: '0.8s' }}>
          <button
            onClick={onLogin}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 active:scale-95 relative overflow-hidden group flex items-center space-x-3"
          >
            <Heart className="h-6 w-6 fill-current group-hover:scale-110 transition-transform duration-300" />
            <span className="relative z-10">
            Mulai Menulis Kisah Anda
            </span>
            <Heart className="h-6 w-6 fill-current group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          <p className="text-gray-500 dark:text-gray-400 mt-4 animate-fade-in" style={{ animationDelay: '1s' }}>
            Gratis dan mudah digunakan
          </p>
        </div>
      </main>

      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-t border-pink-200 dark:border-gray-700 mt-16 animate-slide-up" style={{ animationDelay: '1.2s' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500 fill-current animate-pulse-soft" />
            <span className="text-gray-600 dark:text-gray-300">
              Kenang - Simpan setiap kisah yang berharga
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;