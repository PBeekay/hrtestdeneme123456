import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block mb-4">
            <img 
              src="/vr_logo.png" 
              alt="VR Logo" 
              className="h-20 w-auto mx-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">İK Kontrol Paneli</h1>
          <p className="text-primary-100">İK Yöneticisi Girişi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-8 animate-fadeInUp border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-400">👤</span>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-all text-neutral-900 dark:text-white placeholder-neutral-400"
                  placeholder="Kullanıcı adınızı girin"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-400">🔒</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-neutral-50 dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-all text-neutral-900 dark:text-white placeholder-neutral-400"
                  placeholder="Şifrenizi girin"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <span className="text-lg">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 animate-shake">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 dark:text-red-400">⚠️</span>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
            >
              Giriş Yap
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <p className="text-xs text-center text-primary-700 dark:text-primary-300">
                <span className="font-semibold">Demo Hesap:</span><br/>
                Kullanıcı: <span className="font-mono">ikadmin</span><br/>
                Şifre: <span className="font-mono">admin123</span>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-primary-100 text-sm">
          <p>© 2025 VR İnsan Kaynakları Yönetim Sistemi</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

