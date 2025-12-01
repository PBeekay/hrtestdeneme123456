import React, { useState, useEffect } from 'react';
import { AllAssets, AssetCategory, AssetStatistics } from '../types';
import api from '../services/api';

interface AssetManagementPanelProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AssetManagementPanel: React.FC<AssetManagementPanelProps> = ({ onClose, onSuccess, onError }) => {
  const [assets, setAssets] = useState<AllAssets[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AllAssets | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

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

    // Validate file size (10MB)
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
        onError(errorData.detail || 'Dosya yüklenirken hata oluştu');
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
          onError(result.error || 'Güncelleme başarısız');
        }
      } else {
        const result = await api.createAsset(formData);
        if (result.data) {
          onSuccess('Zimmet kaydı oluşturuldu');
          resetForm();
          fetchData();
        } else {
          onError(result.error || 'Oluşturma başarısız');
        }
      }
    } catch (err) {
      onError('İşlem sırasında hata oluştu');
    }
  };

  const handleReturn = async (assetId: number) => {
    if (!window.confirm('Bu eşya iade edildi olarak işaretlenecek. Onaylıyor musunuz?')) return;

    try {
      const result = await api.returnAsset(assetId);
      if (result.data) {
        onSuccess('Eşya iade edildi');
        fetchData();
      } else {
        onError(result.error || 'İade işlemi başarısız');
      }
    } catch (err) {
      onError('İade işlemi sırasında hata oluştu');
    }
  };

  const handleDelete = async (assetId: number) => {
    if (!window.confirm('Bu zimmet kaydı silinecek. Onaylıyor musunuz?')) return;

    try {
      const result = await api.deleteAsset(assetId);
      if (result.data) {
        onSuccess('Zimmet kaydı silindi');
        fetchData();
      } else {
        onError(result.error || 'Silme işlemi başarısız');
      }
    } catch (err) {
      onError('Silme işlemi sırasında hata oluştu');
    }
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

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      returned: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      damaged: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    
    const labels = {
      active: 'Kullanımda',
      returned: 'İade Edildi',
      damaged: 'Hasarlı',
      lost: 'Kayıp'
    };

    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>📦</span>
                <span>Zimmet Yönetimi</span>
              </h2>
              <p className="text-purple-100 text-sm mt-1">Tüm zimmet kayıtlarını yönetin</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{statistics.active_count}</div>
                <div className="text-xs text-purple-100">Aktif</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{statistics.returned_count}</div>
                <div className="text-xs text-purple-100">İade Edildi</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{statistics.total_count}</div>
                <div className="text-xs text-purple-100">Toplam</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-2xl font-bold">{statistics.employee_count || 0}</div>
                <div className="text-xs text-purple-100">Çalışan</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              + Yeni Zimmet Ekle
            </button>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-6 border-2 border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                {editingAsset ? '✏️ Zimmet Düzenle' : '➕ Yeni Zimmet Ekle'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Çalışan ID *
                    </label>
                    <input
                      type="number"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Eşya İsmi *
                    </label>
                    <input
                      type="text"
                      value={formData.asset_name}
                      onChange={(e) => setFormData({...formData, asset_name: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Kategori *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Seri Numarası
                    </label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Zimmet Tarihi *
                    </label>
                    <input
                      type="date"
                      value={formData.assigned_date}
                      onChange={(e) => setFormData({...formData, assigned_date: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Belge Yükle
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      disabled={uploadingFile}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm"
                    />
                    {uploadingFile && <p className="text-xs text-purple-600 mt-1">Yükleniyor...</p>}
                    {formData.document_filename && (
                      <p className="text-xs text-green-600 mt-1">✓ {formData.document_filename}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    {editingAsset ? 'Güncelle' : 'Ekle'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-neutral-800 dark:text-neutral-200 font-semibold py-2 px-4 rounded-lg transition-all"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assets List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-neutral-600 dark:text-neutral-400">Yükleniyor...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-neutral-600 dark:text-neutral-400">Henüz zimmet kaydı bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white dark:bg-neutral-700 rounded-xl p-4 border border-neutral-200 dark:border-neutral-600 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{asset.categoryIcon}</span>
                        <div>
                          <h4 className="font-bold text-neutral-900 dark:text-white">{asset.assetName}</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            👤 {asset.employeeName} • {asset.categoryName}
                          </p>
                        </div>
                        {getStatusBadge(asset.status)}
                      </div>
                      {asset.serialNumber && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                          🔢 Seri: {asset.serialNumber}
                        </p>
                      )}
                      {asset.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">{asset.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>📅 Zimmet: {new Date(asset.assignedDate).toLocaleDateString('tr-TR')}</span>
                        {asset.returnDate && (
                          <span>📥 İade: {new Date(asset.returnDate).toLocaleDateString('tr-TR')}</span>
                        )}
                        {asset.documentUrl && (
                          <a
                            href={asset.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            📄 Belge
                          </a>
                        )}
                      </div>
                    </div>
                    {asset.status === 'active' && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => handleReturn(asset.id)}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          ✓ İade
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetManagementPanel;

