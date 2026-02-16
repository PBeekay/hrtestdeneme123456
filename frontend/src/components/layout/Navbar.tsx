import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserInfo, Announcement } from '../../types';

interface NavbarProps {
    userInfo: UserInfo;
    notifications: Announcement[];
    onLogout: () => void;
    onOpenAssets: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userInfo, notifications, onLogout, onOpenAssets }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);

    // Determine active view based on path
    const getActiveView = () => {
        if (location.pathname === '/') return 'dashboard';
        if (location.pathname.startsWith('/employees')) return 'employees';
        if (location.pathname.startsWith('/leave')) return 'leave';
        // Assets usually is a modal in this app, but if it has a route add here
        return 'dashboard';
    };

    const viewId = getActiveView();

    return (
        <nav className="sticky top-0 z-30 px-6 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo area */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/vr_logo.png" alt="FastIK Logo" className="h-10 w-auto" />
                    <span className="font-bold text-slate-800 text-lg tracking-tight">FastIK</span>
                </div>

                {/* Central Menu (Pill) */}
                <div className="hidden md:flex bg-white border border-slate-200 rounded-full px-2 py-1.5 shadow-sm items-center gap-1">
                    <button
                        onClick={() => navigate('/')}
                        className={`nav-btn px-4 py-2 rounded-full text-sm transition-all ${viewId === 'dashboard'
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        Genel Bakış
                    </button>
                    <button
                        onClick={() => navigate('/employees')}
                        className={`nav-btn px-4 py-2 rounded-full text-sm transition-all ${viewId === 'employees'
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        Çalışanlar
                    </button>

                    <button
                        onClick={() => navigate('/leave')}
                        className={`nav-btn px-4 py-2 rounded-full text-sm transition-all ${viewId === 'leave'
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        İzinler
                    </button>

                    <button
                        onClick={onOpenAssets}
                        className="nav-btn px-4 py-2 rounded-full text-sm transition-all text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900"
                    >
                        Zimmetler
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
                            {notifications && notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            )}
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
                                    {notifications && notifications.length > 0 ? (
                                        notifications.map((announcement: any, index: number) => (
                                            <div key={index} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                                <div className="flex gap-3">
                                                    <div
                                                        className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${announcement.category === 'Etkinlik' ? 'bg-orange-500' : 'bg-blue-500'
                                                            }`}
                                                    ></div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-700">{announcement.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                            {announcement.description || announcement.content}
                                                        </p>
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
                                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                                        Tümünü Okundu İşaretle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative group">
                        <img
                            src={userInfo.avatar || `https://ui-avatars.com/api/?name=${userInfo.name}&background=0F172A&color=fff`}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all"
                            alt="Profile"
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 hidden group-hover:block transition-all opacity-0 group-hover:opacity-100 z-50">
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 rounded-b-xl flex items-center gap-2"
                            >
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Çıkış Yap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
