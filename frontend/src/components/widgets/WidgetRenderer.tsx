import React from 'react';
import BentoCard from '../ui/BentoCard';
import AssetCard from './AssetCard';
import CalendarWidget from './CalendarWidget';
import RemindersWidget from './RemindersWidget';
import { DashboardData, Task } from '../../types';

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
  onCalendarDateSelect?: (date: Date) => void;
  onAnnouncementClick?: (announcement: any) => void;
  onAddAnnouncementClick?: () => void;
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
    onCalendarDateSelect,
    onAnnouncementClick,
    onAddAnnouncementClick,
  } = props;

  const { userInfo, leaveBalance } = dashboardData;

  switch (widgetId) {
    case 'profile':
      const calculateDaysSinceHire = (startDate: string | null | undefined): number | null => {
        if (!startDate) return null;
        const start = new Date(startDate);
        const today = new Date();
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      };

      const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

      const daysSinceHire = calculateDaysSinceHire(userInfo.startDate);

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
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-600 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm">
                    <div className="absolute inset-0 bg-emerald-600 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{userInfo.name}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-normal">{userInfo.role}</p>
                </div>
                {userInfo.startDate && (
                  <div className="pt-1 space-y-0.5 border-t border-neutral-200 dark:border-neutral-700 mt-1.5">
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      İşe Giriş: {formatDate(userInfo.startDate)}
                    </p>
                    {daysSinceHire !== null && (
                      <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                        {daysSinceHire} gün geçti
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'leave':
      return (
        <div key="leave" className="md:col-span-1 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 dark:from-teal-700 dark:via-teal-800 dark:to-teal-900 text-white border-teal-700 dark:border-teal-800 relative overflow-hidden h-full" delay={delay}>
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
          <BentoCard className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700 h-full" delay={delay}>
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
                      <div className="w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
                      <span>{activeTasks.filter(t => t.priority === 'high').length}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-0.5">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
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
          <BentoCard className="bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-900/20 dark:to-zinc-900/20 border-slate-200 dark:border-slate-700 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg">📦</span>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Zimmetler</h2>
                </div>
                <button
                  onClick={() => setShowAssetManagement(true)}
                  className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 transition-colors"
                >
                  Yönet
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-2">
                <div className="flex items-center justify-between bg-white/70 dark:bg-neutral-800/70 rounded-md px-3 py-2 shadow-sm">
                  <div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Toplam Zimmet</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">
                      {dashboardData.assetStatistics?.total_count ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-teal-600 dark:text-teal-400">Aktif</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {dashboardData.assetStatistics?.active_count ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-neutral-600 dark:text-neutral-300">
                  <div className="flex flex-col rounded-lg bg-white/60 dark:bg-neutral-800/60 px-2 py-1">
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400">İade</span>
                    <span className="font-semibold">
                      {dashboardData.assetStatistics?.returned_count ?? '—'}
                    </span>
                  </div>
                  <div className="flex flex-col rounded-lg bg-white/60 dark:bg-neutral-800/60 px-2 py-1">
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Hasarlı</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-500">
                      {dashboardData.assetStatistics?.damaged_count ?? '—'}
                    </span>
                  </div>
                  <div className="flex flex-col rounded-lg bg-white/60 dark:bg-neutral-800/60 px-2 py-1">
                    <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Kayıp</span>
                    <span className="font-semibold text-rose-700 dark:text-rose-500">
                      {dashboardData.assetStatistics?.lost_count ?? '—'}
                    </span>
                  </div>
                </div>
                {dashboardData.assetStatistics?.employee_count !== undefined && (
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {dashboardData.assetStatistics.employee_count} çalışanda zimmetli eşya var.
                  </p>
                )}
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'calendar':
      return (
        <div key="calendar" className="md:col-span-2 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-1.5 mb-2">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">📅 Takvim ve Hatırlatıcılar</h2>
              </div>
              <div className="flex-1 flex flex-col space-y-3">
                <div className="flex-1 min-h-0">
                  <CalendarWidget onDateSelect={onCalendarDateSelect || ((date) => addToast(`${date.toLocaleDateString('tr-TR')} seçildi`, 'info'))} />
                </div>
                <div className="border-t border-blue-200 dark:border-blue-800 pt-2">
                  <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">Otomatik Bildirimler</h3>
                  <RemindersWidget delay={delay + 50} />
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'taskDetails':
      return (
        <div key="taskDetails" className="md:col-span-2 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-neutral-50 to-stone-50 dark:from-neutral-900/20 dark:to-stone-900/20 border-neutral-200 dark:border-neutral-700 h-full" delay={delay}>
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
                      className={`flex items-center justify-between p-2 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-lg hover:shadow-sm hover:scale-[1.01] transition-all duration-100 cursor-pointer group border border-transparent hover:border-primary-200 dark:hover:border-primary-700 ${completedTasks.has(task.id) ? 'opacity-50' : ''
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
                          <p className={`text-xs font-semibold truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors ${completedTasks.has(task.id) ? 'line-through text-neutral-500 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
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
            <BentoCard className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-purple-200 dark:border-purple-800 h-full" delay={delay}>
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

    case 'announcements_mini':
      return (
        <div key="announcements_mini" className="md:col-span-1 md:row-span-1">
          <BentoCard className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-200 dark:border-indigo-700 h-full" delay={delay}>
            <div className="h-full flex flex-col">
              <div className="flex items-center space-x-1.5 mb-2">
                <span className="text-lg">📢</span>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Duyurular</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-indigo-400 dark:bg-indigo-600 blur-lg opacity-20 animate-pulse"></div>
                    <div className="relative text-4xl font-bold bg-gradient-to-br from-indigo-600 to-violet-800 dark:from-indigo-400 dark:to-violet-600 bg-clip-text text-transparent animate-fadeIn">
                      {filteredAnnouncements.length}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">Aktif Duyuru</p>
                  <div className="flex items-center justify-center space-x-1 text-[10px] text-green-600 dark:text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span>Yayında</span>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      );

    case 'announcements_list':
      return (
        <div key="announcements_list" className="md:col-span-2 md:row-span-1">
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
              <div className="flex-1 grid grid-cols-1 gap-1.5 overflow-y-auto scrollbar-hide max-h-[450px]">
                {filteredAnnouncements.length === 0 ? (
                  <div className="flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
                    <p>Duyuru bulunamadı</p>
                  </div>
                ) : (
                  filteredAnnouncements.map((announcement) => {
                    return (
                      <div
                        key={announcement.id}
                        onClick={() => onAnnouncementClick?.(announcement)}
                        className="p-2 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:shadow-sm hover:scale-[1.01] hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer group"
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
              {userInfo.userRole === 'admin' && (
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-2">
                  <button
                    onClick={() => onAddAnnouncementClick?.()}
                    className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center space-x-1"
                  >
                    <span>+</span>
                    <span>Yeni Duyuru Ekle</span>
                  </button>
                </div>
              )}
            </div>
          </BentoCard>
        </div>
      );

    default:
      return null;
  }
};

