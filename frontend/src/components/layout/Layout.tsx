import React from 'react';
import Footer from './Footer';

import Navbar from './Navbar';
import { UserInfo, Announcement } from '../../types';

interface LayoutProps {
    children: React.ReactNode;
    userInfo?: UserInfo;
    notifications?: Announcement[];
    onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userInfo, notifications, onLogout }) => {
    return (
        <div className="min-h-screen bg-stone-100 dark:bg-[#0F172A] font-sans flex flex-col">
            {userInfo && onLogout && (
                <Navbar
                    userInfo={userInfo}
                    notifications={notifications || []}
                    onLogout={onLogout}
                />
            )}
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </div>
    );
};

export default Layout;
