import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import SkeletonCard from './components/ui/SkeletonCard';
import ToastContainer from './components/ui/ToastContainer';
import Confetti from './components/ui/Confetti';
import LoginPage from './pages/LoginPage';
import AssetManagementPanel from './components/dashboard/AssetManagementPanel';
import DashboardView from './components/dashboard/DashboardView';
import Layout from './components/layout/Layout';
import { useDarkMode } from './hooks/useDarkMode';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useDashboard } from './hooks/useDashboard';
import { useTasks } from './hooks/useTasks';
import { useSearch } from './hooks/useSearch';
import LeaveManagementPage from './pages/LeaveManagementPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import EmployeeCreatePage from './pages/EmployeeCreatePage';
import SettingsPage from './pages/SettingsPage';
import { useNavigate } from 'react-router-dom';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAssetManagement, setShowAssetManagement] = useState(false);

  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const { toasts, addToast, removeToast } = useToast();
  const { isAuthenticated, loginError, handleLogin, handleLogout } = useAuth();
  const { dashboardData, loading, error } = useDashboard(isAuthenticated);
  const navigate = useNavigate();

  // Get tasks and search functionality
  const pendingTasks = dashboardData?.pendingTasks || [];
  const announcements = dashboardData?.announcements || [];

  const { completedTasks, showConfetti, handleTaskComplete, getActiveTasks } = useTasks(pendingTasks);
  const { handleSearch, filterTasks, filterAnnouncements } = useSearch();

  const filteredTasks = filterTasks(pendingTasks);
  const filteredAnnouncements = filterAnnouncements(announcements);
  const activeTasks = getActiveTasks(pendingTasks);

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev);
    addToast(isDarkMode ? 'Aydınlık mod aktif' : 'Karanlık mod aktif', 'info');
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8">
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
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-red-600 dark:text-red-400">!</span>
          </div>
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

  const handleBackToDashboard = () => navigate('/');
  const handleNavigateToCreateEmployee = () => navigate('/employees/new');

  return (
    <Layout>
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
              addToast={addToast}
              setShowAssetManagement={setShowAssetManagement}
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
        <Route
          path="/settings"
          element={
            <SettingsPage
              userRole={dashboardData.userInfo.userRole}
              onBack={handleBackToDashboard}
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
    </Layout>
  );
}

export default App;
