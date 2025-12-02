import { useState, useCallback } from 'react';
import { Task } from '../types';
import { useToast } from './useToast';

export const useTasks = (initialTasks: Task[] = []) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const { addToast } = useToast();

  const handleTaskComplete = useCallback((taskId: number, taskTitle: string) => {
    if (completedTasks.has(taskId)) {
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

