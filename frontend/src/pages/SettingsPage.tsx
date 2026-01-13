import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

interface SettingsPageProps {
  userRole?: 'admin' | 'employee';
  onBack: () => void;
  addToast: ToastFn;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  user_role: 'admin' | 'employee';
  status?: string;
  created_at: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userRole = 'employee', onBack, addToast }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'system'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User Management
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    department: '',
  });
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    leave_policy: {
      annual_leave_days: 14,
      sick_leave_days: 5,
      personal_leave_days: 3,
    },
    notifications: {
      email_enabled: true,
      sms_enabled: false,
    },
    system: {
      maintenance_mode: false,
      allow_registration: false,
    },
  });

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const [usersResult, departmentsResult, settingsResult] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
        api.getSettings(),
      ]);

      if (usersResult.data) {
        setUsers(usersResult.data as User[]);
      }
      if (departmentsResult.data) {
        setDepartments(departmentsResult.data as string[]);
      }
      if (settingsResult.data) {
        const fetchedSettings = settingsResult.data as any;
        setSystemSettings(fetchedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
      addToast('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, addToast]);

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password || !newAdmin.full_name) {
      addToast('Tüm alanlar zorunludur', 'warning');
      return;
    }

    setSaving(true);
    try {
      const result = await api.createAdmin(newAdmin);
      if (result.status === 200) {
        addToast('Admin kullanıcı oluşturuldu', 'success');
        setShowCreateAdmin(false);
        setNewAdmin({ username: '', email: '', password: '', full_name: '', department: '' });
        fetchData();
      } else {
        addToast(result.error || 'Admin oluşturulamadı', 'error');
      }
    } catch (error) {
      addToast('Admin oluşturulurken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'employee') => {
    setSaving(true);
    try {
      const result = await api.updateUserRole(userId, newRole);
      if (result.status === 200) {
        addToast('Kullanıcı rolü güncellendi', 'success');
        fetchData();
      } else {
        addToast(result.error || 'Rol güncellenemedi', 'error');
      }
    } catch (error) {
      addToast('Rol güncellenirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!newPassword || newPassword.length < 6) {
      addToast('Şifre en az 6 karakter olmalıdır', 'warning');
      return;
    }

    setResettingPassword(userId);
    try {
      const result = await api.resetUserPassword(userId, newPassword);
      if (result.status === 200) {
        addToast('Şifre sıfırlandı', 'success');
        setResettingPassword(null);
        setNewPassword('');
      } else {
        addToast(result.error || 'Şifre sıfırlanamadı', 'error');
      }
    } catch (error) {
      addToast('Şifre sıfırlanırken hata oluştu', 'error');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const result = await api.updateSettings(systemSettings);
      if (result.status === 200) {
        addToast('Ayarlar kaydedildi', 'success');
      } else {
        addToast(result.error || 'Ayarlar kaydedilemedi', 'error');
      }
    } catch (error) {
      addToast('Ayarlar kaydedilirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center space-x-2 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
          >
            <span>←</span>
            <span>Geri Dön</span>
          </button>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center">
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Bu sayfaya erişmek için yönetici yetkisi gereklidir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Ayarlar ve Yapılandırma</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Sistem ayarlarını ve kullanıcıları yönetin</p>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
          >
            <span>←</span>
            <span>Geri Dön</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'users'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              👥 Kullanıcı Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'departments'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              🏢 Departmanlar
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'system'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              ⚙️ Sistem Ayarları
            </button>
          </div>

          <div className="p-6">
            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Kullanıcı Yönetimi</h2>
                  <button
                    onClick={() => setShowCreateAdmin(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    ➕ Admin Ekle
                  </button>
                </div>

                {showCreateAdmin && (
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Yeni Admin Kullanıcı</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Kullanıcı Adı"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="E-posta"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Ad Soyad"
                        value={newAdmin.full_name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Departman (Opsiyonel)"
                        value={newAdmin.department}
                        onChange={(e) => setNewAdmin({ ...newAdmin, department: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Şifre"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleCreateAdmin}
                        disabled={saving}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Oluşturuluyor...' : 'Oluştur'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateAdmin(false);
                          setNewAdmin({ username: '', email: '', password: '', full_name: '', department: '' });
                        }}
                        className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900 dark:text-white">{user.full_name}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {user.email} • {user.department || 'Belirtilmemiş'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={user.user_role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as 'admin' | 'employee')}
                          className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm"
                        >
                          <option value="employee">Çalışan</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => {
                            setResettingPassword(user.id);
                            setNewPassword('');
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Şifre Sıfırla
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Departmanlar</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {departments.map((dept, index) => (
                    <div
                      key={index}
                      className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Sistem Ayarları</h2>

                <div className="space-y-4">
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">İzin Politikaları</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Yıllık İzin (Gün)</label>
                        <input
                          type="number"
                          value={systemSettings.leave_policy.annual_leave_days}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              leave_policy: { ...systemSettings.leave_policy, annual_leave_days: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Hastalık İzni (Gün)</label>
                        <input
                          type="number"
                          value={systemSettings.leave_policy.sick_leave_days}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              leave_policy: { ...systemSettings.leave_policy, sick_leave_days: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Mazeret İzni (Gün)</label>
                        <input
                          type="number"
                          value={systemSettings.leave_policy.personal_leave_days}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              leave_policy: { ...systemSettings.leave_policy, personal_leave_days: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Bildirim Ayarları</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.notifications.email_enabled}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              notifications: { ...systemSettings.notifications, email_enabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">E-posta Bildirimleri</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.notifications.sms_enabled}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              notifications: { ...systemSettings.notifications, sms_enabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">SMS Bildirimleri</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Sistem Ayarları</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.system.maintenance_mode}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              system: { ...systemSettings.system, maintenance_mode: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Bakım Modu</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={systemSettings.system.allow_registration}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              system: { ...systemSettings.system, allow_registration: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Kayıt İzni</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-primary-600 text-white rounded-md font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resettingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Şifre Sıfırla</h2>
            <input
              type="password"
              placeholder="Yeni şifre (min 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleResetPassword(resettingPassword)}
                disabled={!newPassword || newPassword.length < 6 || resettingPassword === null}
                className="flex-1 py-2 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                Sıfırla
              </button>
              <button
                onClick={() => {
                  setResettingPassword(null);
                  setNewPassword('');
                }}
                className="flex-1 py-2 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

