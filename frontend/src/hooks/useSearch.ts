import { useState, useCallback } from 'react';
import { Task, Announcement } from '../types';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query.toLowerCase());
  }, []);

  const filterTasks = useCallback((tasks: Task[]) => {
    if (!searchQuery) return tasks;
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery)
    );
  }, [searchQuery]);

  const filterAnnouncements = useCallback((announcements: Announcement[]) => {
    if (!searchQuery) return announcements;
    return announcements.filter(announcement =>
      announcement.title.toLowerCase().includes(searchQuery) ||
      announcement.category.toLowerCase().includes(searchQuery)
    );
  }, [searchQuery]);

  return {
    searchQuery,
    handleSearch,
    filterTasks,
    filterAnnouncements,
  };
};

