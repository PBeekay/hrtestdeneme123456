import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SearchableSelect from '../components/ui/SearchableSelect';
import { Upload, FileText, X } from 'lucide-react';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

interface EmployeeCreatePageProps {
  userRole?: 'admin' | 'employee';
  onBack: () => void;
  addToast: ToastFn;
}

const initialForm = {
  name: '',
  email: '',
  department: '',
  role: '',
  phone: '',
  location: '',
  startDate: '',
  status: 'active',
  user_role: 'employee',
};

// Predefined lists for suggestions
const DEFAULT_ROLES = [
  'Yazılım Mühendisi', 'Kıdemli Yazılım Mühendisi', 'Takım Lideri',
  'Ürün Yöneticisi', 'Proje Yöneticisi', 'İş Analisti',
  'İK Uzmanı', 'İK Yöneticisi', 'İşe Alım Uzmanı',
  'Satış Temsilcisi', 'Pazarlama Uzmanı', 'Finans Uzmanı',
  'Grafik Tasarımcı', 'UI/UX Tasarımcı', 'QA Mühendisi'
];

const DEFAULT_DEPARTMENTS = [
  'Bilgi Teknolojileri (IT)', 'İnsan Kaynakları', 'Finans & Muhasebe',
  'Satış & Pazarlama', 'Operasyon', 'Yönetim', 'Hukuk'
];

