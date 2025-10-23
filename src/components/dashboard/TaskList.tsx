
import React from 'react';
import { cn } from '@/lib/utils';
import { Task } from '@/data/mockData';
import { Calendar } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const getPriorityClass = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-start p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          >
            <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            
            <div className="flex-1">
              <div className="text-sm text-gray-900 dark:text-white font-medium">{task.title}</div>
              
              <div className="flex items-center mt-2">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {task.date}
                </div>
                
                <span className={cn(
                  "ml-3 px-2 py-0.5 rounded-full text-xs",
                  getPriorityClass(task.priority)
                )}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
