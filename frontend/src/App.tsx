import React, { useEffect, useState, useCallback } from 'react';
import BentoCard from './components/BentoCard';
import SkeletonCard from './components/SkeletonCard';
import DarkModeToggle from './components/DarkModeToggle';
import ToastContainer from './components/ToastContainer';
import Confetti from './components/Confetti';
import SearchBar from './components/SearchBar';
import StatCard from './components/StatCard';
import LoginPage from './components/LoginPage';
import { DashboardData, Task, Announcement } from './types';
import { useDarkMode } from './hooks/useDarkMode';
import { useToast } from './hooks/useToast';

function App() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const { toasts, addToast, removeToast } = useToast();

  const handleLogin = useCallback(async (username: string, password: string) => {
    setLoginError(null);
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        localStorage.setItem('authToken', data.token);
        addToast(data.message, 'success');
      } else {
        const errorData = await response.json();
        setLoginError(errorData.detail || 'Giriş başarısız!');
      }
    } catch (err) {
      setLoginError('Sunucuya bağlanılamadı. Lütfen backend\'in çalıştığından emin olun.');
    }
  }, [addToast]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    setDashboardData(null);
    addToast('Başarıyla çıkış yapıldı', 'info');
  }, [addToast]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev: boolean) => !prev);
    addToast(isDarkMode ? 'Aydınlık mod aktif ☀️' : 'Karanlık mod aktif 🌙', 'info');
  }, [setIsDarkMode, isDarkMode, addToast]);

  const handleTaskComplete = useCallback((taskId: number, taskTitle: string) => {
    if (completedTasks.has(taskId)) {
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      addToast('Görev işareti kaldırıldı', 'info');
    } else {
      setCompletedTasks(prev => new Set(prev).add(taskId));
      addToast(`Harika iş! "${taskTitle}" tamamlandı! 🎉`, 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
  }, [completedTasks, addToast]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase());
  }, []);

  const filterTasks = useCallback((tasks: Task[]) => {
    if (!searchQuery) return tasks;
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery)
    );
  }, [searchQuery]);

  const filterAnnouncements = useCallback((announcements: Announcement[]) => {
    if (!searchQuery) return announcements;
    return announcements.filter(announcement => 
      announcement.title.toLowerCase().includes(searchQuery) ||
      announcement.category.toLowerCase().includes(searchQuery)
    );
  }, [searchQuery]);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
      return;
    }

    fetch('http://localhost:8000/api/dashboard')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        return response.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
        addToast('Kontrol paneli başarıyla yüklendi! 🎉', 'success');
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        addToast('Kontrol paneli verileri yüklenemedi', 'error');
      });

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [addToast, isAuthenticated]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 animate-pulse">
            <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full w-64 mb-3"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full w-48"></div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(200px,auto)]">
            <SkeletonCard className="md:col-span-2 md:row-span-2" />
            <SkeletonCard className="md:col-span-1 md:row-span-1" />
            <SkeletonCard className="md:col-span-1 md:row-span-1" />
            <SkeletonCard className="md:col-span-1 md:row-span-2" />
            <SkeletonCard className="md:col-span-2 md:row-span-1" />
            <SkeletonCard className="md:col-span-4 md:row-span-1" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center p-8">
          <span className="text-6xl mb-4 block">⚠️</span>
          <p className="text-red-600 dark:text-red-400 font-semibold text-xl mb-2">Hata: {error}</p>
          <p className="text-neutral-600 dark:text-neutral-400">Lütfen backend'in http://localhost:8000 adresinde çalıştığından emin olun</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold transition-colors"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  const { userInfo, leaveBalance, pendingTasks, performance, announcements } = dashboardData;
  
  const filteredTasks = filterTasks(pendingTasks);
  const filteredAnnouncements = filterAnnouncements(announcements);
  const activeTasks = pendingTasks.filter(t => !completedTasks.has(t.id));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '✨';
      default: return '📋';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-3 md:p-6 transition-colors duration-300">
        <Confetti active={showConfetti} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-5 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex items-center space-x-3">
              <img 
                src="/vr_logo.png" 
                alt="VR Logo" 
                className="h-12 md:h-14 w-auto object-contain"
              />
              <div>
                <p className="text-base text-neutral-600 dark:text-neutral-300">
                  Tekrar hoş geldin, <span className="font-semibold text-primary-600 dark:text-primary-400">{userInfo.name.split(' ')[0]}</span>! 👋
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-start md:items-end space-y-0.5">
                <div className="text-lg font-bold text-neutral-900 dark:text-white">{formatTime(currentTime)}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(currentTime)}</div>
              </div>
              <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1"
              >
                <span>🚪</span>
                <span>Çıkış</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-4 animate-fadeInUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard
            icon="📊"
            label="Aktif Görevler"
            value={activeTasks.length}
            delay={150}
            trend={activeTasks.length < pendingTasks.length ? 'down' : 'neutral'}
            trendValue={activeTasks.length < pendingTasks.length ? `${completedTasks.size} tamamlandı` : ''}
          />
          <StatCard
            icon="🏖️"
            label="İzin Günleri"
            value={leaveBalance.annual + leaveBalance.sick + leaveBalance.personal}
            delay={200}
          />
          <StatCard
            icon="🎯"
            label="Performans"
            value={`${Math.round(performance.reduce((acc, p) => acc + (p.value / p.maxValue * 100), 0) / performance.length)}%`}
            delay={250}
            trend="up"
            trendValue="Mükemmel"
          />
          <StatCard
            icon="📢"
            label="Duyurular"
            value={announcements.length}
            delay={300}
            trend="neutral"
            trendValue="Yeni"
          />
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(160px,auto)]">
          
          {/* Profile Card - 2x2 */}
          <BentoCard className="md:col-span-2 md:row-span-2 overflow-hidden relative group" delay={350}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="h-full flex flex-col relative">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">👤</span>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Profil</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-md opacity-50 group-hover/avatar:opacity-75 transition-opacity"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white group-hover/avatar:scale-110 transition-transform duration-300">
                    {userInfo.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <div className="text-center space-y-2 w-full">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{userInfo.name}</h3>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                    <span className="text-xs">💼</span>
                    <p className="text-sm text-primary-700 dark:text-primary-400 font-semibold">{userInfo.role}</p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-center space-x-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                      <span>🏢</span>
                      <p>{userInfo.department}</p>
                    </div>
                    <div className="flex items-center justify-center space-x-1.5 text-neutral-500 dark:text-neutral-400">
                      <span>📧</span>
                      <p className="text-xs">{userInfo.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Leave Balance Card - 1x1 Blue */}
          <BentoCard className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 text-white border-primary-600 dark:border-primary-700 relative overflow-hidden" delay={400}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="h-full flex flex-col relative">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">🏖️</span>
                <h2 className="text-base font-semibold opacity-95">İzin Bakiyesi</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-2.5">
                <div className="flex justify-between items-center p-2 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <span className="text-xs font-medium flex items-center space-x-1.5">
                    <span>🌴</span>
                    <span>Yıllık İzin</span>
                  </span>
                  <span className="text-2xl font-bold">{leaveBalance.annual}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <span className="text-xs font-medium flex items-center space-x-1.5">
                    <span>🤒</span>
                    <span>Hastalık İzni</span>
                  </span>
                  <span className="text-2xl font-bold">{leaveBalance.sick}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <span className="text-xs font-medium flex items-center space-x-1.5">
                    <span>⭐</span>
                    <span>Kişisel</span>
                  </span>
                  <span className="text-2xl font-bold">{leaveBalance.personal}</span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Pending Tasks Card - 1x1 */}
          <BentoCard className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800" delay={450}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">✓</span>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Bekleyen Görevler</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                  <div className="text-center space-y-3">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary-400 dark:bg-primary-600 blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative text-5xl font-bold bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent animate-fadeIn">
                      {activeTasks.length}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">Tamamlanacak görevler</p>
                  <div className="flex items-center justify-center space-x-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span>{activeTasks.filter(t => t.priority === 'high').length} Yüksek</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span>{activeTasks.filter(t => t.priority === 'medium').length} Orta</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Performance Card - 1x2 */}
          <BentoCard className="md:col-span-1 md:row-span-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800" delay={500}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl">📈</span>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Performans</h2>
              </div>
              <div className="flex-1 space-y-5">
                {performance.map((metric, index) => {
                  const percentage = (metric.value / metric.maxValue) * 100;
                  const getPerformanceColor = () => {
                    if (percentage >= 80) return 'from-green-500 to-emerald-600';
                    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
                    return 'from-amber-500 to-orange-600';
                  };
                  
                  return (
                    <div key={index} className="space-y-2 group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{metric.label}</span>
                        <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                          {metric.value}{metric.maxValue === 100 ? '%' : `/${metric.maxValue}`}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${getPerformanceColor()} h-2 rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                          </div>
                        </div>
                        {percentage >= 80 && (
                          <span className="absolute -top-1 right-0 text-base animate-bounce">🌟</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5">Genel Skor</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {Math.round(performance.reduce((acc, p) => acc + (p.value / p.maxValue * 100), 0) / performance.length)}%
                  </p>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Task Details Card - 2x1 */}
          <BentoCard className="md:col-span-2 md:row-span-1" delay={550}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📋</span>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Görev Detayları</h2>
                </div>
                <button 
                  onClick={() => addToast('Tüm görev listesi yakında geliyor!', 'info')}
                  className="text-[10px] text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                >
                  Tümünü Gör →
                </button>
              </div>
              <div className="flex-1 space-y-2">
                {filteredTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-neutral-500 dark:text-neutral-400">
                    <p>Aramanızla eşleşen görev bulunamadı</p>
                  </div>
                ) : (
                  filteredTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-xl hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer group border border-transparent hover:border-primary-200 dark:hover:border-primary-700 ${
                        completedTasks.has(task.id) ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-neutral-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <input 
                            type="checkbox" 
                            checked={completedTasks.has(task.id)}
                            className="w-4 h-4 rounded cursor-pointer accent-primary-600"
                            onChange={() => handleTaskComplete(task.id, task.title)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors ${
                            completedTasks.has(task.id) ? 'line-through text-neutral-500 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">📅 Son: {task.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getPriorityColor(task.priority)} flex items-center space-x-1 shadow-sm`}>
                        <span>{getPriorityIcon(task.priority)}</span>
                        <span>{task.priority === 'high' ? 'YÜKSEK' : task.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </BentoCard>

          {/* Announcements Card - Full Width */}
          <BentoCard className="md:col-span-4 md:row-span-1" delay={600}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📢</span>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Son Duyurular</h2>
                </div>
                <span className="inline-flex items-center space-x-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <span>Canlı Güncellemeler</span>
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                {filteredAnnouncements.length === 0 ? (
                  <div className="col-span-3 flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                    <p>Aramanızla eşleşen duyuru bulunamadı</p>
                  </div>
                ) : (
                  filteredAnnouncements.map((announcement, index) => {
                    const getCategoryIcon = (category: string) => {
                      switch(category) {
                        case 'Etkinlik': return '🎉';
                        case 'Yan Haklar': return '💼';
                        case 'Tatil': return '🎊';
                        default: return '📢';
                      }
                    };
                    
                    return (
                      <div
                        key={announcement.id}
                        onClick={() => addToast('Duyuru detayları yakında geliyor!', 'info')}
                        className="p-3 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-600 hover:shadow-md hover:scale-[1.02] hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="flex items-center space-x-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-bold group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                            <span>{getCategoryIcon(announcement.category)}</span>
                            <span>{announcement.category}</span>
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">📅 {announcement.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-relaxed group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                          {announcement.title}
                        </p>
                        <div className="mt-2 flex items-center text-[10px] text-primary-600 dark:text-primary-400 font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Devamını oku →</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </div>
  );
}

export default App;


