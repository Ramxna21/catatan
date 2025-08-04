import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, onToggle }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onToggle();
      setTimeout(() => setIsAnimating(false), 800);
    }, 100);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative p-3 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 group"
      style={{
        background: darkMode 
          ? 'linear-gradient(135deg, #1f2937, #374151)' 
          : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        boxShadow: darkMode
          ? '0 0 10px rgba(31, 41, 55, 0.3)'
          : '0 0 20px rgba(251, 191, 36, 0.6)'
      }}
    >
      {/* Sky background */}
      <div 
        className={`absolute inset-0 transition-all duration-800 ${
          darkMode 
            ? 'bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900' 
            : 'bg-gradient-to-b from-blue-400 via-orange-300 to-yellow-200'
        }`}
      />
      
      {/* Clouds */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute top-1 left-1 w-2 h-1 rounded-full transition-all duration-800 ${
            darkMode ? 'bg-gray-600/30' : 'bg-white/60'
          }`}
          style={{ 
            transform: darkMode ? 'translateX(8px)' : 'translateX(0px)',
            animationDelay: '0.2s'
          }}
        />
        <div 
          className={`absolute top-2 right-1 w-1.5 h-0.5 rounded-full transition-all duration-800 ${
            darkMode ? 'bg-gray-600/20' : 'bg-white/40'
          }`}
          style={{ 
            transform: darkMode ? 'translateX(-6px)' : 'translateX(0px)',
            animationDelay: '0.4s'
          }}
        />
      </div>

      {/* Stars (only visible in dark mode) */}
      {darkMode && (
        <div className="absolute inset-0">
          <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-3 right-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-2 left-1 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      )}

      {/* Sun/Moon icon */}
      <div 
        className={`relative z-10 transition-all duration-800 ${
          isAnimating 
            ? (darkMode ? 'animate-sunrise' : 'animate-sunset')
            : darkMode 
              ? 'animate-sun-glow' 
              : 'animate-sun-glow'
        }`}
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #e5e7eb, #f3f4f6)' 
            : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          borderRadius: '50%',
          padding: '2px'
        }}
      >
        {darkMode ? (
          <Moon className="h-4 w-4 text-gray-700 transition-all duration-300" />
        ) : (
          <Sun className="h-4 w-4 text-orange-800 transition-all duration-300" />
        )}
      </div>

      {/* Horizon line */}
      <div 
        className={`absolute bottom-2 left-0 right-0 h-0.5 transition-all duration-800 ${
          darkMode 
            ? 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700' 
            : 'bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400'
        }`}
      />

      {/* Reflection effect */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-2 transition-all duration-800 ${
          darkMode 
            ? 'bg-gradient-to-t from-gray-800/50 to-transparent' 
            : 'bg-gradient-to-t from-yellow-300/30 to-transparent'
        }`}
      />
    </button>
  );
};

export default DarkModeToggle;