import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { LeaveBalance, LeaveRequest } from '../types';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

interface LeaveManagementPageProps {
  leaveBalance: LeaveBalance;
  employeeRequests?: LeaveRequest[];
  userRole?: 'admin' | 'employee';
  onBack: () => void;
  addToast: ToastFn;
}

const leaveTypeLabels: Record<LeaveRequest['leaveType'], string> = {
  annual: 'Yıllık İzin',
  sick: 'Hastalık İzni',
  personal: 'Mazeret İzni',
};

const LeaveManagementPage: React.FC<LeaveManagementPageProps> = ({
  leaveBalance,
  employeeRequests,
  userRole = 'employee',
  onBack,
  addToast,
}) => {
  const [formData, setFormData] = useState({
    leaveType: 'annual' as LeaveRequest['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [adminRequests, setAdminRequests] = useState<LeaveRequest[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<LeaveRequest[]>(employeeRequests || []);

  useEffect(() => {
    setEmployeeHistory(employeeRequests || []);
  }, [employeeRequests]);

  const fetchAdminRequests = useCallback(async () => {
    setAdminLoading(true);
    setAdminError(null);
    const result = await api.getLeaveRequests();
    if (result.data && result.status === 200) {
      setAdminRequests(result.data as LeaveRequest[]);
    } else {
      setAdminError(result.error || 'Talepler yüklenemedi');
    }
    setAdminLoading(false);
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAdminRequests();
    }
  }, [userRole, fetchAdminRequests]);

  const handleAdminAction = useCallback(
    async (requestId: number, status: 'approved' | 'rejected') => {
      const confirmed = window.confirm(
        status === 'approved'
          ? 'Bu izin talebini onaylamak istediğinize emin misiniz?'
          : 'Bu izin talebini reddetmek istediğinize emin misiniz?'
      );
      if (!confirmed) return;

      const result = await api.updateLeaveRequest(requestId, status);
      if (result.status === 200) {
        addToast(
          status === 'approved' ? 'Talep onaylandı' : 'Talep reddedildi',
          status === 'approved' ? 'success' : 'warning'
        );
        setAdminRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status } : req
          )
        );
      } else {
        addToast(result.error || 'Talep güncellenemedi', 'error');
      }
    },
    [addToast]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.startDate || !formData.endDate) {
        addToast('Lütfen başlangıç ve bitiş tarihi seçin', 'warning');
        return;
      }

      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        addToast('Bitiş tarihi başlangıçtan önce olamaz', 'error');
        return;
      }

      const dayCount =
        (new Date(formData.endDate).getTime() -
          new Date(formData.startDate).getTime()) /
          (1000 * 60 * 60 * 24) +
        1;

      setSubmitting(true);
      const result = await api.createLeaveRequest({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: dayCount,
        reason: formData.reason,
      });
      setSubmitting(false);

      if (result.status === 200) {
        addToast('İzin talebi alındı', 'success');
        setFormData({
          leaveType: 'annual',
          startDate: '',
          endDate: '',
          reason: '',
        });
        setEmployeeHistory((prev) => [
          {
            id: Date.now(),
            leaveType: formData.leaveType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalDays: dayCount,
            reason: formData.reason,
            status: 'pending',
          },
          ...prev,
        ]);
      } else {
        addToast(result.error || 'Talep gönderilemedi', 'error');
      }
    },
    [formData, addToast]
  );

  const leaveSummary = useMemo(
    () => [
      {
        key: 'annual',
        label: 'Yıllık',
        total: leaveBalance.annual,
        accent: 'from-amber-500 to-orange-500',
        icon: '',
      },
      {
        key: 'sick',
        label: 'Hastalık',
        total: leaveBalance.sick,
        accent: 'from-rose-500 to-pink-500',
        icon: '',
      },
      {
        key: 'personal',
        label: 'Mazeret',
        total: leaveBalance.personal,
        accent: 'from-sky-500 to-blue-500',
        icon: '',
      },
    ],
    [leaveBalance]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
          >
            <span>←</span>
            <span>Kontrol Paneline Dön</span>
          </button>
          <div className="text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Yeni talep oluşturmak yalnızca birkaç saniye sürer.</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Kalan günleriniz otomatik olarak güncellenir.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-xl space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-500 font-semibold">Leave Center</p>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mt-2">
              İzin Yönetim Merkezi
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
              Tüm izin bakiyelerinizi tek ekranda görün, talep oluşturun veya yöneticiniz olarak çalışanlardan gelen talepleri yönetin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaveSummary.map((item) => (
              <div
                key={item.key}
                className="bg-gradient-to-br from-white/90 to-white/40 dark:from-neutral-800/70 dark:to-neutral-900/50 rounded-2xl p-4 border border-white/40 dark:border-neutral-800 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{item.icon}</div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase">{item.label}</span>
                </div>
                <p className="text-4xl font-black text-neutral-900 dark:text-white">{item.total}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Gün kalan</p>
                <div className="mt-3 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${item.accent} rounded-full`} style={{ width: Math.min((item.total / 30) * 100, 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Yeni Talep Oluştur</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Yıllık, hastalık veya mazeret izni için talep gönderin.
                </p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">İzin Türü</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['annual', 'sick', 'personal'] as LeaveRequest['leaveType'][]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setFormData((prev) => ({ ...prev, leaveType: type }))}
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-all ${
                        formData.leaveType === type
                          ? 'bg-primary-600 text-white border-primary-600 shadow-lg'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-400'
                      }`}
                    >
                      {leaveTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Açıklama</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  placeholder="Talebinizi kısaca açıklayın..."
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Talep Geçmişim</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Son 6 ay içindeki izin talepleriniz
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {employeeHistory.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                  Henüz talep oluşturmadınız.
                </div>
              ) : (
                employeeHistory.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-800/60 shadow-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {leaveTypeLabels[request.leaveType]}
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {request.status === 'approved'
                          ? 'Onaylandı'
                          : request.status === 'rejected'
                          ? 'Reddedildi'
                          : 'Beklemede'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {request.startDate} → {request.endDate} • {request.totalDays} gün
                    </p>
                    {request.reason && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                        {request.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {userRole === 'admin' && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gelen Talepler</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Yöneticisi olduğunuz çalışanların bekleyen izin talepleri
                </p>
              </div>
              <button
                onClick={fetchAdminRequests}
                className="px-4 py-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:border-primary-400"
              >
                Listeyi Yenile
              </button>
            </div>

            {adminError && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {adminError}
              </div>
            )}

            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 dark:text-neutral-400 uppercase text-xs tracking-wider">
                    <th className="py-3 pr-4">Çalışan</th>
                    <th className="py-3 pr-4">Tür</th>
                    <th className="py-3 pr-4">Tarih Aralığı</th>
                    <th className="py-3 pr-4">Süre</th>
                    <th className="py-3 pr-4">Durum</th>
                    <th className="py-3">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLoading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500">
                        Talepler yükleniyor...
                      </td>
                    </tr>
                  ) : adminRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500">
                        Bekleyen talep bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    adminRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-t border-neutral-100 dark:border-neutral-800"
                      >
                        <td className="py-4 pr-4 font-semibold text-neutral-800 dark:text-white">
                          {request.reason?.split('|')[0] || 'Çalışan'}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold">
                            {leaveTypeLabels[request.leaveType]}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-neutral-600 dark:text-neutral-300">
                          {request.startDate} → {request.endDate}
                        </td>
                        <td className="py-4 pr-4 text-neutral-600 dark:text-neutral-300">
                          {request.totalDays} gün
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-amber-100 text-amber-600'
                            }`}
                          >
                            {request.status === 'approved'
                              ? 'Onaylandı'
                              : request.status === 'rejected'
                              ? 'Reddedildi'
                              : 'Beklemede'}
                          </span>
                        </td>
                        <td className="py-4 space-x-2">
                          <button
                            onClick={() => handleAdminAction(request.id, 'approved')}
                            disabled={request.status === 'approved'}
                            className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleAdminAction(request.id, 'rejected')}
                            disabled={request.status === 'rejected'}
                            className="px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reddet
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagementPage;


