import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { EmployeeProfile, EmployeeStats, EmployeeDocument } from '../types';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

interface EmployeeManagementPageProps {
  employees?: EmployeeProfile[];
  stats?: EmployeeStats;
  userRole?: 'admin' | 'employee';
  onBack: () => void;
  addToast: ToastFn;
  onAddEmployee: () => void;
}

const fallbackEmployees: EmployeeProfile[] = [
  {
    id: 1,
    name: 'Selin Yılmaz',
    role: 'Kıdemli İnsan Kaynakları Uzmanı',
    department: 'İK',
    email: 'selin.yilmaz@company.com',
    phone: '+90 542 000 12 34',
    startDate: '2018-04-16',
    status: 'active',
    manager: 'Ahmet Demir',
    location: 'İstanbul',
    documents: [
      {
        id: 1,
        title: 'İş Sözleşmesi',
        type: 'contract',
        uploadedAt: '2022-01-05',
        status: 'approved',
        uploadedBy: 'HR',
      },
      {
        id: 2,
        title: 'Performans Raporu 2024',
        type: 'performance',
        uploadedAt: '2024-11-01',
        status: 'pending',
        uploadedBy: 'HR',
      },
    ],
  },
  {
    id: 2,
    name: 'Burak Aksoy',
    role: 'Kıdemli Yazılım Geliştirici',
    department: 'Teknoloji',
    email: 'burak.aksoy@company.com',
    phone: '+90 532 444 22 11',
    startDate: '2019-10-03',
    status: 'on_leave',
    manager: 'Elif Korkmaz',
    location: 'İzmir',
    documents: [
      {
        id: 3,
        title: 'Yıllık Performans',
        type: 'performance',
        uploadedAt: '2024-06-15',
        status: 'approved',
        uploadedBy: 'Manager',
      },
    ],
  },
  {
    id: 3,
    name: 'Eda Öztürk',
    role: 'Ürün Yöneticisi',
    department: 'Ürün',
    email: 'eda.ozturk@company.com',
    phone: '+90 533 987 65 43',
    startDate: '2021-02-11',
    status: 'active',
    manager: 'Ahmet Demir',
    location: 'Ankara',
    documents: [
      {
        id: 4,
        title: 'İş Sözleşmesi',
        type: 'contract',
        uploadedAt: '2021-02-13',
        status: 'approved',
        uploadedBy: 'HR',
      },
    ],
  },
];

const statusBadge = (status: EmployeeProfile['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'on_leave':
      return 'bg-amber-100 text-amber-700';
    case 'terminated':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
};

const documentBadge = (status: EmployeeDocument['status']) => {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50';
    case 'pending':
      return 'text-amber-600 bg-amber-50';
    case 'rejected':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-neutral-600 bg-neutral-100';
  }
};

