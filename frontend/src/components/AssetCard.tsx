import React from 'react';
import { EmployeeAsset } from '../types';

interface AssetCardProps {
  assets: EmployeeAsset[];
  userRole?: 'admin' | 'employee';
  onViewDocument?: (url: string) => void;
  onManage?: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ assets, userRole, onViewDocument, onManage }) => {
  const activeAssets = assets.filter(a => a.status === 'active');
  const returnedAssets = assets.filter(a => a.status === 'returned');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (assets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with Manage Button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-lg">📦</span>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Zimmetlerim</h3>
          </div>
        {userRole === 'admin' && onManage && (
          <button
            onClick={onManage}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center space-x-1 shadow-md"
          >
            <span className="hidden sm:inline">Yönetim</span>
          </button>
        )}
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-neutral-500">Z</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Henüz zimmet kaydı bulunmuyor
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Manage Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Zimmetlerim</h3>
        </div>
          {userRole === 'admin' && onManage && (
            <button
              onClick={onManage}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center space-x-1 shadow-md"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Yönetim</span>
            </button>
          )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
          <div className="text-xl font-bold text-green-700 dark:text-green-400">
            {activeAssets.length}
          </div>
          <div className="text-[10px] text-green-600 dark:text-green-500 font-medium">
            Aktif
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-2 border border-gray-200 dark:border-gray-800">
          <div className="text-xl font-bold text-gray-700 dark:text-gray-400">
            {returnedAssets.length}
          </div>
          <div className="text-[10px] text-gray-600 dark:text-gray-500 font-medium">
            İade
          </div>
        </div>
      </div>

      {/* Active Assets List */}
      {activeAssets.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            🔹 Kullanımdaki Eşyalar
          </h4>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
            {activeAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white dark:bg-neutral-800 rounded-lg p-2 border border-neutral-200 dark:border-neutral-700 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{asset.categoryIcon}</span>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-neutral-900 dark:text-white text-xs truncate">
                        {asset.assetName}
                      </h5>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {asset.categoryName}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(asset.status)}
                </div>

                {asset.serialNumber && (
                  <div className="text-[10px] text-neutral-600 dark:text-neutral-400 mb-1 truncate">
                    <span className="font-medium">Seri:</span> {asset.serialNumber}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                  <span>📅 {formatDate(asset.assignedDate)}</span>
                  {asset.documentUrl && onViewDocument && (
                    <button
                      onClick={() => onViewDocument(asset.documentUrl!)}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      📄 Belge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returned Assets (Collapsed) */}
      {returnedAssets.length > 0 && (
        <details className="group">
          <summary className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors py-1">
            📂 İade Edilen ({returnedAssets.length})
          </summary>
          <div className="space-y-1 mt-1 max-h-[150px] overflow-y-auto custom-scrollbar">
            {returnedAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-1.5 border border-gray-200 dark:border-gray-800 opacity-70"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-base opacity-50 flex-shrink-0">{asset.categoryIcon}</span>
                    <div className="min-w-0">
                      <h5 className="font-medium text-neutral-700 dark:text-neutral-300 text-[10px] truncate">
                        {asset.assetName}
                      </h5>
                      <p className="text-[9px] text-neutral-500 dark:text-neutral-500">
                        {asset.returnDate ? formatDate(asset.returnDate) : 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
    </div>
  );
};

export default AssetCard;

