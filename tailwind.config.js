/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'sunset': 'sunset 0.8s ease-in-out',
        'sunrise': 'sunrise 0.8s ease-in-out',
        'sun-glow': 'sunGlow 2s ease-in-out infinite',
        'trash-open': 'trashOpen 0.3s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'letter-shimmer-1': 'letterShimmer 6s ease-in-out infinite',
        'letter-shimmer-2': 'letterShimmer 6s ease-in-out infinite 0.6s',
        'letter-shimmer-3': 'letterShimmer 6s ease-in-out infinite 1.2s',
        'letter-shimmer-4': 'letterShimmer 6s ease-in-out infinite 1.8s',
        'letter-shimmer-5': 'letterShimmer 6s ease-in-out infinite 2.4s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sunset: {
          '0%': { 
            transform: 'translateY(0) rotate(0deg)',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)'
          },
          '50%': { 
            transform: 'translateY(8px) rotate(180deg)',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)'
          },
          '100%': { 
            transform: 'translateY(0) rotate(360deg)',
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            boxShadow: '0 0 10px rgba(31, 41, 55, 0.3)'
          },
        },
        sunrise: {
          '0%': { 
            transform: 'translateY(0) rotate(0deg)',
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            boxShadow: '0 0 10px rgba(31, 41, 55, 0.3)'
          },
          '50%': { 
            transform: 'translateY(-8px) rotate(180deg)',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)'
          },
          '100%': { 
            transform: 'translateY(0) rotate(360deg)',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)'
          },
        },
        sunGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.8)' 
          },
        },
        trashOpen: {
          '0%': { transform: 'rotate(0deg) translateY(0)' },
          '50%': { transform: 'rotate(-10deg) translateY(-2px)' },
          '100%': { transform: 'rotate(0deg) translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
