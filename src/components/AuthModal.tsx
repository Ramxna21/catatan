import React, { useState } from 'react';
import { X, Heart, Mail, Lock } from 'lucide-react';
import { AuthModalProps } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, onGoogleLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  React.useEffect(() => {
    // Initialize Google Sign-In
    const clientId = "YOUR_GOOGLE_CLIENT_ID"; // You'll need to replace this with actual client ID
    
    // Only initialize if we have a real client ID (not the placeholder)
    if (window.google && clientId !== "YOUR_GOOGLE_CLIENT_ID") {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
      });
    }
  }, []);

  const handleGoogleResponse = (response: any) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const googleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: 'google' as const,
        createdAt: new Date().toISOString()
      };
      
      onGoogleLogin(googleUser);
      setIsGoogleLoading(false);
    } catch (error) {
      console.error('Error parsing Google response:', error);
      setIsGoogleLoading(false);
      alert('Terjadi kesalahan saat login dengan Google');
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    const clientId = "YOUR_GOOGLE_CLIENT_ID";
    
    if (window.google && clientId !== "YOUR_GOOGLE_CLIENT_ID") {
      window.google.accounts.id.prompt();
    } else {
      // Fallback: simulate Google login for demo purposes
      setTimeout(() => {
        const demoUser = {
          id: 'google_' + Date.now(),
          email: 'user@gmail.com',
          name: 'Google User',
          avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          provider: 'google' as const,
          createdAt: new Date().toISOString()
        };
        onGoogleLogin(demoUser);
        setIsGoogleLoading(false);
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(email, password);
    } else {
      if (password === confirmPassword) {
        onLogin(email, password);
      } else {
        alert('Password tidak cocok!');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in transform">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-500 fill-current animate-pulse-soft" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? 'Masuk' : 'Daftar'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300 focus:scale-105"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300 focus:scale-105"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300 focus:scale-105"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                atau
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-300"></div>
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
          >
            {isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-500 hover:text-pink-600 font-medium ml-1 transition-all duration-300 hover:scale-105"
            >
              {isLogin ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;