const EmployeeCreatePage: React.FC<EmployeeCreatePageProps> = ({ userRole, onBack, addToast }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(DEFAULT_DEPARTMENTS);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const res = await api.getDepartments();
        if (res.data && Array.isArray(res.data)) {
          const apiDeps = res.data.map((d: any) => d.name || d);
          setDepartmentOptions(prev => Array.from(new Set([...prev, ...apiDeps])));
        }
      } catch (e) {
        console.log('Departments fetch failed, using defaults');
      }
    };
    fetchDeps();
  }, []);

  const isFormValid = useMemo(() => {
    return (
      formData.name.trim().length >= 3 &&
      /^\S+@\S+\.\S+$/.test(formData.email) &&
      formData.department.trim().length > 0 &&
      formData.role.trim().length > 0 &&
      formData.startDate.length > 0
    );
  }, [formData]);

  const updateField = (key: keyof typeof initialForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAdmin) return;

      if (!isFormValid) {
        addToast('Lütfen zorunlu alanları doldurun', 'warning');
        return;
      }

      setSubmitting(true);

      try {
        const payload = {
          ...formData,
          startDate: new Date(formData.startDate).toISOString().split('T')[0],
          permissions: formData.user_role === 'ik_manager' ? Array.from(permissions) : [],
        };

        const result = await api.createEmployee(payload);

        if (result.status === 200 || result.status === 201) {
          const data = result.data as any;
          const newEmployeeId = data?.id || (typeof data === 'number' ? data : null);

          if (documents.length > 0 && newEmployeeId) {
            let successCount = 0;
            for (const file of documents) {
              try {
                await api.uploadEmployeeDocument(newEmployeeId, {
                  title: file.name,
                  type: 'Contract'
                });
                successCount++;
              } catch (err) {
                console.error("File upload meta error", err);
              }
            }
            if (successCount > 0) {
              addToast(`Kullanıcı ve ${successCount} belge kaydedildi`, 'success');
            } else {
              addToast('Kullanıcı oluşturuldu', 'success');
            }
          } else {
            addToast('Kullanıcı başarıyla oluşturuldu', 'success');
          }

          setFormData(initialForm);
          setPermissions(new Set());
          setDocuments([]);
          navigate('/employees');
        } else {
          addToast(result.error || 'Kullanıcı oluşturulamadı', 'error');
        }
      } catch (error) {
        addToast('Beklenmedik bir hata oluştu', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [formData, permissions, documents, isAdmin, isFormValid, addToast, navigate]
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8 flex items-center justify-center">
        <div className="bg-stone-50 dark:bg-neutral-900 rounded-lg p-8 border border-stone-200/50 dark:border-neutral-800 max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Yetkisiz İşlem</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Bu sayfayı yalnızca İK yöneticileri görüntüleyebilir. Lütfen yetkili hesabınızla giriş yapın.
          </p>
          <button onClick={onBack} className="px-4 py-2 rounded-md bg-primary-600 text-white font-semibold">Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0EB] dark:bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
          >
            <span>←</span>
            <span>Çalışan Listesine Dön</span>
          </button>
          <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
            Yeni işe alımları sisteme eklemek için zorunlu alanları doldurun.
          </div>
        </div>

        <div className="bg-stone-50 dark:bg-neutral-900 rounded-lg p-6 border border-stone-200/50 dark:border-neutral-800 shadow-xl space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-500 font-semibold">Hızlı Personel Ekleme</p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">Personel Kartı Oluştur</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
              Gerekli bilgileri doldurun ve işe başlangıç evraklarını (opsiyonel) yükleyin.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hesap Türü - Radyo Kartları */}
              <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <label className="block text-sm font-bold text-blue-900 dark:text-blue-100 mb-3">
                  Kart Türü / Yetki
                </label>
                <div className="flex gap-4">
                  <RoleRadio
                    id="employee"
                    label="Personel"
                    desc="Standart çalışan hesabı"
                    selected={formData.user_role === 'employee'}
                    onSelect={() => updateField('user_role', 'employee')}
                    color="blue"
                  />
                  <RoleRadio
                    id="ik_manager"
                    label="Yönetici (IK)"
                    desc="Panel erişimi ve yönetim yetkisi"
                    selected={formData.user_role === 'ik_manager'}
                    onSelect={() => updateField('user_role', 'ik_manager')}
                    color="purple"
                  />
                </div>
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <Field label="Ad Soyad" required value={formData.name} onChange={(v: string) => updateField('name', v)} placeholder="Örn. Ahmet Yılmaz" />
                <Field label="E-posta" required value={formData.email} onChange={(v: string) => updateField('email', v)} placeholder="ahmet@company.com" type="email" />
                <Field label="Telefon" value={formData.phone} onChange={(v: string) => updateField('phone', v)} placeholder="05xx xxx xx xx" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Başlangıç *</label>
                    <input type="date" value={formData.startDate} onChange={(e) => updateField('startDate', e.target.value)} required className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Durum</label>
                    <select value={formData.status} onChange={(e) => updateField('status', e.target.value)} className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white">
                      <option value="active">Aktif</option>
                      <option value="on_leave">İzinde</option>
                      <option value="terminated">Ayrıldı</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Organizasyon Detayları */}
              <div className="space-y-4">
                <SearchableSelect
                  label="Departman"
                  required
                  value={formData.department}
                  onChange={(v) => updateField('department', v)}
                  options={departmentOptions}
                  placeholder="Departman seçin veya yazın..."
                />
                <SearchableSelect
                  label="Ünvan / Rol"
                  required
                  value={formData.role}
                  onChange={(v) => updateField('role', v)}
                  options={DEFAULT_ROLES}
                  placeholder="Ünvan seçin veya yazın..."
                />
                <Field label="Lokasyon" value={formData.location} onChange={(v: string) => updateField('location', v)} placeholder="İstanbul Ofis, Uzaktan..." />

                {/* Özlük Dosyaları Yükleme Alanı */}
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Özlük Dosyaları (Sözleşme, Kimlik vb.)</span>
                    </div>
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  <div className="space-y-2 mt-2">
                    {documents.length === 0 && (
                      <p className="text-xs text-neutral-400 text-center py-2">Dosya seçmek için tıklayın</p>
                    )}
                    {documents.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-neutral-800 p-2 rounded shadow-sm">
                        <span className="flex items-center gap-2 truncate max-w-[80%]">
                          <FileText className="w-3 h-3 text-primary-500" />
                          {file.name}
                        </span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions (IK Manager Only) */}
            {formData.user_role === 'ik_manager' && (
              <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-lg border border-purple-100 dark:border-purple-800/30 animate-fadeIn">
                <h3 className="text-md font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center">
                  🛡️ Yönetici Yetkileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'approve_leaves', label: '✅ İzin Taleplerini Onayla/Reddet' },
                    { id: 'manage_employees', label: '👥 Çalışan Ekle/Düzenle/Sil' },
                    { id: 'view_reports', label: '📊 Raporları Görüntüle' },
                    { id: 'manage_assets', label: '💻 Zimmet Yönetimi' },
                  ].map((perm) => (
                    <label key={perm.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-purple-100/50 dark:hover:bg-purple-800/20 rounded-md transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="w-full py-3 rounded-md bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'İşleniyor...' : 'Kaydet ve Tamamla'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<any> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div>
    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white" required={required} />
  </div>
);

const RoleRadio: React.FC<any> = ({ id, label, desc, selected, onSelect, color }) => (
  <div
    onClick={onSelect}
    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all flex-1 ${selected ? `bg-white dark:bg-slate-800 border-${color}-500 ring-1 ring-${color}-500 shadow-md` : 'border-neutral-200 dark:border-neutral-700 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
  >
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? `border-${color}-500` : 'border-neutral-400'}`}>
      {selected && <div className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />}
    </div>
    <div>
      <span className={`block font-semibold ${selected ? `text-${color}-900 dark:text-${color}-100` : 'text-neutral-700 dark:text-neutral-300'}`}>{label}</span>
      <span className="block text-xs text-neutral-500 dark:text-neutral-400">{desc}</span>
    </div>
  </div>
);

export default EmployeeCreatePage;
