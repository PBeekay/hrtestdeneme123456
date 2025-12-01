import React, { useState } from 'react';
import { LeaveRequest } from '../types';

interface LeaveRequestCardProps {
  leaveRequests: LeaveRequest[];
  onCreateRequest: (request: Partial<LeaveRequest>) => void;
}

const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ leaveRequests, onCreateRequest }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    leaveType: 'annual' | 'sick' | 'personal';
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'pending': return 'Bekliyor';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'annual': return 'Yıllık';
      case 'sick': return 'Hastalık';
      case 'personal': return 'Kişisel';
      default: return type;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    onCreateRequest({
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      totalDays
    } as Partial<LeaveRequest>);
    
    setFormData({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
    setShowForm(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📝</span>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">İzin Talepleri</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] text-white bg-primary-600 hover:bg-primary-700 font-semibold px-2.5 py-1 rounded-full transition-colors"
        >
          {showForm ? 'İptal' : '+ Yeni Talep'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl space-y-2">
          <select
            value={formData.leaveType}
            onChange={(e) => setFormData({...formData, leaveType: e.target.value as 'annual' | 'sick' | 'personal'})}
            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
            required
          >
            <option value="annual">Yıllık İzin</option>
            <option value="sick">Hastalık İzni</option>
            <option value="personal">Kişisel İzin</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="px-2 py-1.5 text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
              required
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="px-2 py-1.5 text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white"
              required
            />
          </div>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Neden..."
            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white resize-none"
            rows={2}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
          >
            Talep Gönder
          </button>
        </form>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px]">
        {leaveRequests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-neutral-500 dark:text-neutral-400">
            <p>Henüz izin talebi yok</p>
          </div>
        ) : (
          leaveRequests.map((request) => (
            <div
              key={request.id}
              className="p-2.5 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-600"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {getTypeText(request.leaveType)} - {request.totalDays} gün
                  </p>
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    {request.startDate} → {request.endDate}
                  </p>
                  {request.reason && (
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-1 italic">
                      {request.reason}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveRequestCard;

