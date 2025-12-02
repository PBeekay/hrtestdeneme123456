import React from 'react';
import BentoCard from './BentoCard';
import AssetCard from './AssetCard';
import CalendarWidget from './CalendarWidget';
import { DashboardData, Task } from '../types';

interface WidgetRendererProps {
  widgetId: string;
  dashboardData: DashboardData;
  delay: number;
  completedTasks: Set<number>;
  filteredTasks: Task[];
  filteredAnnouncements: any[];
  activeTasks: Task[];
  handleTaskComplete: (id: number, title: string) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityIcon: (priority: string) => string;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  setShowAssetManagement: (show: boolean) => void;
}

export const renderWidget = (props: WidgetRendererProps): React.ReactNode | null => {
  const {
    widgetId,
    dashboardData,
    delay,
    completedTasks,
    filteredTasks,
    filteredAnnouncements,
    activeTasks,
    handleTaskComplete,
    getPriorityColor,
    getPriorityIcon,
    addToast,
    setShowAssetManagement,
  } = props;

  const { userInfo, leaveBalance, performance } = dashboardData;

  switch (widgetId) {
    case 'profile':
      return (
        <div key="profile" className="md:col-span-1 md:row-span-1">
          <BentoCard className="overflow-hidden relative group h-full" delay={delay}>
            <div className="h-full flex flex-col justify-center items-center relative text-center py-0.5">
              <div className="space-y-1.5">
                <div className="relative group/avatar inline-block">
                  <div className="absolute inset-0 bg-primary-400 dark:bg-primary-600 blur-lg opacity-20 animate-pulse"></div>
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold shadow-md ring-2 ring-white dark:ring-neutral-800 mx-auto">
                    {userInfo.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{userInfo.name}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-normal">{userInfo.role}</p>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'leave':
      return (
        <div key="leave" className="md:col-span-1 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 text-white border-primary-600 dark:border-primary-700 relative overflow-hidden h-full" delay={delay}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="h-full flex flex-col relative">
              <div className="flex items-center space-x-1.5 mb-2">
                <h2 className="text-sm font-semibold opacity-95">İzin Bakiyesi</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-1.5">
                <div className="flex justify-between items-center p-1.5 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <span className="text-[11px] font-medium">
                    Yıllık
                  </span>
                  <span className="text-xl font-bold">{leaveBalance.annual}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <span className="text-[11px] font-medium">
                    Hastalık
                  </span>
                  <span className="text-xl font-bold">{leaveBalance.sick}</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <span className="text-[11px] font-medium">
                    Kişisel
                  </span>
                  <span className="text-xl font-bold">{leaveBalance.personal}</span>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'tasks':
      return (
        <div key="tasks" className="md:col-span-1 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-1.5 mb-2">
                <span className="text-lg">✓</span>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Görevler</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary-400 dark:bg-primary-600 blur-lg opacity-20 animate-pulse"></div>
                    <div className="relative text-4xl font-bold bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent animate-fadeIn">
                      {activeTasks.length}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">Bekleyen</p>
                  <div className="flex items-center justify-center space-x-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center space-x-0.5">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span>{activeTasks.filter(t => t.priority === 'high').length}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-0.5">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span>{activeTasks.filter(t => t.priority === 'medium').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'performance':
      return (
        <div key="performance" className="md:col-span-1 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-1.5 mb-2">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Performans</h2>
              </div>
              <div className="flex-1 space-y-2">
                {performance.map((metric, index) => {
                  const percentage = (metric.value / metric.maxValue) * 100;
                  const getPerformanceColor = () => {
                    if (percentage >= 80) return 'from-green-500 to-emerald-600';
                    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
                    return 'from-amber-500 to-orange-600';
                  };
                  
                  return (
                    <div key={index} className="space-y-1 group">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">{metric.label}</span>
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                          {metric.value}{metric.maxValue === 100 ? '%' : `/${metric.maxValue}`}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${getPerformanceColor()} h-1.5 rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'calendar':
      return (
        <div key="calendar" className="md:col-span-2 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-sky-100 dark:border-sky-800 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-1.5 mb-2">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Takvim</h2>
              </div>
              <CalendarWidget onDateSelect={(date) => addToast(`${date.toLocaleDateString('tr-TR')} seçildi`, 'info')} />
            </div>
          </BentoCard>
        </div>
      );

    case 'taskDetails':
      return (
        <div key="taskDetails" className="md:col-span-2 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-100 dark:border-slate-800 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Görev Detayları</h2>
                </div>
                <button 
                  onClick={() => addToast('Tüm görev listesi yakında geliyor!', 'info')}
                  className="text-[10px] text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-2 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                >
                  Tümü →
                </button>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                {filteredTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-neutral-500 dark:text-neutral-400">
                    <p>Görev bulunamadı</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-2 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-lg hover:shadow-sm hover:scale-[1.01] transition-all duration-200 cursor-pointer group border border-transparent hover:border-primary-200 dark:hover:border-primary-700 ${
                        completedTasks.has(task.id) ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-neutral-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <input 
                            type="checkbox" 
                            checked={completedTasks.has(task.id)}
                            className="w-3.5 h-3.5 rounded cursor-pointer accent-primary-600"
                            onChange={() => handleTaskComplete(task.id, task.title)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors ${
                            completedTasks.has(task.id) ? 'line-through text-neutral-500 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                          }`}>
                            {task.title}
                          </p>
                          <span className="text-[9px] text-neutral-500 dark:text-neutral-400">{task.dueDate}</span>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityColor(task.priority)} flex items-center space-x-0.5 shadow-sm flex-shrink-0`}>
                        <span>{getPriorityIcon(task.priority)}</span>
                        <span className="hidden sm:inline">{task.priority === 'high' ? 'YÜKSEK' : task.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'assets':
      if (dashboardData.assets && dashboardData.assets.length > 0) {
        return (
          <div key="assets" className="md:col-span-2 md:row-span-1">
            <BentoCard className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-100 dark:border-indigo-800 h-full" delay={delay}>
              <AssetCard 
                assets={dashboardData.assets} 
                userRole={dashboardData.userInfo.userRole}
                onViewDocument={(url) => {
                  window.open(url, '_blank');
                  addToast('Belge yeni sekmede açıldı', 'info');
                }}
                onManage={() => setShowAssetManagement(true)}
              />
            </BentoCard>
          </div>
        );
      }
      return null;

    case 'announcements':
      return (
        <div key="announcements" className="md:col-span-4 md:row-span-1">
          <BentoCard className="h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Son Duyurular</h2>
                </div>
                <span className="inline-flex items-center space-x-1 text-[9px] text-neutral-500 dark:text-neutral-400">
                  <span className="relative flex h-1 w-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-green-500"></span>
                  </span>
                  <span className="hidden sm:inline">Canlı</span>
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                {filteredAnnouncements.length === 0 ? (
                  <div className="col-span-3 flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
                    <p>Duyuru bulunamadı</p>
                  </div>
                ) : (
                  filteredAnnouncements.map((announcement) => {
                    return (
                      <div
                        key={announcement.id}
                        onClick={() => addToast('Duyuru detayları yakında geliyor!', 'info')}
                        className="p-2.5 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:shadow-sm hover:scale-[1.01] hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-[9px] text-neutral-500 dark:text-neutral-400">{announcement.date}</span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{announcement.title}</h3>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2">{announcement.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {announcement.category}
                          </span>
                          <span className="text-primary-600 dark:text-primary-400 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Devamını oku →</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </BentoCard>
        </div>
      );

    default:
      return null;
  }
};