const EmployeeManagementPage: React.FC<EmployeeManagementPageProps> = ({
  employees,
  stats,
  userRole = 'employee',
  onBack,
  addToast,
  onAddEmployee,
}) => {
  const [employeeData, setEmployeeData] = useState<EmployeeProfile[] | null>(employees ?? null);
  const [statsData, setStatsData] = useState<EmployeeStats | null>(stats ?? null);
  const [isLoading, setIsLoading] = useState(!employees);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employees?.[0]?.id ?? fallbackEmployees[0].id);
  const [note, setNote] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState<EmployeeDocument['type']>('other');
  const [savingNote, setSavingNote] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (employees) {
      setEmployeeData(employees);
    }
  }, [employees]);

  useEffect(() => {
    if (stats) {
      setStatsData(stats);
    }
  }, [stats]);

  const fetchEmployeeData = useCallback(
    async (notify = false) => {
      setIsRefreshing(true);
      setLoadError(null);
      setIsLoading(true);

      try {
        const [statsResult, employeesResult] = await Promise.all([
          api.getEmployeeStats(),
          api.getEmployees(),
        ]);

        let success = true;
        let message = '';

        if (employeesResult.data && employeesResult.status === 200) {
          setEmployeeData(employeesResult.data as EmployeeProfile[]);
        } else {
          success = false;
          message = employeesResult.error || 'Çalışan listesi alınamadı';
          setLoadError(message);
        }

        if (statsResult.data && statsResult.status === 200) {
          setStatsData(statsResult.data as EmployeeStats);
        }

        if (notify) {
          addToast(
            success ? 'Çalışan verileri yenilendi' : message || 'Çalışan verileri alınamadı',
            success ? 'success' : 'error'
          );
        }
      } catch (error) {
        setLoadError('Çalışan verileri alınamadı');
        if (notify) {
          addToast('Çalışan verileri alınamadı', 'error');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    if (!employees) {
      fetchEmployeeData();
    } else {
      setIsLoading(false);
    }
  }, [employees, fetchEmployeeData]);

  const employeeList = useMemo(
    () => (employeeData && employeeData.length > 0 ? employeeData : fallbackEmployees),
    [employeeData]
  );

  useEffect(() => {
    if (!employeeList.length) return;
    setSelectedEmployeeId((prev) => {
      if (employeeList.some((emp) => emp.id === prev)) {
        return prev;
      }
      return employeeList[0].id;
    });
  }, [employeeList]);

  const selectedEmployee =
    employeeList.find((emp) => emp.id === selectedEmployeeId) ?? employeeList[0];

  const filteredEmployees = useMemo(() => {
    return employeeList.filter((emp) => {
      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.role.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      return matchesDepartment && matchesSearch;
    });
  }, [employeeList, selectedDepartment, search]);

  const departmentOptions = useMemo(() => {
    const set = new Set(employeeList.map((emp) => emp.department));
    return ['all', ...Array.from(set)];
  }, [employeeList]);

  const effectiveStats: EmployeeStats = statsData || {
    totalEmployees: employeeList.length,
    onLeave: employeeList.filter((emp) => emp.status === 'on_leave').length,
    pendingDocuments: employeeList.reduce(
      (acc, emp) => acc + (emp.documents?.filter((doc) => doc.status === 'pending').length ?? 0),
      0
    ),
    onboarding: 3,
  };

  const handleAddNote = async () => {
    if (!isAdmin || !selectedEmployee) {
      return;
    }
    if (!note.trim()) {
      addToast('Not içeriği boş olamaz', 'warning');
      return;
    }

    setSavingNote(true);
    const result = await api.addEmployeeNote(selectedEmployee.id, note.trim());
    setSavingNote(false);

    if (result.status === 200) {
      addToast('Not kaydedildi', 'success');
      setNote('');
    } else {
      addToast(result.error || 'Not kaydedilemedi', 'error');
    }
  };

  const handleUploadDocument = async () => {
    if (!isAdmin || !selectedEmployee) {
      return;
    }
    if (!documentTitle.trim()) {
      addToast('Belge başlığı gerekli', 'warning');
      return;
    }

    setSavingDocument(true);
    const result = await api.uploadEmployeeDocument(selectedEmployee.id, {
      title: documentTitle.trim(),
      type: documentType,
    });
    setSavingDocument(false);

    if (result.status === 200) {
      const newDoc: EmployeeDocument = {
        id: Date.now(),
        title: documentTitle.trim(),
        type: documentType,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'pending',
        uploadedBy: 'Siz',
      };
      setEmployeeData((prev) =>
        prev
          ? prev.map((emp) =>
              emp.id === selectedEmployee.id
                ? { ...emp, documents: [...(emp.documents || []), newDoc] }
                : emp
            )
          : prev
      );
      addToast('Belge yükleme kuyruğuna alındı 📂', 'info');
      setDocumentTitle('');
      setDocumentType('other');
    } else {
      addToast(result.error || 'Belge yüklenemedi', 'error');
    }
  };

  const handleManualRefresh = () => fetchEmployeeData(true);

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
          <div className="flex flex-col md:items-end gap-2 text-right">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Çalışan özlük kayıtları, belgeler ve aksiyonlar tek ekranda.</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Yalnızca yetkili kullanıcılar düzenleme yapabilir.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center px-4 py-2 rounded-2xl border border-primary-200 dark:border-primary-800 text-sm font-semibold text-primary-700 dark:text-primary-200 bg-primary-50 dark:bg-primary-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRefreshing ? 'Yenileniyor...' : 'Verileri Yenile'}
              </button>
              {isAdmin && (
                <button
                  onClick={onAddEmployee}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-2xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
                >
                  <span>➕</span>
                  <span>Çalışan Ekle</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {loadError} • Demo verileri gösteriliyor.
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary-500 font-semibold">Employee Hub</p>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Çalışan Yönetim Merkezi</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
                Tüm çalışanların özlük dosyalarını, belgelerini ve güncel durumlarını yönetin. Belgeler yükleyin, not ekleyin ve
                aksiyonları takip edin.
              </p>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl px-4 py-3 text-sm text-primary-700 dark:text-primary-200">
              {userRole === 'admin'
                ? 'Yönetici hesabı ile gelen talepleri onaylayabilir, belgeleri düzenleyebilirsiniz.'
                : 'Okuma modundasınız. Belgeler ve bilgiler yalnızca görüntülenebilir.'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Toplam Çalışan" value={effectiveStats.totalEmployees} accent="from-blue-500 to-indigo-600" icon="" />
            <SummaryCard label="İzinde" value={effectiveStats.onLeave} accent="from-amber-500 to-orange-500" icon="" />
            <SummaryCard
              label="Bekleyen Belgeler"
              value={effectiveStats.pendingDocuments}
              accent="from-rose-500 to-pink-500"
              icon="📄"
            />
            <SummaryCard label="Onboarding" value={effectiveStats.onboarding} accent="from-emerald-500 to-green-600" icon="" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Çalışan Listesi</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Filtreleyin, arayın ve birini seçerek detayları inceleyin.</p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === 'all' ? 'Tüm Departmanlar' : dept}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Çalışan ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {isLoading ? (
                <div className="w-full flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
                  Çalışan verileri yükleniyor...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="w-full flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
                  Sonuç bulunamadı.
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                      selectedEmployeeId === employee.id
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 hover:border-primary-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{employee.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {employee.role} • {employee.department}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(employee.status)}`}>
                      {employee.status === 'active'
                        ? 'Aktif'
                        : employee.status === 'on_leave'
                        ? 'İzinde'
                        : 'Ayrıldı'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-lg space-y-5">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Detay Paneli</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-lg font-bold">
                  {selectedEmployee.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{selectedEmployee.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{selectedEmployee.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <p>Departman: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedEmployee.department}</span></p>
                <p>Durum: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedEmployee.status === 'active' ? 'Aktif' : selectedEmployee.status === 'on_leave' ? 'İzinde' : 'Ayrıldı'}</span></p>
                <p>Başlangıç: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedEmployee.startDate}</span></p>
                <p>Lokasyon: <span className="font-semibold text-neutral-700 dark:text-neutral-200">{selectedEmployee.location}</span></p>
              </div>
              <div className="text-xs">
                <p className="text-neutral-500 dark:text-neutral-400">E-posta</p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100 break-all">{selectedEmployee.email}</p>
              </div>
              {selectedEmployee.phone && (
                <div className="text-xs">
                  <p className="text-neutral-500 dark:text-neutral-400">Telefon</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100 break-all">{selectedEmployee.phone}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Belge Durumu</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {selectedEmployee.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100">{doc.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {doc.uploadedAt} • {doc.uploadedBy}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${documentBadge(doc.status)}`}>
                      {doc.status === 'approved'
                        ? 'Onaylandı'
                        : doc.status === 'pending'
                        ? 'Beklemede'
                        : 'Reddedildi'}
                    </span>
                  </div>
                )) || (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Belge bulunamadı</p>
                )}
              </div>
            </div>

            {userRole === 'admin' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Yeni Not</h3>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Görüşme notu, uyarı veya hızlı aksiyon..."
                    className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote}
                    className="mt-2 w-full py-2 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Belge Yükle</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Belge başlığı"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                    />
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as EmployeeDocument['type'])}
                      className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                    >
                      <option value="contract">Sözleşme</option>
                      <option value="performance">Performans</option>
                      <option value="discipline">Disiplin</option>
                      <option value="other">Diğer</option>
                    </select>
                    <button
                      onClick={handleUploadDocument}
                      disabled={savingDocument}
                      className="w-full py-2 rounded-2xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingDocument ? 'Yükleniyor...' : 'Belgeyi Kaydet'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: number;
  icon: string;
  accent: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, accent }) => (
  <div className="bg-gradient-to-br from-white/90 to-white/40 dark:from-neutral-800/70 dark:to-neutral-900/50 rounded-2xl p-4 border border-white/40 dark:border-neutral-800 shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <div className="text-2xl">{icon}</div>
      <span className="text-xs font-semibold text-neutral-500 uppercase">{label}</span>
    </div>
    <p className="text-4xl font-black text-neutral-900 dark:text-white">{value}</p>
    <div className="mt-3 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${accent} rounded-full`} style={{ width: Math.min(value * 5, 100) + '%' }} />
    </div>
  </div>
);

export default EmployeeManagementPage;


