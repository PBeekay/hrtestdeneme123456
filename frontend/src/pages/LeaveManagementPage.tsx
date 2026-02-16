import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { LeaveBalance, LeaveRequest } from '../types';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Sun,
  Activity,
  User,
  Baby,
  Heart,
  Gem,
  Moon,
  Clock,
  ArrowLeft
} from 'lucide-react';

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
  paternity: 'Babalık İzni',
  maternity: 'Doğum İzni',
  marriage: 'Evlilik İzni',
  death: 'Vefat İzni',
};

const leaveTooltips: Record<string, string> = {
  annual: "4857 sayılı İş Kanunu'na göre, hizmet süresi 1 yıldan 5 yıla kadar olanlara 14 gün, 5-15 yıl olanlara 20 gün, 15 yıldan fazla olanlara 26 günden az olmamak üzere verilir.",
  sick: "Hastalık durumunda doktor raporu ile belgelenmesi şartıyla kullanılır. SGK ve İş Kanunu mevzuatına tabidir.",
  personal: "İşverenin takdirine bağlı olarak veya iş sözleşmesinde belirtilen özel mazeretler (taşınma vb.) için verilen izindir.",
  paternity: "4857 sayılı İş Kanunu Ek Madde 2'ye göre eşi doğum yapan işçiye 5 gün ücretli izin verilir.",
  maternity: "4857 sayılı İş Kanunu Madde 74'e göre doğumdan önceki 8 hafta ve doğumdan sonraki 8 hafta olmak üzere toplam 16 haftadır.",
  marriage: "4857 sayılı İş Kanunu Ek Madde 2'ye göre işçiye evlenmesi halinde 3 gün ücretli izin verilir.",
  death: "4857 sayılı İş Kanunu Ek Madde 2'ye göre işçinin anne, baba, eş, çocuk veya kardeşinin ölümü halinde 3 gün ücretli izin verilir."
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
    startTime: '09:00',
    endTime: '18:00',
    isHourly: false,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [adminRequests, setAdminRequests] = useState<LeaveRequest[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [, setAdminError] = useState<string | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<LeaveRequest[]>(employeeRequests || []);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { }
  });

  const [adminFilter, setAdminFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [adminSearch, setAdminSearch] = useState('');

  useEffect(() => {
    setEmployeeHistory(employeeRequests || []);
  }, [employeeRequests]);

  const fetchAdminRequests = useCallback(async () => {
    setAdminLoading(true);
    setAdminError(null);
    const result = await api.getLeaveRequests(undefined);
    if (result.data && result.status === 200) {
      const requests = (result.data as any).leaveRequests || result.data;
      setAdminRequests(Array.isArray(requests) ? requests : []);
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
    (requestId: number, status: 'approved' | 'rejected') => {
      setConfirmDialog({
        isOpen: true,
        title: status === 'approved' ? 'İzin Onayı' : 'İzin Reddi',
        message: status === 'approved'
          ? 'Bu izin talebini onaylamak istediğinize emin misiniz?'
          : 'Bu izin talebini reddetmek istediğinize emin misiniz?',
        type: status === 'approved' ? 'info' : 'warning',
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          const result = await api.updateLeaveRequest(requestId, status === 'approved');
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
            fetchAdminRequests();
          } else {
            addToast(result.error || 'Talep güncellenemedi', 'error');
          }
        }
      });
    },
    [addToast, fetchAdminRequests]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.startDate || !formData.endDate) {
        addToast('Lütfen başlangıç ve bitiş tarihi seçin', 'warning');
        return;
      }

      const startDateTimeStr = `${formData.startDate} ${formData.isHourly ? formData.startTime : '09:00'}`;
      const endDateTimeStr = `${formData.endDate} ${formData.isHourly ? formData.endTime : '18:00'}`;

      const start = new Date(startDateTimeStr);
      const end = new Date(endDateTimeStr);

      if (start >= end) {
        addToast('Bitiş zamanı başlangıçtan sonra olmalıdır', 'error');
        return;
      }

      let dayCount = 0;
      if (formData.isHourly) {
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        dayCount = parseFloat((diffHours / 9).toFixed(2));
      } else {
        const diffTime = new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime();
        dayCount = (diffTime / (1000 * 60 * 60 * 24)) + 1;
      }

      setSubmitting(true);
      const result = await api.createLeaveRequest({
        leaveType: formData.leaveType,
        startDate: formData.isHourly ? startDateTimeStr : startDateTimeStr + ":00",
        endDate: formData.isHourly ? endDateTimeStr : endDateTimeStr + ":00",
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
          startTime: '09:00',
          endTime: '18:00',
          isHourly: false,
          reason: '',
        });
        setEmployeeHistory((prev) => [
          {
            id: Date.now(),
            leaveType: formData.leaveType,
            startDate: startDateTimeStr,
            endDate: endDateTimeStr,
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
        icon: <Sun className="w-6 h-6" />,
      },
      {
        key: 'sick',
        label: 'Hastalık',
        total: leaveBalance.sick,
        accent: 'from-rose-500 to-pink-500',
        icon: <Activity className="w-6 h-6" />,
      },
      {
        key: 'personal',
        label: 'Mazeret',
        total: leaveBalance.personal,
        accent: 'from-sky-500 to-blue-500',
        icon: <User className="w-6 h-6" />,
      },
      {
        key: 'paternity',
        label: 'Babalık',
        total: leaveBalance.paternity || 5,
        accent: 'from-blue-500 to-indigo-500',
        icon: <Baby className="w-6 h-6" />,
      },
      {
        key: 'maternity',
        label: 'Doğum',
        total: leaveBalance.maternity || 112,
        accent: 'from-pink-400 to-rose-400',
        icon: <Heart className="w-6 h-6" />,
      },
      {
        key: 'marriage',
        label: 'Evlilik',
        total: leaveBalance.marriage || 3,
        accent: 'from-purple-500 to-fuchsia-500',
        icon: <Gem className="w-6 h-6" />,
      },
      {
        key: 'death',
        label: 'Vefat',
        total: leaveBalance.death || 3,
        accent: 'from-gray-500 to-slate-500',
        icon: <Moon className="w-6 h-6" />,
      },
    ],
    [leaveBalance]
  );

  const processedAdminRequests = useMemo(() => {
    return adminRequests.filter(req => {
      const matchesStatus = adminFilter === 'all' ? true : req.status === adminFilter;
      const matchesSearch = !adminSearch ||
        (req.reason && req.reason.toLowerCase().includes(adminSearch.toLowerCase())) ||
        leaveTypeLabels[req.leaveType].toLowerCase().includes(adminSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [adminRequests, adminFilter, adminSearch]);

  const EmployeeHistoryComponent = (
    <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-lg">
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
          <div className="flex items-center justify-center h-32 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-md border border-dashed border-neutral-200 dark:border-neutral-700">
            Henüz talep oluşturmadınız.
          </div>
        ) : (
          employeeHistory.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-800/60 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {leaveTypeLabels[request.leaveType]}
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${request.status === 'approved'
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
  );

  const AdminPanelComponent = (
    <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gelen Talepler</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Yöneticisi olduğunuz çalışanların izin taleplerini yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,"
                + "ID,Tur,Baslangic,Bitis,Sure,Durum,Aciklama\n"
                + processedAdminRequests.map(r => `${r.id},${leaveTypeLabels[r.leaveType]},${r.startDate},${r.endDate},${r.totalDays},${r.status},"${r.reason || ''}"`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "izin_talepleri.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              addToast('Rapor indirildi', 'success');
            }}
            className="flex items-center space-x-2 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <span>📥 Excel İndir</span>
          </button>
          <button
            onClick={fetchAdminRequests}
            className="px-4 py-2 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:border-primary-400"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-neutral-800/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Çalışan adı, izin türü veya açıklama ara..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-transparent text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-neutral-400">🔎</div>
          </div>
        </div>

        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-md">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(status => (
            <button
              key={status}
              onClick={() => setAdminFilter(status)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${adminFilter === status
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
            >
              {status === 'pending' && 'Bekleyen'}
              {status === 'approved' && 'Onaylanan'}
              {status === 'rejected' && 'Reddedilen'}
              {status === 'all' && 'Tümü'}
            </button>
          ))}
        </div>
      </div>

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
            ) : processedAdminRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-500">
                  {adminFilter === 'all' && !adminSearch
                    ? 'Hiç izin talebi bulunmuyor.'
                    : 'Kriterlere uygun talep bulunamadı.'}
                </td>
              </tr>
            ) : (
              processedAdminRequests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors"
                >
                  <td className="py-4 pr-4 font-semibold text-neutral-800 dark:text-white">
                    {request.reason?.split('|')[0] || (
                      <span className="opacity-50 italic">Çalışan</span>
                    )}
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
                      className={`text-xs font-bold px-2 py-1 rounded-full ${request.status === 'approved'
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
                    {request.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAdminAction(request.id, 'approved')}
                          className="px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition-colors"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => handleAdminAction(request.id, 'rejected')}
                          className="px-3 py-1.5 rounded-md bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors"
                        >
                          Reddet
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-neutral-400">İşlem yapıldı</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Onayla"
        cancelText="İptal"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="h-full space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kontrol Paneline Dön</span>
            </button>
            <div className="text-right">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Yeni talep oluşturmak yalnızca birkaç saniye sürer.</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Kalan günleriniz otomatik olarak güncellenir.</p>
            </div>
          </div>

          {/* ... Leave Center & Create Request ... */}
          <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-xl space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary-500 font-semibold">Leave Center</p>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mt-2">
                İzin Yönetim Merkezi
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
                Tüm izin bakiyelerinizi tek ekranda görün, talep oluşturun veya yöneticiniz olarak çalışanlardan gelen talepleri yönetin.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {leaveSummary.map((item) => (
                <div
                  key={item.key}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-shadow"
                >
                  <div className="text-primary-600 dark:text-primary-400">{item.icon}</div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">{item.label}</span>
                  <div className="flex items-baseline space-x-1">
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{item.total}</p>
                    <span className="text-[10px] text-neutral-400">gün</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Request Form */}
            <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Yeni Talep Oluştur</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Yıllık, hastalık veya mazeret izni için talep gönderin.
                  </p>
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Form Inputs */}
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">İzin Türü</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {leaveSummary.map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setFormData((prev) => ({ ...prev, leaveType: item.key as any, isHourly: false }))}
                        className={`relative group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${!formData.isHourly && formData.leaveType === item.key
                          ? `border-transparent bg-gradient-to-br ${item.accent} shadow-md transform scale-[1.02]`
                          : 'border-transparent bg-white dark:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 shadow-sm'
                          }`}
                      >
                        <div className={`mb-1 transition-transform group-hover:scale-110 ${!formData.isHourly && formData.leaveType === item.key ? 'scale-110 text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {item.icon}
                        </div>
                        <span className={`text-sm font-semibold ${!formData.isHourly && formData.leaveType === item.key
                          ? 'text-white'
                          : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                          {item.label}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800/90 text-white text-[10px] rounded-lg shadow-lg pointer-events-none z-20 backdrop-blur-sm border border-slate-700">
                          <div className="font-semibold mb-0.5 text-amber-400">Yasal Mevzuat</div>
                          {leaveTooltips[item.key] || 'Yasal düzenlemelere tabidir.'}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/90"></div>
                        </div>

                        {!formData.isHourly && formData.leaveType === item.key && (
                          <div className={`absolute inset-0 rounded-xl ring-2 ring-${item.accent.split('-')[1]}-500 ring-opacity-50 pointer-events-none`} />
                        )}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isHourly: true, leaveType: 'annual' }))}
                      className={`relative group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${formData.isHourly
                        ? 'border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md transform scale-[1.02]'
                        : 'border-transparent bg-white dark:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 shadow-sm'
                        }`}
                    >
                      <div className={`mb-1 transition-transform group-hover:scale-110 ${formData.isHourly ? 'scale-110 text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        <Clock className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-semibold ${formData.isHourly
                        ? 'text-white'
                        : 'text-neutral-500 dark:text-neutral-400'
                        }`}>
                        Saatlik
                      </span>

                      {formData.isHourly && (
                        <div className="absolute inset-0 rounded-xl ring-2 ring-indigo-500 ring-opacity-50 pointer-events-none" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                      Başlangıç {formData.isHourly ? 'Tarih ve Saati' : 'Tarihi'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                      {formData.isHourly && (
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                          className="w-32 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                      Bitiş {formData.isHourly ? 'Tarih ve Saati' : 'Tarihi'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                      {formData.isHourly && (
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="w-32 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Açıklama</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    placeholder="Talebinizi kısaca açıklayın..."
                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-md bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
                </button>
              </form>
            </div>

            {/* Admin Panel (if admin) or Employee History (if not admin) */}
            {userRole === 'admin' ? AdminPanelComponent : EmployeeHistoryComponent}
          </div>

          {/* Employee History for Admin (moved to bottom) */}
          {userRole === 'admin' && EmployeeHistoryComponent}
        </div>
      </div>
    </>
  );
};

export default LeaveManagementPage;
