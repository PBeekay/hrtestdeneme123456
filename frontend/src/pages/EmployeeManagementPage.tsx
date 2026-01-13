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

interface SummaryCardProps {
  label: string;
  value: number;
  icon: string;
  accent: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, accent }) => (
  <div className="bg-gradient-to-br from-white/90 to-white/40 dark:from-neutral-800/70 dark:to-neutral-900/50 rounded-md p-4 border border-white/40 dark:border-neutral-800 shadow-lg">
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

  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState<EmployeeDocument['type']>('other');
  const [savingDocument, setSavingDocument] = useState(false);

  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
  const [editingDocumentTitle, setEditingDocumentTitle] = useState('');
  const [editingDocumentType, setEditingDocumentType] = useState<EmployeeDocument['type']>('other');

  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Partial<EmployeeProfile> | null>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [approvingDocumentId, setApprovingDocumentId] = useState<number | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    documentId: number;
    documentTitle: string;
  }>({ isOpen: false, documentId: 0, documentTitle: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    department: 'all',
    role: '',
  });
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
      const matchesDepartment = (selectedDepartment === 'all' || emp.department === selectedDepartment) &&
        (advancedFilters.department === 'all' || emp.department === advancedFilters.department);
      const matchesStatus = advancedFilters.status === 'all' || emp.status === advancedFilters.status;
      const matchesRole = !advancedFilters.role || emp.role.toLowerCase().includes(advancedFilters.role.toLowerCase());
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.role.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      return matchesDepartment && matchesStatus && matchesRole && matchesSearch;
    });
  }, [employeeList, selectedDepartment, search, advancedFilters]);

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
      fetchEmployeeData(); // Refresh to get updated documents
    } else {
      addToast(result.error || 'Belge yüklenemedi', 'error');
    }
  };

  const handleUpdateDocument = async () => {
    if (!isAdmin || !selectedEmployee || !editingDocumentId) {
      return;
    }
    if (!editingDocumentTitle.trim()) {
      addToast('Belge başlığı gerekli', 'warning');
      return;
    }

    setSavingDocument(true);
    const result = await api.updateEmployeeDocument(selectedEmployee.id, editingDocumentId, {
      title: editingDocumentTitle.trim(),
      type: editingDocumentType,
    });
    setSavingDocument(false);

    if (result.status === 200) {
      addToast('Belge güncellendi', 'success');
      setEditingDocumentId(null);
      setEditingDocumentTitle('');
      setEditingDocumentType('other');
      fetchEmployeeData(); // Refresh to get updated documents
    } else {
      addToast(result.error || 'Belge güncellenemedi', 'error');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!isAdmin || !selectedEmployee) {
      return;
    }
    if (!window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    setDeletingDocumentId(documentId);
    const result = await api.deleteEmployeeDocument(selectedEmployee.id, documentId);
    setDeletingDocumentId(null);

    if (result.status === 200) {
      addToast('Belge silindi', 'success');
      fetchEmployeeData(); // Refresh to get updated documents
    } else {
      addToast(result.error || 'Belge silinemedi', 'error');
    }
  };



  const startEditDocument = (doc: EmployeeDocument) => {
    setEditingDocumentId(doc.id);
    setEditingDocumentTitle(doc.title);
    setEditingDocumentType(doc.type);
  };

  const cancelEditDocument = () => {
    setEditingDocumentId(null);
    setEditingDocumentTitle('');
    setEditingDocumentType('other');
  };

  const startEditEmployee = (employee: EmployeeProfile) => {
    setEditingEmployeeId(employee.id);
    setEditingEmployee({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      phone: employee.phone,
      location: employee.location,
      startDate: employee.startDate,
      status: employee.status,
    });
  };

  const cancelEditEmployee = () => {
    setEditingEmployeeId(null);
    setEditingEmployee(null);
  };

  const handleUpdateEmployee = async () => {
    if (!isAdmin || !selectedEmployee || !editingEmployeeId || !editingEmployee) {
      return;
    }

    setSavingEmployee(true);
    const result = await api.updateEmployee(editingEmployeeId, editingEmployee);
    setSavingEmployee(false);

    if (result.status === 200) {
      addToast('Çalışan bilgileri güncellendi', 'success');
      setEditingEmployeeId(null);
      setEditingEmployee(null);
      fetchEmployeeData(); // Refresh employee data
    } else {
      addToast(result.error || 'Çalışan güncellenemedi', 'error');
    }
  };

  const handleDeleteEmployee = async (employeeId: number, deactivateOnly: boolean = true) => {
    if (!isAdmin) {
      return;
    }
    const action = deactivateOnly ? 'devre dışı bırakmak' : 'silmek';
    if (!window.confirm(`Bu çalışanı ${action} istediğinizden emin misiniz?`)) {
      return;
    }

    const result = await api.deleteEmployee(employeeId, deactivateOnly);
    if (result.status === 200) {
      const message = (result.data as any)?.message || `Çalışan ${deactivateOnly ? 'devre dışı bırakıldı' : 'silindi'}`;
      addToast(message, 'success');
      fetchEmployeeData(); // Refresh employee data
    } else {
      addToast(result.error || 'İşlem başarısız', 'error');
    }
  };

  const handleApproveDocument = async (documentId: number, approved: boolean) => {
    if (!isAdmin || !selectedEmployee) {
      return;
    }

    if (!approved && !rejectionReason.trim()) {
      addToast('Red nedeni gerekli', 'warning');
      return;
    }

    setApprovingDocumentId(documentId);
    const result = await api.approveDocument(selectedEmployee.id, documentId, approved, rejectionReason || undefined);
    setApprovingDocumentId(null);
    setApprovalDialog({ isOpen: false, documentId: 0, documentTitle: '' });
    setRejectionReason('');

    if (result.status === 200) {
      addToast(approved ? 'Belge onaylandı' : 'Belge reddedildi', approved ? 'success' : 'warning');
      fetchEmployeeData(); // Refresh to get updated documents
    } else {
      addToast(result.error || 'İşlem başarısız', 'error');
    }
  };

  const openApprovalDialog = (doc: EmployeeDocument) => {
    setApprovalDialog({ isOpen: true, documentId: doc.id, documentTitle: doc.title });
    setRejectionReason('');
  };

  const handleBulkDocumentAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (!isAdmin || selectedDocuments.length === 0) {
      return;
    }

    if (action === 'reject' && !rejectionReason.trim()) {
      addToast('Toplu red işlemi için red nedeni gerekli', 'warning');
      return;
    }

    if (action === 'delete' && !window.confirm(`${selectedDocuments.length} belgeyi silmek istediğinizden emin misiniz?`)) {
      return;
    }

    // Process each document
    let successCount = 0;
    let failCount = 0;

    for (const docId of selectedDocuments) {
      try {
        if (action === 'delete') {
          const result = await api.deleteEmployeeDocument(selectedEmployee.id, docId);
          if (result.status === 200) successCount++;
          else failCount++;
        } else {
          const result = await api.approveDocument(selectedEmployee.id, docId, action === 'approve', rejectionReason || undefined);
          if (result.status === 200) successCount++;
          else failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setSelectedDocuments([]);
    setRejectionReason('');
    addToast(`${successCount} belge işlendi${failCount > 0 ? `, ${failCount} başarısız` : ''}`, successCount > 0 ? 'success' : 'error');
    fetchEmployeeData();
  };

  const handleManualRefresh = () => fetchEmployeeData(true);

  return (
    <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
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
                className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-primary-200 dark:border-primary-800 text-sm font-semibold text-primary-700 dark:text-primary-200 bg-primary-50 dark:bg-primary-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRefreshing ? 'Yenileniyor...' : 'Verileri Yenile'}
              </button>
              {isAdmin && (
                <button
                  onClick={onAddEmployee}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-md bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
                >
                  <span>➕</span>
                  <span>Çalışan Ekle</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loadError && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {loadError} • Demo verileri gösteriliyor.
          </div>
        )}

        <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary-500 font-semibold">Employee Hub</p>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Çalışan Yönetim Merkezi</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
                Tüm çalışanların özlük dosyalarını, belgelerini ve güncel durumlarını yönetin. Belgeler yükleyin, not ekleyin ve
                aksiyonları takip edin.
              </p>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-md px-4 py-3 text-sm text-primary-700 dark:text-primary-200">
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
          <div className="lg:col-span-2 bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Çalışan Listesi</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Filtreleyin, arayın ve birini seçerek detayları inceleyin.</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
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
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm flex-1"
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <select
                    value={advancedFilters.status}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 text-xs"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="on_leave">İzinde</option>
                    <option value="terminated">Ayrıldı</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Rol ara..."
                    value={advancedFilters.role}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, role: e.target.value })}
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 text-xs flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {isLoading ? (
                <div className="w-full flex items-center justify-center rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
                  Çalışan verileri yükleniyor...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="w-full flex items-center justify-center rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
                  Sonuç bulunamadı.
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`w-full flex items-center justify-between rounded-md border px-4 py-3 transition-all group ${selectedEmployeeId === employee.id
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 hover:border-primary-200'
                      }`}
                  >
                    <button
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      className="flex-1 flex items-center justify-between text-left"
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
                    {isAdmin && (
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditEmployee(employee);
                          }}
                          className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmployee(employee.id, true);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                          title="Devre Dışı Bırak"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-lg space-y-5">
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
                  editingDocumentId === doc.id ? (
                    <div
                      key={doc.id}
                      className="rounded-md border border-purple-300 dark:border-purple-700 px-3 py-2 space-y-2 bg-purple-50 dark:bg-purple-900/20"
                    >
                      <input
                        type="text"
                        value={editingDocumentTitle}
                        onChange={(e) => setEditingDocumentTitle(e.target.value)}
                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm"
                        placeholder="Belge başlığı"
                      />
                      <select
                        value={editingDocumentType}
                        onChange={(e) => setEditingDocumentType(e.target.value as EmployeeDocument['type'])}
                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm"
                      >
                        <option value="contract">Sözleşme</option>
                        <option value="performance">Performans</option>
                        <option value="discipline">Disiplin</option>
                        <option value="other">Diğer</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateDocument}
                          disabled={savingDocument}
                          className="flex-1 py-1.5 rounded-md bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
                        >
                          {savingDocument ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          onClick={cancelEditDocument}
                          disabled={savingDocument}
                          className="flex-1 py-1.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-60"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={doc.id}
                      className="rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2 flex items-center justify-between text-sm group"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-100">{doc.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {doc.uploadedAt} • {doc.uploadedBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${documentBadge(doc.status)}`}>
                          {doc.status === 'approved'
                            ? 'Onaylandı'
                            : doc.status === 'pending'
                              ? 'Beklemede'
                              : 'Reddedildi'}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveDocument(doc.id, true)}
                                  disabled={approvingDocumentId === doc.id}
                                  className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 disabled:opacity-50"
                                  title="Onayla"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => openApprovalDialog(doc)}
                                  disabled={approvingDocumentId === doc.id}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50"
                                  title="Reddet"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => startEditDocument(doc)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                              title="Düzenle"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={deletingDocumentId === doc.id}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50"
                              title="Sil"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedDocuments([...selectedDocuments, doc.id]);
                                } else {
                                  setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                                }
                              }}
                              className="ml-1 w-3 h-3 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                              title="Toplu işlem için seç"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )) || (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Belge bulunamadı</p>
                  )}
              </div>
            </div>

            {userRole === 'admin' && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md p-4 border border-purple-200 dark:border-purple-800">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Belge Yükle</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Belge başlığı"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as EmployeeDocument['type'])}
                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                  >
                    <option value="contract">Sözleşme</option>
                    <option value="performance">Performans</option>
                    <option value="discipline">Disiplin</option>
                    <option value="other">Diğer</option>
                  </select>
                  <button
                    onClick={handleUploadDocument}
                    disabled={savingDocument}
                    className="w-full py-2 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingDocument ? 'Yükleniyor...' : 'Belgeyi Kaydet'}
                  </button>
                </div>
              </div>

            )}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {
        editingEmployeeId && editingEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Çalışan Bilgilerini Düzenle</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Ad Soyad</label>
                  <input
                    type="text"
                    value={editingEmployee.name || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Departman</label>
                    <input
                      type="text"
                      value={editingEmployee.department || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Rol</label>
                    <input
                      type="text"
                      value={editingEmployee.role || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={editingEmployee.phone || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Lokasyon</label>
                    <input
                      type="text"
                      value={editingEmployee.location || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, location: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={editingEmployee.startDate || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Durum</label>
                    <select
                      value={editingEmployee.status || 'active'}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="on_leave">İzinde</option>
                      <option value="terminated">Ayrıldı</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateEmployee}
                  disabled={savingEmployee}
                  className="flex-1 py-2 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                >
                  {savingEmployee ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={cancelEditEmployee}
                  disabled={savingEmployee}
                  className="flex-1 py-2 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-60"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Document Approval Dialog */}
      {
        approvalDialog.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Belgeyi Reddet</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                <strong>{approvalDialog.documentTitle}</strong> belgesini reddetmek için bir neden belirtin.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Red nedeni..."
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveDocument(approvalDialog.documentId, false)}
                  disabled={!rejectionReason.trim() || approvingDocumentId === approvalDialog.documentId}
                  className="flex-1 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {approvingDocumentId === approvalDialog.documentId ? 'İşleniyor...' : 'Reddet'}
                </button>
                <button
                  onClick={() => setApprovalDialog({ isOpen: false, documentId: 0, documentTitle: '' })}
                  disabled={approvingDocumentId === approvalDialog.documentId}
                  className="flex-1 py-2 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-60"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Document Operations */}
      {
        isAdmin && selectedDocuments.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-4 z-40">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {selectedDocuments.length} belge seçildi
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkDocumentAction('approve')}
                  className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  Onayla
                </button>
                <button
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      addToast('Red nedeni gerekli', 'warning');
                      return;
                    }
                    handleBulkDocumentAction('reject');
                  }}
                  className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  Reddet
                </button>
                <button
                  onClick={() => handleBulkDocumentAction('delete')}
                  className="px-3 py-1.5 rounded-md bg-neutral-600 text-white text-xs font-semibold hover:bg-neutral-700 transition-colors"
                >
                  Sil
                </button>
                <button
                  onClick={() => setSelectedDocuments([])}
                  className="px-3 py-1.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
            {selectedDocuments.length > 0 && (
              <div className="mt-2">
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Toplu red için neden (opsiyonel)"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-neutral-900 dark:text-white"
                />
              </div>
            )}
          </div>
        )
      }
    </div >
  );
};



export default EmployeeManagementPage;


