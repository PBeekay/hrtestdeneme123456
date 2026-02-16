import React, { useState } from 'react';
import { DashboardData } from '../types';
import { useNavigate } from 'react-router-dom';
import LeaveManagementPage from './LeaveManagementPage';
import AnnouncementModal from '../components/dashboard/AnnouncementModal';
import AnnouncementDetailModal from '../components/dashboard/AnnouncementDetailModal';

interface ModernDashboardProps {
    dashboardData: DashboardData;
    currentTime: Date;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    handleLogout: () => void;
    addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({
    dashboardData,
    currentTime,
    isDarkMode,
    toggleDarkMode,
    handleLogout,
    addToast,
}) => {
    const navigate = useNavigate();
    // const [viewId, setViewId] = useState<'dashboard' | 'people' | 'hiring' | 'leave'>('dashboard');
    // const [viewId, setViewId] = useState<'dashboard' | 'people' | 'hiring' | 'leave'>('dashboard');
    const [viewId, setViewId] = useState<'dashboard' | 'hiring' | 'leave'>('dashboard');
    // const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBirthdayModal, setShowBirthdayModal] = useState(false);

    // Agenda Detail Modal State
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null); // For Edit Mode

    const handleAnnouncementClick = (announcement: any) => {
        setSelectedAnnouncement(announcement);
        setShowDetailModal(true);
    };

    const { userInfo, employeeStats, employees, leaveRequests } = dashboardData;

    // Calculate pending leave requests
    const pendingLeavesCount = leaveRequests?.filter(req => req.status === 'pending').length || 0;

