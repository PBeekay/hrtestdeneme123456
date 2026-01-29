import React, { useState, useEffect } from 'react';
import { Reminder } from '../../types';
import api from '../../services/api';

interface RemindersWidgetProps {
  delay?: number;
}

const RemindersWidget: React.FC<RemindersWidgetProps> = ({ delay = 0 }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const result = await api.getReminders();
      if (result.data) {
        const data = result.data as any;
        setReminders(Array.isArray(data.reminders) ? data.reminders : (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReminderIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'probation':
        return '⏰';
      case 'birthday':
        return '🎂';
      case 'tax':
        return '💰';
      default:
        return '📌';
    }
  };

  const getReminderColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin text-2xl mb-2">⏳</div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {reminders.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Hatırlatıcı yok</p>
        </div>
      ) : (
        reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`p-2.5 rounded-lg border ${getReminderColor(reminder.priority)}`}
          >
            <div className="flex items-start space-x-2">
              <span className="text-lg flex-shrink-0">{getReminderIcon(reminder.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-0.5">
                  {reminder.title}
                </p>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-300">
                  {new Date(reminder.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RemindersWidget;











