import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import SkeletonCard from './components/SkeletonCard';
import DarkModeToggle from './components/DarkModeToggle';
import ToastContainer from './components/ToastContainer';
import Confetti from './components/Confetti';
import SearchBar from './components/SearchBar';
import StatCard from './components/StatCard';
import LoginPage from './components/LoginPage';
import AssetManagementPanel from './components/AssetManagementPanel';
import { renderWidget } from './components/WidgetRenderer';
import { DashboardData, Task, Announcement } from './types';
import { useDarkMode } from './hooks/useDarkMode';
import { useToast } from './hooks/useToast';
import api from './services/api';
import LeaveManagementPage from './pages/LeaveManagementPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import EmployeeCreatePage from './pages/EmployeeCreatePage';

const DEFAULT_WIDGET_ORDER = [
  'profile',
  'leave',
  'tasks',
  'performance',
  'calendar',
  'taskDetails',
  'assets',
  'announcements',
];

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

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
  const [showAssetManagement, setShowAssetManagement] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();


  const handleLogin = useCallback(async (username: string, password: string) => {
    setLoginError(null);
    const result = await api.login(username, password);
    
    if (result.data && result.status === 200) {
      setIsAuthenticated(true);
      localStorage.setItem('authToken', result.data.token);
      addToast(result.data.message || 'Giriş başarılı!', 'success');
    } else {
      setLoginError(result.error || 'Giriş başarısız!');
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

  const handleNavigateToLeavePage = useCallback(() => {
    navigate('/leave');
  }, [navigate]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNavigateToEmployees = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const handleNavigateToCreateEmployee = useCallback(() => {
    navigate('/employees/new');
  }, [navigate]);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
      return;
    }

    // Fetch dashboard data
    const fetchData = async () => {
      const result = await api.getDashboard();
      if (result.data && result.status === 200) {
        setDashboardData(result.data);
        setLoading(false);
        addToast('✅ Dashboard yüklendi!', 'success');
      } else {
        setError(result.error || 'Veri yüklenemedi');
        setLoading(false);
        addToast(result.error || 'Dashboard yüklenemedi', 'error');
      }
    };

    fetchData();

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

  const { pendingTasks, announcements } = dashboardData;
  
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
    <>
      <Confetti active={showConfetti} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Routes>
        <Route
          path="/"
          element={
            <DashboardView
              dashboardData={dashboardData}
              currentTime={currentTime}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              handleLogout={handleLogout}
              handleSearch={handleSearch}
              filteredTasks={filteredTasks}
              filteredAnnouncements={filteredAnnouncements}
              completedTasks={completedTasks}
              activeTasks={activeTasks}
              handleTaskComplete={handleTaskComplete}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              addToast={addToast}
              setShowAssetManagement={setShowAssetManagement}
              onNavigateToLeaves={handleNavigateToLeavePage}
              onNavigateToEmployees={handleNavigateToEmployees}
              formatTime={formatTime}
              formatDate={formatDate}
            />
          }
        />
        <Route
          path="/leave"
          element={
            <LeaveManagementPage
              leaveBalance={dashboardData.leaveBalance}
              employeeRequests={dashboardData.leaveRequests}
              userRole={dashboardData.userInfo.userRole}
              onBack={handleBackToDashboard}
              addToast={addToast}
            />
          }
        />
        <Route
          path="/employees"
          element={
            <EmployeeManagementPage
              employees={dashboardData.employees}
              stats={dashboardData.employeeStats}
              userRole={dashboardData.userInfo.userRole}
              onBack={handleBackToDashboard}
              addToast={addToast}
              onAddEmployee={handleNavigateToCreateEmployee}
            />
          }
        />
        <Route
          path="/employees/new"
          element={
            <EmployeeCreatePage
              userRole={dashboardData.userInfo.userRole}
              onBack={() => navigate(-1)}
              addToast={addToast}
            />
          }
        />
      </Routes>
      {showAssetManagement && (
        <AssetManagementPanel
          onClose={() => setShowAssetManagement(false)}
          onSuccess={(msg) => addToast(msg, 'success')}
          onError={(msg) => addToast(msg, 'error')}
        />
      )}
    </>
  );
}

export default App;

interface DashboardViewProps {
  dashboardData: DashboardData;
  currentTime: Date;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  handleSearch: (query: string) => void;
  filteredTasks: Task[];
  filteredAnnouncements: Announcement[];
  completedTasks: Set<number>;
  activeTasks: Task[];
  handleTaskComplete: (taskId: number, taskTitle: string) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityIcon: (priority: string) => string;
  addToast: ToastFn;
  setShowAssetManagement: React.Dispatch<React.SetStateAction<boolean>>;
  onNavigateToLeaves: () => void;
  onNavigateToEmployees: () => void;
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  dashboardData,
  currentTime,
  isDarkMode,
  toggleDarkMode,
  handleLogout,
  handleSearch,
  filteredTasks,
  filteredAnnouncements,
  completedTasks,
  activeTasks,
  handleTaskComplete,
  getPriorityColor,
  getPriorityIcon,
  addToast,
  setShowAssetManagement,
  onNavigateToLeaves,
  onNavigateToEmployees,
  formatTime,
  formatDate,
}) => {
  const { userInfo, leaveBalance, pendingTasks, performance, announcements } = dashboardData;
  const employeeCount = dashboardData.employeeStats?.totalEmployees;
  const canOpenEmployeeHub = Boolean(employeeCount || (dashboardData.employees && dashboardData.employees.length > 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-3 md:p-6 transition-colors duration-300">
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
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-4 animate-fadeInUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
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
            icon="👥"
            label="Çalışanlar"
            value={employeeCount ?? '—'}
            delay={225}
            onClick={canOpenEmployeeHub ? onNavigateToEmployees : undefined}
            ctaLabel={canOpenEmployeeHub ? 'Yönet' : undefined}
            disabled={!canOpenEmployeeHub}
            ariaLabel={canOpenEmployeeHub ? 'Çalışan yönetim merkezini aç' : undefined}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-[minmax(120px,auto)]">
          {DEFAULT_WIDGET_ORDER.map((widgetId, index) => renderWidget({
            widgetId,
            dashboardData,
            delay: index * 50,
            completedTasks,
            filteredTasks,
            filteredAnnouncements,
            activeTasks,
            handleTaskComplete,
            getPriorityColor,
            getPriorityIcon,
            addToast,
            setShowAssetManagement,
            onNavigateToLeaves,
          }))}
        </div>
      </div>

      {/* Fixed Side Buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        <button
          onClick={onNavigateToEmployees}
          className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2 group"
          title="Çalışan Yönetim Paneli"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">👥</span>
          <span className="hidden md:inline">Çalışan Paneli</span>
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2 group"
          title="Çıkış Yap"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
          <span className="hidden md:inline">Çıkış</span>
        </button>
      </div>
    </div>
  );
};
