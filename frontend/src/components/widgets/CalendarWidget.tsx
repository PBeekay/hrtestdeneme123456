import React, { useState } from 'react';

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const today = new Date();

    // Adjusted first day (Monday = 0, Sunday = 6)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Empty cells for days before the first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const isToday = 
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      const isSelected = 
        selectedDate &&
        day === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            aspect-square flex items-center justify-center text-xs font-medium rounded-lg
            transition-all duration-100 hover:scale-110
            ${isToday 
              ? 'bg-primary-600 text-white font-bold shadow-lg' 
              : isSelected
              ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={previousMonth}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          <span className="text-base">←</span>
        </button>
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          <span className="text-base">→</span>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {renderCalendar()}
      </div>

      {/* Selected date display */}
      {selectedDate && (
        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-[10px] text-center text-neutral-600 dark:text-neutral-400">
            Seçili: {selectedDate.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;

