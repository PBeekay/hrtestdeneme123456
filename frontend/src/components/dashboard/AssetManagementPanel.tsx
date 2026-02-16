import React, { useState, useEffect } from 'react';
import { AllAssets, AssetCategory, AssetStatistics } from '../../types';
import api from '../../services/api';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  ArrowLeft,
  Package,
  Search,
  Filter,
  Plus,
  FileText,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react';

interface AssetManagementPanelProps {
  onClose?: () => void; // Keep for backward compatibility if needed, but onBack is preferred
  onBack?: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AssetManagementPanel: React.FC<AssetManagementPanelProps> = ({ onClose, onBack, onSuccess, onError }) => {
  // Use onBack or onClose generically
  const handleBack = onBack || onClose || (() => { });

  const [assets, setAssets] = useState<AllAssets[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AllAssets | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
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

  const [formData, setFormData] = useState({
    employee_id: '',
    asset_name: '',
    category_id: '',
    serial_number: '',
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    document_url: '',
    document_filename: '',
    notes: ''
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'returned' | 'damaged' | 'lost'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.getAllAssets();
      if (result.data) {
        setAssets(result.data.assets || []);
        setStatistics(result.data.statistics || null);
      }
    } catch (err) {
      onError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await api.getAssetCategories();
      if (result.data) {
        setCategories(result.data.categories || []);
      }
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onError('Dosya boyutu maksimum 10MB olabilir');
      return;
    }

    setUploadingFile(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          document_url: `http://localhost:8000${data.url}`,
          document_filename: data.filename
        }));
        onSuccess('Dosya başarıyla yüklendi');
      } else {
        const errorData = await response.json();
        onError(typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : (errorData.detail || 'Dosya yüklenirken hata oluştu'));
      }
    } catch (err) {
      onError('Dosya yüklenirken hata oluştu');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.asset_name || !formData.category_id) {
      onError('Lütfen gerekli alanları doldurun');
      return;
    }

    try {
      if (editingAsset) {
        const result = await api.updateAsset(editingAsset.id, formData);
        if (result.data) {
          onSuccess('Zimmet kaydı güncellendi');
          resetForm();
          fetchData();
        } else {
          onError(typeof result.error === 'object' ? JSON.stringify(result.error) : (result.error || 'Güncelleme başarısız'));
        }
      } else {
        const result = await api.createAsset(formData);
        if (result.data) {
          onSuccess('Zimmet kaydı oluşturuldu');
          resetForm();
          fetchData();
        } else {
          onError(typeof result.error === 'object' ? JSON.stringify(result.error) : (result.error || 'Oluşturma başarısız'));
        }
      }
    } catch (err) {
      onError('İşlem sırasında hata oluştu');
    }
  };

  const handleReturn = (assetId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'İade Onayı',
      message: 'Bu eşya iade edildi olarak işaretlenecek. Onaylıyor musunuz?',
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await api.returnAsset(assetId);
          if (result.data) {
            onSuccess('Eşya iade edildi');
            fetchData();
          } else {
            onError(typeof result.error === 'object' ? JSON.stringify(result.error) : (result.error || 'İade işlemi başarısız'));
          }
        } catch (err) {
          onError('İade işlemi sırasında hata oluştu');
        }
      }
    });
  };

  const handleDelete = (assetId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Silme Onayı',
      message: 'Bu zimmet kaydı silinecek. Onaylıyor musunuz?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await api.deleteAsset(assetId);
          if (result.data) {
            onSuccess('Zimmet kaydı silindi');
            fetchData();
          } else {
            onError(typeof result.error === 'object' ? JSON.stringify(result.error) : (result.error || 'Silme işlemi başarısız'));
          }
        } catch (err) {
          onError('Silme işlemi sırasında hata oluştu');
        }
      }
    });
  };

  const handleEdit = (asset: AllAssets) => {
    setEditingAsset(asset);
    setFormData({
      employee_id: asset.employeeId.toString(),
      asset_name: asset.assetName,
      category_id: categories.find(c => c.name === asset.categoryName)?.id.toString() || '',
      serial_number: asset.serialNumber || '',
      description: asset.description || '',
      assigned_date: asset.assignedDate,
      document_url: asset.documentUrl || '',
      document_filename: asset.documentFilename || '',
      notes: asset.notes || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      asset_name: '',
      category_id: '',
      serial_number: '',
      description: '',
      assigned_date: new Date().toISOString().split('T')[0],
      document_url: '',
      document_filename: '',
      notes: ''
    });
    setEditingAsset(null);
    setShowAddForm(false);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = filterStatus === 'all' || asset.status === filterStatus;
    const matchesSearch = asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      returned: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400',
      damaged: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    const icons = {
      active: <CheckCircle className="w-3 h-3" />,
      returned: <Clock className="w-3 h-3" />,
      damaged: <AlertTriangle className="w-3 h-3" />,
      lost: <XCircle className="w-3 h-3" />
    };

    const labels = {
      active: 'Kullanımda',
      returned: 'İade Edildi',
      damaged: 'Hasarlı',
      lost: 'Kayıp'
    };

    const key = status as keyof typeof badges;
    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badges[key]}`}>
        {icons[key]} {labels[key]}
      </span>
    );
  };

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

      <div className="max-w-6xl mx-auto space-y-6 px-4">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:-translate-y-0.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kontrol Paneline Dön</span>
          </button>
          <div className="text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Şirket varlıklarını ve zimmet durumlarını yönetin.</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Tüm kayıtlar anlık güncellenir.</p>
          </div>
        </div>

        {/* Stats Header */}
        <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-xl space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-blue-500 font-semibold">Asset Inventory</p>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mt-1">
              Zimmet Yönetim Merkezi
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl">
              Bilgisayar, telefon, araç ve diğer şirket demirbaşlarının takibini buradan yapabilir, zimmet ataması ve iade işlemlerini gerçekleştirebilirsiniz.
            </p>
          </div>

          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">TOPLAM EŞYA</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{statistics.total_count}</div>
                </div>
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">KULLANIMDA</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{statistics.active_count}</div>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">İADE EDİLEN</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{statistics.returned_count}</div>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <RefreshCw className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">ZİMMETLİ KİŞİ</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{statistics.employee_count}</div>
                </div>
                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form & Filters */}
          <div className="space-y-6">
            {/* Add New Button (Toggle) */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md ${showAddForm
                ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.02]'
                }`}
            >
              {showAddForm ? (
                <>
                  <ArrowLeft className="w-5 h-5" /> Formu Kapat
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Yeni Zimmet Ekle
                </>
              )}
            </button>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg animate-fadeInUp">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 border-b border-neutral-100 pb-2">
                  {editingAsset ? 'Zimmet Düzenle' : 'Yeni Kayıt'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Çalışan ID</label>
                    <input
                      type="number"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Eşya İsmi</label>
                    <input
                      type="text"
                      value={formData.asset_name}
                      onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Kategori</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none transition-colors text-sm"
                        required
                      >
                        <option value="">Seçiniz</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Seri No</label>
                      <input
                        type="text"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none transition-colors text-sm"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Zimmet Tarihi</label>
                    <input
                      type="date"
                      value={formData.assigned_date}
                      onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Belge</label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={uploadingFile}
                      />
                    </div>
                    {uploadingFile && <span className="text-xs text-blue-500">Yükleniyor...</span>}
                    {formData.document_filename && <span className="text-xs text-green-600 block mt-1">✓ {formData.document_filename}</span>}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Kaydet
                    </button>
                    <button type="button" onClick={resetForm} className="flex-1 bg-neutral-100 text-neutral-600 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filters Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                Filtrele
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Eşya veya kişi ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:border-blue-500 outline-none text-sm"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-2">DURUM</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'active', 'returned', 'damaged', 'lost'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === status
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                      >
                        {status === 'all' ? 'Tümü' :
                          status === 'active' ? 'Aktif' :
                            status === 'returned' ? 'İade' :
                              status === 'damaged' ? 'Hasarlı' : 'Kayıp'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Asset List */}
          <div className="lg:col-span-2">
            <div className="bg-stone-50 dark:bg-neutral-900 rounded-3xl p-6 border border-stone-200/50 dark:border-neutral-800 shadow-xl min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Zimmet Listesi</h2>
                <div className="text-sm text-neutral-500">
                  Toplam <strong className="text-neutral-900">{filteredAssets.length}</strong> kayıt
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-neutral-400">Yükleniyor...</div>
                ) : filteredAssets.length === 0 ? (
                  <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-neutral-200">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                      <Package className="w-8 h-8" />
                    </div>
                    <p className="text-neutral-500 font-medium">Böyle bir kayıt bulunamadı.</p>
                    <button onClick={resetForm} className="text-blue-600 text-sm mt-2 hover:underline">Filtreleri Temizle</button>
                  </div>
                ) : (
                  filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-2xl">
                            {asset.categoryIcon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-neutral-800 dark:text-white">{asset.assetName}</h4>
                              {getStatusBadge(asset.status)}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {asset.employeeName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" /> {asset.categoryName}
                              </span>
                              {asset.serialNumber && (
                                <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">SN: {asset.serialNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {asset.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleEdit(asset)}
                                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReturn(asset.id)}
                                className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                title="İade Al"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Info / Footer */}
                      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Veriliş: {new Date(asset.assignedDate).toLocaleDateString('tr-TR')}
                          </span>
                          {asset.returnDate && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-3 h-3" /> İade: {new Date(asset.returnDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                        {asset.documentUrl && (
                          <a
                            href={asset.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> Belgeyi Gör
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetManagementPanel;
