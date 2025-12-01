import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
  manager: '',
  location: '',
  startDate: '',
  status: 'active',
};

const EmployeeCreatePage: React.FC<EmployeeCreatePageProps> = ({ userRole, onBack, addToast }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = userRole === 'admin';

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAdmin) return;

      if (!isFormValid) {
        addToast('Lütfen zorunlu alanları doldurun', 'warning');
        return;
      }

      setSubmitting(true);
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString().split('T')[0],
      };

      const result = await api.createEmployee(payload);
      setSubmitting(false);

      if (result.status === 200 || result.status === 201) {
        addToast('Çalışan başarıyla oluşturuldu 🎉', 'success');
        setFormData(initialForm);
        navigate('/employees');
      } else {
        addToast(result.error || 'Çalışan oluşturulamadı', 'error');
      }
    },
    [formData, isAdmin, isFormValid, addToast, navigate]
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-white/20 dark:border-neutral-800 max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Yetkisiz İşlem</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Bu sayfayı yalnızca İK yöneticileri görüntüleyebilir. Lütfen yetkili hesabınızla giriş yapın.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
          >
            <span>←</span>
            <span>Çalışan Listesine Dön</span>
          </button>
          <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
            Yeni işe alımları sisteme eklemek için zorunlu alanları doldurun. Belgeler daha sonra eklenebilir.
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-white/30 dark:border-neutral-800 shadow-xl space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-500 font-semibold">Yeni Çalışan</p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">Çalışan Ekle</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
              Kimlik bilgileri, iletişim ve pozisyon detaylarını girerek yeni çalışanı sisteme ekleyin.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Ad Soyad"
                required
                value={formData.name}
                onChange={(v) => updateField('name', v)}
                placeholder="Örn. Elif Yılmaz"
              />
              <Field
                label="E-posta"
                required
                value={formData.email}
                onChange={(v) => updateField('email', v)}
                placeholder="elif.yilmaz@company.com"
                type="email"
              />
              <Field
                label="Departman"
                required
                value={formData.department}
                onChange={(v) => updateField('department', v)}
                placeholder="İK, Teknoloji, Finans..."
              />
              <Field
                label="Rol / Ünvan"
                required
                value={formData.role}
                onChange={(v) => updateField('role', v)}
                placeholder="Kıdemli Yazılım Geliştirici"
              />
              <Field
                label="Yönetici"
                value={formData.manager}
                onChange={(v) => updateField('manager', v)}
                placeholder="Birinci seviye yönetici"
              />
              <Field
                label="Telefon"
                value={formData.phone}
                onChange={(v) => updateField('phone', v)}
                placeholder="+90 5xx xxx xx xx"
              />
              <Field
                label="Lokasyon"
                value={formData.location}
                onChange={(v) => updateField('location', v)}
                placeholder="İstanbul, Ankara..."
              />
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Başlangıç Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
                >
                  <option value="active">Aktif</option>
                  <option value="on_leave">İzinde</option>
                  <option value="terminated">Ayrıldı</option>
                </select>
              </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl px-4 py-3 text-sm text-primary-700 dark:text-primary-200">
              Belgeler ve zimmetler otomatik atanmaz. Çalışan eklendikten sonra ilgili panellerden ek işlem yapabilirsiniz.
            </div>

            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Kaydediliyor...' : 'Çalışanı Kaydet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div>
    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
      required={required}
    />
  </div>
);

export default EmployeeCreatePage;


