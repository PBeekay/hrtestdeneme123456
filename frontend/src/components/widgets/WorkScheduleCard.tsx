import React from 'react';
import { WorkDay } from '../../types';

interface WorkScheduleCardProps {
  workSchedule: WorkDay[];
}

const WorkScheduleCard: React.FC<WorkScheduleCardProps> = ({ workSchedule }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50 border-green-200';
      case 'late': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'absent': return 'text-red-600 bg-red-50 border-red-200';
      case 'half_day': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Çalışıyor';
      case 'late': return 'Geç Kaldı';
      case 'absent': return 'Yok';
      case 'half_day': return 'Yarım Gün';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✓';
      case 'late': return '⏰';
      case 'absent': return '✕';
      case 'half_day': return '◐';
      default: return '○';
    }
  };

  const totalHours = workSchedule.reduce((sum, day) => sum + (day.totalHours || 0), 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📅</span>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Çalışma Günleri</h2>
        </div>
        <div className="text-xs text-primary-600 dark:text-primary-400 font-bold">
          {totalHours.toFixed(1)} saat
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
        {workSchedule.map((day, index) => (
          <div
            key={index}
            className="p-2.5 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700/50 dark:to-neutral-800/50 rounded-md hover:shadow-sm transition-all border border-neutral-200 dark:border-neutral-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-1">
                  {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-neutral-600 dark:text-neutral-400">
                  {day.checkIn && <span>🕐 {day.checkIn}</span>}
                  {day.checkOut && <span>→ {day.checkOut}</span>}
                  {day.totalHours && <span className="font-bold">({day.totalHours}s)</span>}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${getStatusColor(day.status)}`}>
                <span>{getStatusIcon(day.status)}</span>
                <span>{getStatusText(day.status)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkScheduleCard;

