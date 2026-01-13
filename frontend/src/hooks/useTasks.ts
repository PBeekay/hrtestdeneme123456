import { useState, useCallback } from 'react';
import { Task } from '../types';
import { useToast } from './useToast';
import api from '../services/api';

export const useTasks = (initialTasks: Task[] = []) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const { addToast } = useToast();

  const handleTaskComplete = useCallback(async (taskId: number, taskTitle: string) => {
    const isCompleted = completedTasks.has(taskId);
    const newStatus = isCompleted ? 'pending' : 'completed';
    
    // Update local state immediately for better UX
    if (isCompleted) {
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      addToast('Görev işareti kaldırıldı', 'info');
    } else {
      setCompletedTasks(prev => new Set(prev).add(taskId));
      addToast(`Görev tamamlandı: "${taskTitle}"`, 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
    
    // Call API to persist the change
    try {
      const result = await api.updateTaskStatus(taskId, newStatus);
      if (result.status !== 200 && result.error) {
        // Revert on error
        if (isCompleted) {
          setCompletedTasks(prev => new Set(prev).add(taskId));
        } else {
          setCompletedTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
        }
        addToast(result.error || 'Görev durumu güncellenemedi', 'error');
      }
    } catch (error) {
      // Silently fail - local state is already updated
      console.error('Failed to update task status:', error);
    }
  }, [completedTasks, addToast]);

  const getActiveTasks = useCallback((tasks: Task[]) => {
    return tasks.filter(t => !completedTasks.has(t.id));
  }, [completedTasks]);

  return {
    completedTasks,
    showConfetti,
    handleTaskComplete,
    getActiveTasks,
  };
};

