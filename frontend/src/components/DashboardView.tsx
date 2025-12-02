import React from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import SearchBar from './SearchBar';
import StatCard from './StatCard';
import { renderWidget } from './WidgetRenderer';
import { DashboardData, Task } from '../types';
import { formatTime, formatDate, getPriorityColor, getPriorityIcon } from '../utils/helpers';

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

interface DashboardViewProps {
  dashboardData: DashboardData;
  currentTime: Date;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  handleSearch: (query: string) => void;
  filteredTasks: Task[];
  filteredAnnouncements: any[];
  completedTasks: Set<number>;
  activeTasks: Task[];
  handleTaskComplete: (taskId: number, taskTitle: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  setShowAssetManagement: React.Dispatch<React.SetStateAction<boolean>>;
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
  addToast,
  setShowAssetManagement,
}) => {
  const navigate = useNavigate();
  const { userInfo, leaveBalance, pendingTasks, performance, announcements } = dashboardData;
  const employeeCount = dashboardData.employeeStats?.totalEmployees;
  const canOpenEmployeeHub = Boolean(employeeCount || (dashboardData.employees && dashboardData.employees.length > 0));

  const handleNavigateToLeaves = () => navigate('/leave');
  const handleNavigateToEmployees = () => navigate('/employees');

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
                  Hoş geldin, <span className="font-semibold text-primary-600 dark:text-primary-400">{userInfo.name.split(' ')[0]}</span>
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
            icon="●"
            label="Aktif Görevler"
            value={activeTasks.length}
            delay={150}
            trend={activeTasks.length < pendingTasks.length ? 'down' : 'neutral'}
            trendValue={activeTasks.length < pendingTasks.length ? `${completedTasks.size} tamamlandı` : ''}
          />
          <StatCard
            icon="◯"
            label="İzin Günleri"
            value={leaveBalance.annual + leaveBalance.sick + leaveBalance.personal}
            delay={200}
          />
          <StatCard
            icon="○"
            label="Çalışanlar"
            value={employeeCount ?? '—'}
            delay={225}
            onClick={canOpenEmployeeHub ? handleNavigateToEmployees : undefined}
            ctaLabel={canOpenEmployeeHub ? 'Yönet' : undefined}
            disabled={!canOpenEmployeeHub}
            ariaLabel={canOpenEmployeeHub ? 'Çalışan yönetim merkezini aç' : undefined}
          />
          <StatCard
            icon="●"
            label="Performans"
            value={`${Math.round(performance.reduce((acc, p) => acc + (p.value / p.maxValue * 100), 0) / performance.length)}%`}
            delay={250}
            trend="up"
            trendValue="Mükemmel"
          />
          <StatCard
            icon="◯"
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
          }))}
        </div>
      </div>

      {/* Fixed Side Buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        <button
          onClick={handleNavigateToLeaves}
          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2 group"
          title="İzin Yönetimi"
        >
          <span className="hidden md:inline">İzinler</span>
        </button>
        <button
          onClick={handleNavigateToEmployees}
          className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2 group"
          title="Çalışan Yönetim Paneli"
        >
          <span className="hidden md:inline">Çalışan Paneli</span>
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2 group"
          title="Çıkış Yap"
        >
          <span className="hidden md:inline">Çıkış</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardView;

