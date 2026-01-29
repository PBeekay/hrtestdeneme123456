import React, { useState } from 'react';
import { DashboardData, Task } from '../types';
import { useNavigate } from 'react-router-dom';
import LeaveManagementPage from './LeaveManagementPage';

interface ModernDashboardProps {
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

const ModernDashboard: React.FC<ModernDashboardProps> = ({
    dashboardData,
    currentTime,
    handleLogout,
    handleSearch,
    filteredAnnouncements,
    activeTasks,
    addToast,
}) => {
    const navigate = useNavigate();
    const [viewId, setViewId] = useState<'dashboard' | 'people' | 'hiring' | 'leave'>('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBirthdayModal, setShowBirthdayModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const { userInfo, employeeStats, employees, leaveRequests } = dashboardData;

    // Calculate pending leave requests
    const pendingLeavesCount = leaveRequests?.filter(req => req.status === 'pending').length || 0;

    const switchView = (id: 'dashboard' | 'people' | 'hiring' | 'leave') => {
        setViewId(id);
    };

    const openModal = () => {
        // Navigate to the existing create employee page for full functionality
        navigate('/employees/new');
    };

    const closeModal = () => setIsModalOpen(false);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        handleSearch(e.target.value);
    };

    const filteredEmployees = employees?.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

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

    return (
        <div className="text-slate-600 min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-[#f8fafc]">
            {/* TOP NAVIGATION (Floating) */}
            <nav className="sticky top-0 z-30 px-6 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo area */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => switchView('dashboard')}>
                        <img src="/vr_logo.png" alt="FastIK Logo" className="h-10 w-auto" />
                        <span className="font-bold text-slate-800 text-lg tracking-tight">FastIK</span>
                    </div>

                    {/* Central Menu (Pill) */}
                    <div className="hidden md:flex bg-white border border-slate-200 rounded-full px-2 py-1.5 shadow-sm items-center gap-1">
                        <button
                            onClick={() => switchView('dashboard')}
                            className={`nav-btn px-4 py-2 rounded-full text-sm transition-all ${viewId === 'dashboard' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            Genel Bakış
                        </button>
                        <button
                            onClick={() => switchView('people')}
                            className={`nav-btn px-4 py-2 rounded-full text-sm transition-all ${viewId === 'people' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            Çalışanlar
                        </button>
                        <button
                            onClick={() => switchView('leave')}
                            className={`nav-btn px-4 py-2 rounded-full text-sm transition-all ${viewId === 'leave' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            İzinler
                        </button>

                        {/* More/Apps Dropdown */}
                        <div className="relative group">
                            <button className="nav-btn px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1">
                                Diğer <i className="fa-solid fa-chevron-down text-[10px] ml-1"></i>
                            </button>

                            {/* Dropdown Content */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block transition-all z-50">
                                <div className="p-1 space-y-0.5">
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 rounded-lg flex items-center justify-between group/item cursor-not-allowed">
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-briefcase text-slate-300 w-4"></i> İşe Alım
                                        </span>
                                        <i className="fa-solid fa-lock text-[10px] opacity-100 group-hover/item:opacity-0 transition-opacity absolute right-3"></i>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 opacity-0 group-hover/item:opacity-100 transition-opacity">+</span>
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 rounded-lg flex items-center justify-between group/item cursor-not-allowed">
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-coins text-slate-300 w-4"></i> Finans
                                        </span>
                                        <i className="fa-solid fa-lock text-[10px] opacity-100 group-hover/item:opacity-0 transition-opacity absolute right-3"></i>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 opacity-0 group-hover/item:opacity-100 transition-opacity">+</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                            >
                                <i className="fa-regular fa-bell"></i>
                                {filteredAnnouncements.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800">Bildirimler</h3>
                                        <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {filteredAnnouncements.length > 0 ? (
                                            filteredAnnouncements.map((announcement: any, index: number) => (
                                                <div key={index} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${announcement.category === 'Etkinlik' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700">{announcement.title}</p>
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{announcement.description || announcement.content}</p>
                                                            <p className="text-[10px] text-slate-400 mt-2">{announcement.date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400">
                                                <i className="fa-regular fa-bell-slash text-2xl mb-2"></i>
                                                <p className="text-sm">Yeni bildirim bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Tümünü Okundu İşaretle</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative group">
                            <img
                                src={`https://ui-avatars.com/api/?name=${userInfo.name}&background=0F172A&color=fff`}
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all"
                                alt="Profile"
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 hidden group-hover:block transition-all opacity-0 group-hover:opacity-100 z-50">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 rounded-b-xl flex items-center gap-2">
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Çıkış Yap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT CONTAINER */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

                {/* VIEW: DASHBOARD */}
                {viewId === 'dashboard' && (
                    <div className="animate-slide-up space-y-8 animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                        {/* Hero Section */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-10 shadow-xl shadow-blue-200">
                            <div className="relative z-10 max-w-2xl">
                                <p className="text-blue-100 font-medium mb-2">Günaydın, {userInfo.name.split(' ')[0]}</p>
                                <h1 className="text-2xl md:text-3xl font-bold mb-6">Bugün ne yapmak istersiniz?</h1>

                                {/* Command Bar */}
                                <div className="bg-white p-1.5 pl-3 rounded-xl shadow-lg flex items-center gap-3 transition-transform focus-within:scale-[1.01] max-w-lg">
                                    <div className="text-slate-400">
                                        <i className="fa-solid fa-magnifying-glass text-md"></i>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Çalışan, departman veya işlem ara..."
                                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 h-9 text-sm"
                                        onChange={onSearchChange}
                                    />
                                    <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                                        Ara
                                    </button>
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
                            </div>

                            {/* Decorative Circle */}
                            <div className="absolute -right-20 -top-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                        </div>

                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Quick Stats Column */}
                            <div className="space-y-6">
                                {/* Total Employees Card */}
                                <div onClick={() => switchView('people')} className="group bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg border border-slate-100 cursor-pointer transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <i className="fa-solid fa-users text-xl"></i>
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">Aktif</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-bold text-slate-800">{employeeStats?.totalEmployees || 0}</h2>
                                        <p className="text-slate-500 font-medium">Toplam Çalışan</p>
                                    </div>
                                </div>

                                {/* On Leave Card */}
                                <div onClick={() => switchView('leave')} className="group bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg border border-slate-100 cursor-pointer transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                            <i className="fa-solid fa-plane-departure text-xl"></i>
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">Bugün</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-bold text-slate-800">{employeeStats?.onLeave || 0}</h2>
                                        <p className="text-slate-500 font-medium">İzinli Personel</p>
                                    </div>
                                </div>
                            </div>

                            {/* Central Activity Feed (Tall) */}
                            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100 md:col-span-2 flex flex-col max-h-[500px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-slate-800">Şirket Gündemi</h3>
                                    <button className="text-sm text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">Tümünü Gör</button>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-6 overflow-y-auto no-scrollbar flex-1 pr-2">
                                    {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((announcement: any, index: number) => (
                                        <div key={announcement.id || index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 z-10 border-4 border-white">
                                                    <i className={`fa-solid ${announcement.category === 'Etkinlik' ? 'fa-calendar' : 'fa-bullhorn'} text-sm`}></i>
                                                </div>
                                                <div className="h-full w-0.5 bg-slate-100 -mt-2 -mb-4"></div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl flex-1 border border-slate-100">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-slate-800 text-sm">{announcement.title}</h4>
                                                    <span className="text-xs text-slate-400">{announcement.date?.split(' ')[0]}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{announcement.description || announcement.content}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-6 text-slate-400">
                                            Henüz bir duyuru veya etkinlik yok.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Quick Links */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={openModal} className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-user-plus"></i>
                                </div>
                                <span className="font-semibold text-slate-700 block">Çalışan Ekle</span>
                                <span className="text-xs text-slate-400">Yeni personel kaydı</span>
                            </button>
                            <button
                                onClick={() => navigate('/leave')}
                                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group relative overflow-hidden"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-calendar-check"></i>
                                </div>
                                <span className="font-semibold text-slate-700 block">İzinler</span>
                                <span className="text-xs text-slate-400">İzin takibi ve onayı</span>
                                {pendingLeavesCount > 0 && (
                                    <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                        {pendingLeavesCount}
                                    </span>
                                )}
                            </button>
                            <button className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
                                <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-bullhorn"></i>
                                </div>
                                <span className="font-semibold text-slate-700 block">Duyurular</span>
                                <span className="text-xs text-slate-400">Şirket içi haberler</span>
                            </button>
                            <button onClick={() => navigate('/settings')} className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
                                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-sliders"></i>
                                </div>
                                <span className="font-semibold text-slate-700 block">Ayarlar</span>
                                <span className="text-xs text-slate-400">Sistem yapılandırması</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW: PEOPLE */}
                {viewId === 'people' && (
                    <div className="animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] space-y-6">
                        {/* Header for Table View */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                            <div>
                                <button onClick={() => switchView('dashboard')} className="text-slate-400 hover:text-slate-600 mb-2 text-sm flex items-center gap-1">
                                    <i className="fa-solid fa-arrow-left"></i> Ana Sayfaya Dön
                                </button>
                                <h1 className="text-3xl font-bold text-slate-800">Çalışan Rehberi</h1>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                                    <i className="fa-solid fa-filter text-slate-400 text-sm"></i>
                                    <select className="bg-transparent border-none outline-none text-sm text-slate-600">
                                        <option>Tüm Departmanlar</option>
                                        <option>Yazılım</option>
                                        <option>Satış</option>
                                        <option>İK</option>
                                    </select>
                                </div>
                                <button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all transform active:scale-95">
                                    <i className="fa-solid fa-plus mr-2"></i> Çalışan Ekle
                                </button>
                            </div>
                        </div>

                        {/* The Table Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-4 font-semibold text-slate-500">Çalışan</th>
                                            <th className="px-8 py-4 font-semibold text-slate-500">Rol</th>
                                            <th className="px-8 py-4 font-semibold text-slate-500">Departman</th>
                                            <th className="px-8 py-4 font-semibold text-slate-500">Durum</th>
                                            <th className="px-8 py-4 font-semibold text-slate-500">E-posta</th>
                                            <th className="px-8 py-4 text-right font-semibold text-slate-500">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((emp) => (
                                                <tr key={emp.id} onClick={() => navigate('/employees')} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                                {getInitials(emp.name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{emp.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4">{emp.role}</td>
                                                    <td className="px-8 py-4">{emp.department}</td>
                                                    <td className="px-8 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${emp.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                                                            emp.status === 'on_leave' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                                'bg-red-50 text-red-700 border-red-100'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-green-500' :
                                                                emp.status === 'on_leave' ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                                }`}></span>
                                                            {emp.status === 'active' ? 'Aktif' : emp.status === 'on_leave' ? 'İzinli' : 'Ayrıldı'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 text-slate-400">{emp.email}</td>
                                                    <td className="px-8 py-4 text-right">
                                                        <button className="text-slate-300 hover:text-blue-600 transition-colors"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-8 text-center text-slate-500">
                                                    Aradığınız kriterlere uygun çalışan bulunamadı.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: HIRING */}
                {viewId === 'hiring' && (
                    <div className="animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] space-y-8">
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
                )}

                {/* VIEW: LEAVE */}
                {viewId === 'leave' && (
                    <div className="animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                        <LeaveManagementPage
                            leaveBalance={dashboardData.leaveBalance}
                            employeeRequests={dashboardData.leaveRequests}
                            userRole={dashboardData.userInfo.userRole}
                            onBack={() => switchView('dashboard')}
                            addToast={addToast}
                        />
                    </div>
                )}
            </main>

            {/* BIRTHDAY MODAL */}
            {showBirthdayModal && (
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
            )}
        </div>
    );
};

export default ModernDashboard;
