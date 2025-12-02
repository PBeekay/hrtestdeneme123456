/**
 * Format time to Turkish locale
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

/**
 * Format date to Turkish locale
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', { 
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Get priority color classes
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': 
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': 
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low': 
      return 'text-green-600 bg-green-50 border-green-200';
    default: 
      return 'text-neutral-600 bg-neutral-50 border-neutral-200';
  }
};

/**
 * Get priority icon
 */
export const getPriorityIcon = (priority: string): string => {
  switch (priority) {
    case 'high': 
      return '●';
    case 'medium': 
      return '○';
    case 'low': 
      return '◯';
    default: 
      return '—';
  }
};

