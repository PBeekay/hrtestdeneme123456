import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from '../ui/DarkModeToggle';
import SearchBar from '../ui/SearchBar';
import StatCard from '../ui/StatCard';
import { renderWidget } from '../widgets/WidgetRenderer';
import { DashboardData, Task } from '../../types';
import { formatDate, getPriorityColor, getPriorityIcon } from '../../utils/helpers';
import api from '../../services/api';
import {
  Ticket,
  Users,
  LogOut,
  Activity,
  Calendar,
  Bell,
  X,
  Edit2,
  Trash2,
  Megaphone,
  AlertTriangle,
  PartyPopper,
  RefreshCw
} from 'lucide-react';

const DEFAULT_WIDGET_ORDER = [
  'leave',
  'announcements_mini',
  'performance',
  'calendar',
  'announcements_list',
  'assets',
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
  const { userInfo, leaveBalance, pendingTasks, announcements } = dashboardData;
  const employeeCount = dashboardData.employeeStats?.totalEmployees;
  const canOpenEmployeeHub = Boolean(employeeCount || (dashboardData.employees && dashboardData.employees.length > 0));
  const isAdmin = userInfo.userRole === 'admin';

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    description: '',
    category: 'Genel',
    announcement_date: new Date().toISOString().split('T')[0],
  });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [calendarEventForm, setCalendarEventForm] = useState({
    title: '',
    description: '',
    type: 'event' as 'event' | 'announcement' | 'holiday',
  });
  const [submittingCalendarEvent, setSubmittingCalendarEvent] = useState(false);

  const handleNavigateToLeaves = () => navigate('/leave');
  const handleNavigateToEmployees = () => navigate('/employees');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAnnouncement) {
          setSelectedAnnouncement(null);
        }
        if (selectedCalendarDate) {
          setSelectedCalendarDate(null);
        }
        if (showAnnouncementForm) {
          setShowAnnouncementForm(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedAnnouncement, selectedCalendarDate, showAnnouncementForm]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim()) {
      addToast('Lütfen duyuru başlığı girin', 'warning');
      return;
    }

    setSubmittingAnnouncement(true);
    try {
      let result;
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5); // HH:MM
      const datePart = announcementForm.announcement_date || now.toISOString().split('T')[0];

      const payload = {
        title: announcementForm.title,
        content: announcementForm.description,
        category: announcementForm.category,
        announcement_date: `${datePart} ${timeString}`,
      };

      if (editingAnnouncementId) {
        result = await api.updateAnnouncement(editingAnnouncementId, payload);
      } else {
        result = await api.createAnnouncement(payload);
      }

      if (result.status === 200 || result.status === 201 || (result as any).success) {
        addToast(editingAnnouncementId ? 'Duyuru güncellendi' : 'Duyuru başarıyla oluşturuldu', 'success');
        setShowAnnouncementForm(false);
        setAnnouncementForm({ title: '', description: '', category: 'Genel', announcement_date: new Date().toISOString().split('T')[0] });
        setEditingAnnouncementId(null);
        setEditingAnnouncementId(null);
        window.location.reload();
      } else {
        addToast(result.error || (editingAnnouncementId ? 'Duyuru güncellenemedi' : 'Duyuru oluşturulamadı'), 'error');
      }
    } catch (error) {
      addToast(editingAnnouncementId ? 'Duyuru güncellenirken hata oluştu' : 'Duyuru oluşturulurken hata oluştu', 'error');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-3 md:p-6 transition-colors duration-150">
      <div className="max-w-7xl mx-auto">
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
                  Hoş geldin, <span className="font-semibold text-slate-700 dark:text-slate-400">{userInfo.name.split(' ')[0]}</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg shadow-sm border-2 border-white dark:border-neutral-700">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mr-2 whitespace-nowrap hidden md:block">
                {formatDate(currentTime)}
              </span>
              <div className="w-full md:w-64">
                <SearchBar onSearch={handleSearch} />
              </div>
              <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar Actions */}
          <aside className="w-full md:w-48 flex-shrink-0">
            <div className="sticky top-6 flex flex-col gap-3">
              <button
                onClick={handleNavigateToLeaves}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow group flex items-center justify-start space-x-3"
                title="İzin Yönetimi"
              >
                <Ticket className="w-5 h-5 text-neutral-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                <span>İzinler</span>
              </button>

              {((dashboardData.userInfo.userRole === 'admin') || (dashboardData.userInfo.role && dashboardData.userInfo.role.includes('İK'))) && (
                <button
                  onClick={handleNavigateToEmployees}
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow group flex items-center justify-start space-x-3"
                  title="Çalışan Yönetim Paneli"
                >
                  <Users className="w-5 h-5 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span>Çalışan Paneli</span>
                </button>
              )}

              <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1 mx-2"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-900/10 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow group flex items-center justify-start space-x-3"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                <span>Çıkış</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <StatCard
                icon={<Activity className="w-6 h-6 text-emerald-500" />}
                label="Aktif Görevler"
                value={activeTasks.length}
                delay={150}
                trend={activeTasks.length < pendingTasks.length ? 'down' : 'neutral'}
                trendValue={activeTasks.length < pendingTasks.length ? `${completedTasks.size} tamamlandı` : ''}
              />
              <StatCard
                icon={<Calendar className="w-6 h-6 text-blue-500" />}
                label="İzin Günleri"
                value={leaveBalance.annual + leaveBalance.sick + leaveBalance.personal}
                delay={200}
              />
              <StatCard
                icon={<Users className="w-6 h-6 text-purple-500" />}
                label="Çalışanlar"
                value={employeeCount ?? '—'}
                delay={225}
                onClick={canOpenEmployeeHub ? handleNavigateToEmployees : undefined}
                ctaLabel={canOpenEmployeeHub ? 'Yönet' : undefined}
                disabled={!canOpenEmployeeHub}
                ariaLabel={canOpenEmployeeHub ? 'Çalışan yönetim merkezini aç' : undefined}
              />
              <StatCard
                icon={<Megaphone className="w-6 h-6 text-amber-500" />}
                label="Duyurular"
                value={announcements.length}
                delay={250}
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
                onCalendarDateSelect: (date) => setSelectedCalendarDate(date),
                onAnnouncementClick: (announcement: any) => setSelectedAnnouncement(announcement),
                onAddAnnouncementClick: () => {
                  setEditingAnnouncementId(null);
                  setAnnouncementForm({ title: '', description: '', category: 'Genel', announcement_date: new Date().toISOString().split('T')[0] });
                  setShowAnnouncementForm(true);
                },
                onAnnouncementEdit: (announcement: any) => {
                  setEditingAnnouncementId(announcement.id);
                  setAnnouncementForm({
                    title: announcement.title,
                    description: announcement.description || '',
                    category: announcement.category,
                    announcement_date: announcement.date ? announcement.date.split(' ')[0] : new Date().toISOString().split('T')[0],
                  });
                  setShowAnnouncementForm(true);
                },
                onAnnouncementDelete: (id: number) => setShowDeleteConfirm(id),
              }))}
            </div>
          </div>
        </div>
      </div>   {/* Announcement Detail Modal */}
      {
        selectedAnnouncement && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                      {selectedAnnouncement.category}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {selectedAnnouncement.date}
                    </span>
                    {selectedAnnouncement.author_name && (
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        📝 {selectedAnnouncement.author_name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {selectedAnnouncement.title}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(null);
                          setEditingAnnouncementId(selectedAnnouncement.id);
                          setAnnouncementForm({
                            title: selectedAnnouncement.title,
                            description: selectedAnnouncement.description || '',
                            category: selectedAnnouncement.category,
                            announcement_date: selectedAnnouncement.date ? selectedAnnouncement.date.split(' ')[0] : new Date().toISOString().split('T')[0],
                          });
                          setShowAnnouncementForm(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors"
                        title="Düzenle"
                      >
                        <span className="text-lg"><Edit2 className="w-4 h-4" /></span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(selectedAnnouncement.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                        title="Sil"
                      >
                        <span className="text-lg"><Trash2 className="w-4 h-4" /></span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="ml-2 w-10 h-10 flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label="Kapat"
                  >
                    <span className="text-xl"><X className="w-5 h-5" /></span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {selectedAnnouncement.description || 'Bu duyuru için detaylı açıklama bulunmamaktadır.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Duyuru Tarihi: {selectedAnnouncement.date}
                  </span>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[110] flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <div
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-sm w-full p-6 text-center transform transition-all scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Duyuruyu Sil
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 font-medium transition-colors"
                >
                  Hayır, İptal
                </button>
                <button
                  onClick={async () => {
                    if (showDeleteConfirm) {
                      try {
                        const result = await api.deleteAnnouncement(showDeleteConfirm);
                        if (result.status === 200) {
                          addToast('Duyuru başarıyla silindi', 'success');
                          setShowDeleteConfirm(null);
                          setSelectedAnnouncement(null);
                          window.location.reload();
                        } else {
                          addToast('Duyuru silinemedi', 'error');
                        }
                      } catch (error) {
                        addToast('Bir hata oluştu', 'error');
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium shadow-sm transition-colors"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Announcement Create Modal */}
      {
        showAnnouncementForm && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => {
              setShowAnnouncementForm(false);
              setAnnouncementForm({ title: '', description: '', category: 'Genel', announcement_date: new Date().toISOString().split('T')[0] });
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {editingAnnouncementId ? <span className="flex items-center gap-2"><Edit2 className="w-6 h-6" /> Duyuru Düzenle</span> : <span className="flex items-center gap-2"><Megaphone className="w-6 h-6" /> Yeni Duyuru Oluştur</span>}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Duyurunun tüm detaylarını doldurun
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAnnouncementForm(false);
                    setAnnouncementForm({ title: '', description: '', category: 'Genel', announcement_date: new Date().toISOString().split('T')[0] });
                  }}
                  className="ml-4 w-10 h-10 flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
                  aria-label="Kapat"
                >
                  <span className="text-xl"><X className="w-5 h-5" /></span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateAnnouncement} className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Duyuru Başlığı *
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Şirket toplantısı, önemli duyuru..."
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-md border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Kategori *
                  </label>
                  <select
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-md border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="Genel">📢 Genel</option>
                    <option value="Önemli">⚠️ Önemli</option>
                    <option value="Etkinlik">🎉 Etkinlik</option>
                    <option value="Güncelleme">🔄 Güncelleme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Duyuru Tarihi *
                  </label>
                  <input
                    type="date"
                    value={announcementForm.announcement_date}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, announcement_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-md border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Duyuru İçeriği
                  </label>
                  <textarea
                    placeholder="Duyurunun detaylı açıklamasını buraya yazın..."
                    value={announcementForm.description}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-3 rounded-md border border-stone-200 dark:border-neutral-700 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setAnnouncementForm({ title: '', description: '', category: 'Genel', announcement_date: new Date().toISOString().split('T')[0] });
                    }}
                    className="flex-1 px-4 py-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-md transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAnnouncement}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-md transition-all duration-150 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingAnnouncement ? 'Kaydediliyor...' : (editingAnnouncementId ? '💾 Değişiklikleri Kaydet' : '📢 Duyuruyu Yayınla')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Calendar Event Modal */}
      {
        selectedCalendarDate && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedCalendarDate(null)}
          >
            <div
              className="bg-stone-50 dark:bg-neutral-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeInUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Tarih Seçildi
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {selectedCalendarDate?.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="ml-4 w-10 h-10 flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
                  aria-label="Kapat"
                >
                  <span className="text-xl"><X className="w-5 h-5" /></span>
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {isAdmin ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!calendarEventForm.title.trim()) {
                      addToast('Lütfen başlık girin', 'warning');
                      return;
                    }

                    setSubmittingCalendarEvent(true);
                    try {
                      // TODO: API call to create calendar event
                      addToast('Etkinlik ekleme özelliği yakında eklenecek', 'info');
                      setSelectedCalendarDate(null);
                      setCalendarEventForm({ title: '', description: '', type: 'event' });
                    } catch (error) {
                      addToast('Etkinlik eklenirken hata oluştu', 'error');
                    } finally {
                      setSubmittingCalendarEvent(false);
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Etkinlik Türü
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['event', 'announcement', 'holiday'] as const).map((type) => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setCalendarEventForm(prev => ({ ...prev, type }))}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${calendarEventForm.type === type
                              ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-lg'
                              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                              }`}
                          >
                            {type === 'event' ? <span className="flex items-center justify-center gap-1"><Calendar className="w-4 h-4" /> Etkinlik</span> : type === 'announcement' ? <span className="flex items-center justify-center gap-1"><Megaphone className="w-4 h-4" /> Duyuru</span> : <span className="flex items-center justify-center gap-1"><PartyPopper className="w-4 h-4" /> Resmi Tatil</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Başlık *
                      </label>
                      <input
                        type="text"
                        value={calendarEventForm.title}
                        onChange={(e) => setCalendarEventForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-neutral-700 bg-stone-50/90 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                        placeholder="Etkinlik başlığı"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Açıklama
                      </label>
                      <textarea
                        value={calendarEventForm.description}
                        onChange={(e) => setCalendarEventForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none"
                        placeholder="Etkinlik açıklaması (opsiyonel)"
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="submit"
                        disabled={submittingCalendarEvent}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingCalendarEvent ? 'Ekleniyor...' : 'Etkinlik Ekle'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCalendarDate(null);
                          setCalendarEventForm({ title: '', description: '', type: 'event' });
                        }}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-lg transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Bu tarih için etkinlik eklemek için yönetici yetkisi gereklidir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default DashboardView;