    const switchView = (id: 'dashboard' | 'hiring' | 'leave') => {
        setViewId(id);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Placeholder data for birthdays - will be replaced with real data when backend supports it
    const upcomingBirthdays = 0;

    // --- CALENDAR FEATURES ---
    // --- CALENDAR FEATURES ---
    interface CalendarEvent {
        id: number;
        date: number; // simple day number for current month demo
        type: 'note' | 'meeting' | 'high' | 'medium' | 'normal';
        text: string;
        time?: string;
    }

    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
        { id: 1, date: new Date().getDate(), type: 'meeting', text: 'Haftalık Toplantı', time: '14:00' }, // Sample for today
    ]);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [newEventText, setNewEventText] = useState('');
    const [newEventTime, setNewEventTime] = useState('09:00');
    const [newEventType, setNewEventType] = useState<'note' | 'high' | 'medium' | 'normal'>('normal');

    const handleDayClick = (day: number | null) => {
        if (!day) return;
        setSelectedDate(day);
        setShowDayModal(true);
        setNewEventText('');
        setNewEventTime('09:00');
        setNewEventType('normal');
    };

    const handleAddEvent = () => {
        if (!selectedDate || !newEventText.trim()) return;

        const newEvent: CalendarEvent = {
            id: Date.now(),
            date: selectedDate,
            type: newEventType,
            text: newEventText,
            time: newEventTime
        };

        setCalendarEvents([...calendarEvents, newEvent]);
        setNewEventText('');
        addToast('Etkinlik başarıyla eklendi.', 'success');
    };


    const deleteEvent = (id: number) => {
        setCalendarEvents(calendarEvents.filter(e => e.id !== id));
        addToast('Kayıt silindi.', 'info');
    };

    const getEventsForDay = (day: number) => {
        return calendarEvents.filter(e => e.date === day);
    };

    // Calendar Logic
    const getCalendarDays = () => {
        const year = currentTime.getFullYear();
        const month = currentTime.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start (Turkish standard)
        // Sunday (0) becomes 6, Monday (1) becomes 0
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const calendarDays = getCalendarDays();
    const weekDays = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];
    const currentDay = currentTime.getDate();

    return (
        <div className="text-slate-600 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-[#f8fafc] flex-1">

            {/* MAIN CONTENT CONTAINER */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

                {/* VIEW: DASHBOARD */}
                {
                    viewId === 'dashboard' && (
                        <div className="animate-fadeInUp space-y-8">
                            {/* Hero Section */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-10 shadow-xl shadow-blue-200">
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div className="max-w-2xl w-full">
                                        <p className="text-blue-100 font-medium mb-2">Günaydın, {userInfo.name.split(' ')[0]}</p>
                                        <h1 className="text-2xl md:text-3xl font-bold mb-6">Bugün ne yapmak istersiniz?</h1>

                                        {/* Command Bar */}
                                        <div className="relative group max-w-lg z-50">
                                            <div className="bg-white p-1.5 pl-3 rounded-xl shadow-lg flex items-center gap-3 transition-transform focus-within:scale-[1.01]">
                                                <div className="text-slate-400">
                                                    <i className="fa-solid fa-magnifying-glass text-md"></i>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Çalışan, departman veya işlem ara..."
                                                    className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 h-9 text-sm"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onFocus={() => setSearchQuery(searchQuery)}
                                                />
                                                <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                                                    Ara
                                                </button>
                                            </div>

                                            {/* Search Dropdown Results */}
                                            {searchQuery.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                                                    {/* Local filtered results */}
                                                    {(() => {
                                                        const results = {
                                                            employees: employees?.filter(emp =>
                                                                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                emp.role.toLowerCase().includes(searchQuery.toLowerCase())
                                                            ) || [],
                                                            announcements: dashboardData.announcements?.filter((ann: any) =>
                                                                ann.title.toLowerCase().includes(searchQuery.toLowerCase())
                                                            ) || []
                                                        };

                                                        const hasResults = results.employees.length > 0 || results.announcements.length > 0;

                                                        if (!hasResults) {
                                                            return (
                                                                <div className="p-4 text-center text-slate-400 text-sm">
                                                                    Sonuç bulunamadı.
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="max-h-80 overflow-y-auto">
                                                                {/* Employees Section */}
                                                                {results.employees.length > 0 && (
                                                                    <div className="p-2">
                                                                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Çalışanlar</div>
                                                                        {results.employees.slice(0, 3).map(emp => (
                                                                            <div
                                                                                key={emp.id}
                                                                                onClick={() => { navigate('/employees'); setSearchQuery(''); }}
                                                                                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                                                            >
                                                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                                                    {getInitials(emp.name)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-slate-700">{emp.name}</div>
                                                                                    <div className="text-xs text-slate-400">{emp.role}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {results.employees.length > 0 && results.announcements.length > 0 && (
                                                                    <div className="border-t border-slate-50 mx-2"></div>
                                                                )}

                                                                {/* Announcements Section */}
                                                                {results.announcements.length > 0 && (
                                                                    <div className="p-2">
                                                                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Duyurular</div>
                                                                        {results.announcements.slice(0, 3).map((ann: any) => (
                                                                            <div
                                                                                key={ann.id}
                                                                                onClick={() => { handleAnnouncementClick(ann); setSearchQuery(''); }}
                                                                                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                                                            >
                                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${ann.category === 'Etkinlik' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                                    <i className={`fa-solid ${ann.category === 'Etkinlik' ? 'fa-calendar-day' : 'fa-bullhorn'}`}></i>
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <div className="text-sm font-medium text-slate-700 truncate">{ann.title}</div>
                                                                                    <div className="text-xs text-slate-400 truncate">{ann.date}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 mt-6 text-sm text-blue-100/80">
                                            <span><i className="fa-solid fa-arrow-trend-up mr-2"></i><strong>{employeeStats?.onboarding || 0}</strong> Yeni Başlayan</span>
                                            <span
                                                className="cursor-pointer hover:text-white transition-colors"
                                                onClick={() => setShowBirthdayModal(true)}
                                            >
                                                <i className="fa-solid fa-cake-candles mr-2"></i><strong>{upcomingBirthdays}</strong> Yaklaşan Doğum Günü
                                            </span>
                                        </div>

                                        {/* Smart Chips - Quick Actions */}
                                        <div className="flex flex-wrap gap-3 mt-6">
                                            <button
                                                onClick={() => navigate('/employees/new')}
                                                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                                            >
                                                <i className="fa-solid fa-user-plus text-xs"></i>
                                                Personel Ekle
                                            </button>

                                            <button
                                                onClick={() => switchView('leave')}
                                                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 hover:scale-105 active:scale-95 relative"
                                            >
                                                <i className="fa-solid fa-plane-departure text-xs"></i>
                                                İzin Talep Et
                                                {pendingLeavesCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center border border-white">
                                                        {pendingLeavesCount}
                                                    </span>
                                                )}
                                            </button>

                                            {userInfo.userRole === 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        setEditingAnnouncement(null);
                                                        setShowAnnouncementModal(true);
                                                    }}
                                                    className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                                                >
                                                    <i className="fa-solid fa-bullhorn text-xs"></i>
                                                    Duyuru Yap
                                                </button>
                                            )}

                                            <button
                                                className="bg-slate-800/10 text-blue-100/50 backdrop-blur-md border border-white/5 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 cursor-not-allowed grayscale hover:grayscale-0 transition-all group relative overflow-hidden"
                                            >
                                                <i className="fa-solid fa-chart-pie text-xs"></i>
                                                Raporlar
                                                <i className="fa-solid fa-lock text-[10px] ml-1 opacity-70 group-hover:text-amber-400 group-hover:scale-110 transition-all"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mini Calendar Widget */}
                                    <div className="hidden md:flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[260px] max-w-[280px]">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-white text-sm">
                                                {currentTime.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs text-white">
                                                <i className="fa-regular fa-calendar"></i>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                            {weekDays.map((day) => (
                                                <div key={day} className="text-[10px] text-blue-200 font-medium">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center">
                                            {calendarDays.map((day, index) => {
                                                const dayEvents = day ? getEventsForDay(day) : [];
                                                // Updated logic for dots based on priority/type
                                                const hasHigh = dayEvents.some(e => e.type === 'high');
                                                const hasMedium = dayEvents.some(e => e.type === 'medium');
                                                const hasNormal = dayEvents.some(e => e.type === 'normal');
                                                const hasNote = dayEvents.some(e => e.type === 'note' || e.type === 'meeting');

                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleDayClick(day)}
                                                        className={`
                                                            h-8 w-8 flex flex-col items-center justify-center rounded-lg text-xs transition-all relative group
                                                            ${day === null ? 'invisible' : ''}
                                                            ${day === currentDay
                                                                ? 'bg-white text-blue-600 font-bold shadow-md transform scale-105'
                                                                : 'text-white/90 hover:bg-white/20 cursor-pointer hover:scale-105'}
                                                        `}
                                                    >
                                                        <span>{day}</span>
                                                        {day && dayEvents.length > 0 && (
                                                            <div className="flex gap-0.5 mt-0.5">
                                                                {hasHigh && <span className="w-1 h-1 rounded-full bg-red-400"></span>}
                                                                {hasMedium && <span className="w-1 h-1 rounded-full bg-yellow-400"></span>}
                                                                {hasNormal && <span className="w-1 h-1 rounded-full bg-green-400"></span>}
                                                                {!hasHigh && !hasMedium && !hasNormal && hasNote && <span className="w-1 h-1 rounded-full bg-blue-300"></span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Circle */}
                                <div className="absolute -right-20 -top-40 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                            </div>

                            {/* CLASSIC ADMIN LAYOUT */}
                            {/* 1. Top Stats Row (4 Columns) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Card 1: New Employees */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                                        <i className="fa-solid fa-users"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Toplam Çalışan</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{employeeStats?.totalEmployees || 0}</h3>
                                    </div>
                                </div>

                                {/* Card 2: On Leave */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl">
                                        <i className="fa-solid fa-plane-departure"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">İzinli Personel</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{employeeStats?.onLeave || 0}</h3>
                                    </div>
                                </div>

                                {/* Card 3: New Hires / Pending */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                                        <i className="fa-solid fa-user-check"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Yeni Başlayanlar</p>
                                        <h3 className="text-2xl font-bold text-slate-800">{employeeStats?.onboarding || 0}</h3>
                                    </div>
                                </div>

                                {/* Card 4: Open Positions (Reflecting Hiring View) */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-2 right-2 text-slate-300">
                                        <i className="fa-solid fa-lock text-xs"></i>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                        <i className="fa-solid fa-briefcase"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Açık Pozisyon</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-2xl font-bold text-slate-800 blur-[2px] select-none">4</h3>
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">PRO</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Main Content Split */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Content: Activity Feed (Span 2) */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
                                    <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                            <i className="fa-regular fa-calendar-check text-slate-400"></i>
                                            Şirket Gündemi
                                        </h3>
                                        <button className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Tümünü Gör</button>
                                    </div>

                                    {/* Clean List */}
                                    <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                                        {dashboardData.announcements && dashboardData.announcements.length > 0 ? dashboardData.announcements.map((announcement: any, index: number) => (
                                            <div key={announcement.id || index} onClick={() => handleAnnouncementClick(announcement)} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer items-center">
                                                {/* Icon Box */}
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${announcement.category === 'Etkinlik' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <i className={`fa-solid ${announcement.category === 'Etkinlik' ? 'fa-calendar-day' : 'fa-bullhorn'} text-sm`}></i>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <h4 className="font-semibold text-slate-700 text-sm group-hover:text-blue-600 transition-colors truncate">{announcement.title}</h4>
                                                    </div>
                                                    <p className="text-sm text-slate-500 line-clamp-1">{announcement.description || announcement.content}</p>
                                                </div>

                                                {/* Right Aligned Date */}
                                                <div className="text-right flex-shrink-0">
                                                    <span className="block text-xs font-bold text-slate-700">
                                                        {(() => {
                                                            if (!announcement.date) return '';
                                                            // Check if legacy mock format "29 OCA"
                                                            if (!announcement.date.includes('-') && !announcement.date.includes(':')) {
                                                                return announcement.date;
                                                            }
                                                            // Parse "YYYY-MM-DD HH:mm"
                                                            try {
                                                                const dateObj = new Date(announcement.date.replace(' ', 'T'));
                                                                if (isNaN(dateObj.getTime())) return announcement.date;

                                                                const formatter = new Intl.DateTimeFormat('tr-TR', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                    weekday: 'long',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                });
                                                                return formatter.format(dateObj);
                                                            } catch (e) {
                                                                return announcement.date;
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-10 flex flex-col items-center justify-center h-full text-slate-400">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                    <i className="fa-regular fa-calendar-xmark text-lg"></i>
                                                </div>
                                                <p className="text-sm font-medium">Planlanmış bir gündem yok.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Content: Quick Actions / Calendar (Span 1) */}
                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-bolt text-amber-500"></i> Hızlı İşlemler
                                        </h3>
                                        <div className="space-y-3">
                                            <button onClick={() => navigate('/employees/new')} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group border border-transparent hover:border-slate-100">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <i className="fa-solid fa-user-plus text-xs"></i>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-semibold text-slate-700">Personel Ekle</span>
                                                    <span className="block text-xs text-slate-400">Yeni kayıt oluştur</span>
                                                </div>
                                            </button>

                                            <button onClick={() => switchView('leave')} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group border border-transparent hover:border-slate-100">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <i className="fa-solid fa-plane-departure text-xs"></i>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-semibold text-slate-700">İzin Talebi</span>
                                                    <span className="block text-xs text-slate-400">İzin al veya onayla</span>
                                                </div>
                                            </button>

                                            <button className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group border border-transparent hover:border-slate-100 relative overflow-hidden cursor-not-allowed opacity-75">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <i className="fa-solid fa-file-invoice text-xs"></i>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        Bordro Görüntüle
                                                        <i className="fa-solid fa-lock text-[10px] text-amber-500"></i>
                                                    </span>
                                                    <span className="block text-xs text-slate-400">Son maaş bordrosu</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Small Birthday Widget */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-white">Doğum Günleri</h3>
                                                <i className="fa-solid fa-cake-candles text-white/50"></i>
                                            </div>
                                            <p className="text-white/90 text-sm mb-4">Bu ay doğum günü olan çalışanları kutlamayı unutmayın!</p>
                                            <button onClick={() => setShowBirthdayModal(true)} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full">
                                                Listeyi Gör
                                            </button>
                                        </div>
                                        <div className="absolute -bottom-4 -right-4 text-9xl text-white/10 rotate-12">
                                            <i className="fa-solid fa-gift"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )
                }

                {/* VIEW: PEOPLE - REMOVED, NAVIGATES TO /employees */}

                {/* VIEW: HIRING */}
                {
                    viewId === 'hiring' && (
                        <div className="animate-fadeInUp space-y-8">
                            {/* Header */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800">İşe Alım ve Aday Takibi</h1>
                                    <p className="text-slate-500 mt-2">Açık pozisyonları ve aday başvurularını yönetin.</p>
                                </div>
                                <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
                                    <i className="fa-solid fa-plus"></i> Yeni İlan Oluştur
                                </button>
                            </div>

                            {/* Top Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                            <i className="fa-solid fa-briefcase text-xl"></i>
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">Aktif İlanlar</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-800">4</h2>
                                    <p className="text-slate-500 font-medium mt-1">Açık Pozisyon</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <i className="fa-solid fa-users-viewfinder text-xl"></i>
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">Toplam Başvuru</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-800">18</h2>
                                    <p className="text-slate-500 font-medium mt-1">Aktif Aday</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                            <i className="fa-solid fa-calendar-day text-xl"></i>
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">Bugün</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-800">2</h2>
                                    <p className="text-slate-500 font-medium mt-1">Mülakat Planlandı</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Job Openings List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <h3 className="font-bold text-lg text-slate-800">Açık Pozisyonlar</h3>
                                    <div className="space-y-4">
                                        {[
                                            { title: "Senior Frontend Developer", dept: "Yazılım", type: "Tam Zamanlı", loc: "Uzaktan", candidates: 8, status: "Aktif" },
                                            { title: "Product Manager", dept: "Ürün Yönetimi", type: "Tam Zamanlı", loc: "Ofis", candidates: 5, status: "Aktif" },
                                            { title: "UX Designer", dept: "Tasarım", type: "Yarı Zamanlı", loc: "Hibrit", candidates: 3, status: "Aktif" },
                                            { title: "Sales Specialist", dept: "Satış", type: "Tam Zamanlı", loc: "Ofis", candidates: 2, status: "Değerlendirmede" },
                                        ].map((job, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all group cursor-pointer flex justify-between items-center shadow-sm">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold border border-slate-100">
                                                        {job.title[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                            <span><i className="fa-solid fa-code-branch mr-1"></i> {job.dept}</span>
                                                            <span><i className="fa-solid fa-briefcase mr-1"></i> {job.type}</span>
                                                            <span><i className="fa-solid fa-location-dot mr-1"></i> {job.loc}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right hidden sm:block">
                                                        <div className="font-bold text-slate-800">{job.candidates}</div>
                                                        <div className="text-xs text-slate-400">Aday</div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${job.status === 'Aktif' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {job.status}
                                                    </span>
                                                    <button className="text-slate-300 hover:text-slate-500">
                                                        <i className="fa-solid fa-chevron-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Applicants */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-lg text-slate-800">Son Başvurular</h3>
                                        <button className="text-xs text-blue-600 font-semibold hover:underline">Tümünü Gör</button>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { name: "Ayşe Yılmaz", role: "Frontend Dev", date: "2 saat önce", status: "Yeni" },
                                            { name: "Mehmet Demir", role: "UX Designer", date: "5 saat önce", status: "İnceleniyor" },
                                            { name: "Canan Kara", role: "Product Mgr", date: "1 gün önce", status: "Mülakat" },
                                            { name: "Burak Öz", role: "Sales Spec", date: "2 gün önce", status: "Yeni" },
                                        ].map((applicant, idx) => (
                                            <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                                                <img src={`https://ui-avatars.com/api/?name=${applicant.name}&background=random`} className="w-10 h-10 rounded-full" alt="" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{applicant.name}</h4>
                                                    <p className="text-xs text-slate-500">{applicant.role}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`block text-[10px] font-bold px-2 py-0.5 rounded ${applicant.status === 'Yeni' ? 'bg-blue-50 text-blue-600' :
                                                        applicant.status === 'İnceleniyor' ? 'bg-purple-50 text-purple-600' :
                                                            'bg-orange-50 text-orange-600'
                                                        }`}>{applicant.status}</span>
                                                    <span className="text-[10px] text-slate-400 mt-0.5 block">{applicant.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Aday Havuzuna Git
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* VIEW: LEAVE */}
                {
                    viewId === 'leave' && (
                        <div className="animate-fadeInUp">
                            <LeaveManagementPage
                                leaveBalance={dashboardData.leaveBalance}
                                employeeRequests={dashboardData.leaveRequests}
                                userRole={dashboardData.userInfo.userRole}
                                onBack={() => switchView('dashboard')}
                                addToast={addToast}
                            />
                        </div>
                    )
                }


            </main >

            {/* BIRTHDAY MODAL */}
            {
                showBirthdayModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 animate-[fadeIn_0.3s_ease-out]" onClick={() => setShowBirthdayModal(false)}>
                        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 transform transition-all duration-300 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Doğum Günleri</h3>
                                <button onClick={() => setShowBirthdayModal(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-orange-400 mb-3">
                                    <i className="fa-solid fa-cake-candles text-2xl"></i>
                                </div>
                                <p className="text-slate-600 font-medium">Yaklaşan doğum günü bulunmamaktadır.</p>
                                <p className="text-slate-400 text-sm mt-1">Takvimde kayıtlı doğum günü yok.</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DAY MANAGEMENT MODAL */}
            {
                showDayModal && selectedDate && (
                    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowDayModal(false)}>
                        <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out] flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white relative h-40 flex items-end justify-between overflow-hidden">
                                {/* Abstract Shapes for Professional Look */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>

                                <div className="relative z-10">
                                    <div className="flex items-baseline gap-3">
                                        <h3 className="text-5xl font-bold tracking-tight">{selectedDate}</h3>
                                        <span className="text-xl text-slate-300 font-light uppercase tracking-widest">
                                            {currentTime.toLocaleDateString('tr-TR', { month: 'long' })}
                                        </span>
                                        <span className="text-slate-500 font-light text-lg">
                                            {currentTime.getFullYear()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-blue-200/80 text-sm font-medium">
                                        <i className="fa-regular fa-calendar-check"></i>
                                        <span>İK Yönetici Ajandası</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDayModal(false)}
                                    className="relative z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/5 flex items-center justify-center text-white transition-all hover:rotate-90"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8 flex-1 overflow-y-auto">
                                {/* Add New Section */}
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-plus-circle text-blue-500"></i>
                                        Yeni Kayıt Ekle
                                    </h4>
                                    <div className="flex flex-col md:flex-row gap-5">
                                        {/* Left Side: Type & Time */}
                                        <div className="w-full md:w-1/3 space-y-4">
                                            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                                <button
                                                    onClick={() => setNewEventType('high')}
                                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${newEventType === 'high' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                                    title="Yüksek Önem"
                                                >
                                                    <i className="fa-solid fa-circle-exclamation"></i> Yüksek
                                                </button>
                                                <button
                                                    onClick={() => setNewEventType('medium')}
                                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${newEventType === 'medium' ? 'bg-yellow-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                                    title="Orta Önem"
                                                >
                                                    <i className="fa-solid fa-circle"></i> Orta
                                                </button>
                                                <button
                                                    onClick={() => setNewEventType('normal')}
                                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${newEventType === 'normal' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                                    title="Normal"
                                                >
                                                    <i className="fa-solid fa-check-circle"></i> Normal
                                                </button>
                                            </div>
                                            {/* Note Button separate row or integrated? Let's keep it integrated but maybe as a toggle? Or just another button. */}
                                            {/* User wanted Red/Yellow/Green. 'Note' (Blue) is legacy but useful. Let's add Note as a 4th option below or in the group. Space is tight. */}
                                            {/* Let's put Note in a separate small row or make grid 2x2. */}
                                            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                                <button
                                                    onClick={() => setNewEventType('note')}
                                                    className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${newEventType === 'note' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    <i className="fa-solid fa-note-sticky"></i> Not / Diğer
                                                </button>
                                            </div>

                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <i className="fa-regular fa-clock text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
                                                </div>
                                                <input
                                                    type="time"
                                                    value={newEventTime}
                                                    onChange={(e) => setNewEventTime(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Side: Text & Submit */}
                                        <div className="flex-1 flex flex-col gap-3">
                                            <textarea
                                                value={newEventText}
                                                onChange={(e) => setNewEventText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddEvent())}
                                                placeholder={newEventType === 'note' ? "Görüşme notları, hatırlatmalar..." : "Etkinlik detayları..."}
                                                className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-sm min-h-[120px]"
                                            />
                                            <button
                                                onClick={handleAddEvent}
                                                disabled={!newEventText.trim()}
                                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                                            >
                                                <i className="fa-solid fa-check"></i> Ekle
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Events List */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <i className="fa-solid fa-list-check text-blue-500"></i>
                                            Bugünün Ajandası
                                        </h4>
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                            {getEventsForDay(selectedDate).length} Kayıt
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {getEventsForDay(selectedDate).length > 0 ? (
                                            getEventsForDay(selectedDate).map((event) => (
                                                <div key={event.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 
                                                        ${event.type === 'note' ? 'bg-slate-100 text-slate-600' :
                                                            event.type === 'high' ? 'bg-red-100 text-red-600' :
                                                                event.type === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                                                    event.type === 'normal' ? 'bg-green-100 text-green-600' :
                                                                        'bg-blue-50 text-blue-600' // default/meeting
                                                        }`}>
                                                        <i className={`fa-solid 
                                                            ${event.type === 'note' ? 'fa-note-sticky' :
                                                                event.type === 'high' ? 'fa-triangle-exclamation' :
                                                                    event.type === 'medium' ? 'fa-circle-exclamation' :
                                                                        event.type === 'normal' ? 'fa-check' :
                                                                            'fa-calendar-check'} 
                                                            text-lg`}></i>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="font-semibold text-slate-800 text-sm line-clamp-1">{event.text}</h5>
                                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{event.time}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5 capitalize">
                                                            {event.type === 'note' ? 'Not' :
                                                                event.type === 'high' ? 'Yüksek Öncelik' :
                                                                    event.type === 'medium' ? 'Orta Öncelik' :
                                                                        event.type === 'normal' ? 'Normal' : 'Görüşme'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteEvent(event.id)}
                                                        className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <i className="fa-solid fa-trash text-xs"></i>
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                                                    <i className="fa-regular fa-calendar-plus text-2xl"></i>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Bugün için planınız boş.</p>
                                                <p className="text-xs text-slate-400 mt-1">Yukarıdan yeni bir etkinlik ekleyebilirsiniz.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Announcement Modal */}
            <AnnouncementModal
                isOpen={showAnnouncementModal}
                onClose={() => setShowAnnouncementModal(false)}
                initialData={editingAnnouncement}
                onSuccess={() => {
                    addToast(editingAnnouncement ? 'Duyuru güncellendi.' : 'Duyuru başarıyla oluşturuldu.', 'success');
                    // Optional: reload page to fetch new data since we rely on props
                    setTimeout(() => window.location.reload(), 1500);
                }}
            />

            {/* Announcement Detail Modal */}
            <AnnouncementDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                announcement={selectedAnnouncement}
                isAdmin={userInfo.userRole === 'admin'}
                onDelete={() => {
                    addToast('Duyuru silindi.', 'info');
                    setTimeout(() => window.location.reload(), 1000);
                }}
                onEdit={(announcement) => {
                    setShowDetailModal(false); // Close detail
                    setEditingAnnouncement(announcement); // Set data
                    setShowAnnouncementModal(true); // Open edit modal
                }}
            />
        </div >
    );
};

export default ModernDashboard;
