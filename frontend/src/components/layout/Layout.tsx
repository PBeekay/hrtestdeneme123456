import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-stone-100 dark:bg-[#0F172A] p-4 md:p-6 lg:p-8 font-sans">
            {children}
        </div>
    );
};

export default Layout;
