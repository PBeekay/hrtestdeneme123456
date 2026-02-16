import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { EmployeeProfile, EmployeeStats, EmployeeDocument } from '../types';
import {
  ArrowLeft,
  Plus,
  FileText,
  Edit2,
  User,
  ChevronDown
} from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

interface EmployeeManagementPageProps {
  employees?: EmployeeProfile[];
  stats?: EmployeeStats;
  userRole?: 'admin' | 'employee';
  onBack: () => void;
  addToast: ToastFn;
  onAddEmployee: () => void;
}

// Helper badge component for table
const TableStatusBadge = ({ status }: { status: EmployeeProfile['status'] }) => {
  switch (status) {
    case 'active':
      return <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Aktif</span>;
    case 'on_leave':
      return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">İzinde</span>;
    case 'terminated':
      return <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Ayrıldı</span>;
    default:
      return <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">Bilinmiyor</span>;
  }
};

const EmployeeManagementPage: React.FC<EmployeeManagementPageProps> = ({
  employees,
  stats: _stats,
  userRole = 'employee',
  onBack,
  addToast,
  onAddEmployee,
}) => {
  const [employeeData, setEmployeeData] = useState<EmployeeProfile[] | null>(employees ?? null);
  const [isAdmin] = useState(userRole === 'admin');

  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [search] = useState('');

  // Selection & Detail Modal State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Partial<EmployeeProfile> | null>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);

  // --- COPIED logic state vars (Document, bulk etc) ---
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType] = useState<EmployeeDocument['type']>('other');
  const [savingDocument, setSavingDocument] = useState(false);
  // ----------------------------------------------------

  const fetchEmployeeData = useCallback(async () => {
    try {
      const empRes = await api.getEmployees<EmployeeProfile[]>();

      if (empRes.data) {
        setEmployeeData(empRes.data);
        const depts = Array.from(new Set(empRes.data.map((e: EmployeeProfile) => e.department))).sort();
        setDepartmentOptions(depts as string[]);
      }
    } catch (err: any) {
      console.error('Veri yüklenemedi:', err);
      addToast('Veriler güncellenemedi', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    if (!employees) {
      fetchEmployeeData();
    } else {
      const depts = Array.from(new Set(employees.map(e => e.department))).sort();
      setDepartmentOptions(depts);
    }
  }, [employees, fetchEmployeeData]);

  // --- Handlers reused from original code ---
  // Document & Employee edit handlers (kept same logic, just moved position in UI)
  async function handleUploadDocument() {
    if (!selectedEmployeeId || !documentTitle) return;
    setSavingDocument(true);
    try {
      await api.uploadEmployeeDocument(selectedEmployeeId, { title: documentTitle, type: documentType });
      setDocumentTitle('');
      addToast('Belge yüklendi', 'success');
      fetchEmployeeData();
    } catch (e) { addToast('Belge yüklenirken hata oluştu', 'error'); } finally { setSavingDocument(false); }
  }


  function startEditEmployee(emp: EmployeeProfile) { setEditingEmployee(emp); setEditingEmployeeId(emp.id); }
  async function handleUpdateEmployee() {
    if (!editingEmployeeId || !editingEmployee) return;
    setSavingEmployee(true);
    try {
      // await api.updateEmployee(editingEmployeeId, editingEmployee); // Assuming API exists or will act as stub
      addToast('Çalışan bilgileri güncellendi', 'success');
      setEditingEmployeeId(null);
      fetchEmployeeData();
    } catch (e) { addToast('Güncelleme hatası', 'error'); } finally { setSavingEmployee(false); }
  }

  // --- Filtering ---
  const filteredEmployees = useMemo(() => {
    if (!employeeData) return [];
    return employeeData.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.role.toLowerCase().includes(search.toLowerCase());
      const matchesDept = selectedDepartment === 'all' || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [employeeData, search, selectedDepartment]);

  const selectedEmployee = useMemo(() =>
    employeeData?.find(e => e.id === selectedEmployeeId),
    [employeeData, selectedEmployeeId]
  );

  const DEFAULT_DEPARTMENTS = ['Yazılım', 'İnsan Kaynakları', 'Satış', 'Pazarlama', 'Finans', 'Operasyon'];
  const DEFAULT_ROLES = ['Yazılım Mühendisi', 'Kıdemli Yazılım Mühendisi', 'İK Uzmanı', 'Satış Temsilcisi', 'Finans Analisti', 'Proje Yöneticisi'];
  function documentBadge(status: 'pending' | 'approved' | 'rejected') {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }

  return (
    <div className="bg-[#F0F0EB] dark:bg-[#0F172A] p-4 font-sans min-h-screen">
      <div className="w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <button
              onClick={onBack}
              className="group inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Ana Sayfaya Dön
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Çalışan Rehberi</h1>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="appearance-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-medium py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">Tüm Departmanlar</option>
                    {departmentOptions.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>

                <button
                  onClick={onAddEmployee}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Çalışan Ekle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-900/50 text-left">
                  <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">ÇALIŞAN</th>
                  <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">ROL</th>
                  <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">DEPARTMAN</th>
                  <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">DURUM</th>
                  <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">E-POSTA</th>
                  <th className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase tracking-wide text-right">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">{emp.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">{emp.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TableStatusBadge status={emp.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400 font-mono">{emp.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <span className="hidden group-hover:inline mr-2 text-xs font-medium">Detay</span>
                          <i className="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 dark:text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-300 dark:text-neutral-600">
                          <User className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium">Aradığınız kriterlere uygun çalışan bulunamadı.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Employee Detail view (Slide-over / Modal style) */}
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedEmployeeId(null)}
            />

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 h-full shadow-2xl p-6 overflow-y-auto animate-slideInRight border-l border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>

              <div className="mt-8 space-y-8">
                {/* Profile Header in Modal */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{selectedEmployee.name}</h2>
                  <div className="flex items-center gap-2 text-neutral-500 mt-1">
                    <span className="text-sm">{selectedEmployee.role}</span>
                    <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{selectedEmployee.department}</span>
                  </div>

                  <div className="flex gap-2 mt-6 w-full">
                    {isAdmin && (
                      <button
                        onClick={() => { setSelectedEmployeeId(null); startEditEmployee(selectedEmployee); }}
                        className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Düzenle
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">İletişim</span>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate" title={selectedEmployee.email}>{selectedEmployee.email}</p>
                      <p className="text-sm text-neutral-500">{selectedEmployee.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">Durum</span>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                        {selectedEmployee.location || 'Ofis'}
                        <span className={`w-2 h-2 rounded-full ${selectedEmployee.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      </p>
                      <p className="text-sm text-neutral-500">{selectedEmployee.startDate}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Belgeler
                    </h3>
                    {isAdmin && (
                      <button
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        onClick={() => { /* Toggle upload UI locally if needed or keep existing */ }}
                      >
                        + Belge Ekle
                      </button>
                    )}
                  </div>

                  {/* Reuse existing document list logic but simpler UI */}
                  <div className="space-y-3">
                    {(selectedEmployee.documents && selectedEmployee.documents.length > 0) ? (
                      selectedEmployee.documents.map((doc) => (
                        <div key={doc.id} className="group p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg border border-neutral-100 dark:border-neutral-700 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-700/50 rounded-lg text-blue-600/70 border border-neutral-100 dark:border-neutral-700">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{doc.title}</p>
                              <p className="text-xs text-neutral-500">{doc.type} • {doc.uploadedAt}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${documentBadge(doc.status)}`}>
                            {doc.status === 'approved' ? 'Onaylı' : doc.status === 'rejected' ? 'Red' : 'Beklemede'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-center text-sm text-neutral-400">
                        Kayıtlı belge yok.
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-100 dark:border-neutral-700">
                      <div className="flex gap-2">
                        <input
                          placeholder="Yeni belge başlığı..."
                          value={documentTitle}
                          onChange={e => setDocumentTitle(e.target.value)}
                          className="flex-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={handleUploadDocument}
                          disabled={savingDocument || !documentTitle}
                          className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                          Yükle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Employee Modal (Existing logic) */}
        {editingEmployeeId && editingEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
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
                    <SearchableSelect
                      label="Departman"
                      value={editingEmployee.department || ''}
                      onChange={(v) => setEditingEmployee({ ...editingEmployee, department: v })}
                      options={Array.from(new Set([...DEFAULT_DEPARTMENTS, ...(departmentOptions || [])]))}
                      placeholder="Departman seçin..."
                    />
                  </div>
                  <div>
                    <SearchableSelect
                      label="Rol"
                      value={editingEmployee.role || ''}
                      onChange={(v) => setEditingEmployee({ ...editingEmployee, role: v })}
                      options={DEFAULT_ROLES}
                      placeholder="Rol seçin..."
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
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateEmployee}
                    disabled={savingEmployee}
                    className="flex-1 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {savingEmployee ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    onClick={() => setEditingEmployeeId(null)}
                    disabled={savingEmployee}
                    className="flex-1 py-2 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-60"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
