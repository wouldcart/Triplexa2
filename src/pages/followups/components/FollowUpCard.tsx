
import React from 'react';
import { Calendar, Clock, Tag } from 'lucide-react';
import { FollowUp } from '../types/followUpTypes';
import { Badge } from '@/components/ui/badge';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FollowUpCardProps {
  followUp: FollowUp;
  index: number;
}

const FollowUpCard: React.FC<FollowUpCardProps> = ({ followUp, index }) => {
  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  };

  return (
    <Draggable draggableId={followUp.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={cn(
            "rounded-lg border bg-card p-4 mb-3 shadow-sm hover:shadow-md transition-all",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary"
          )}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="flex items-start justify-between">
            <h3 className="font-medium line-clamp-2">{followUp.title}</h3>
            <Badge className={cn("ml-2 whitespace-nowrap", priorityColors[followUp.priority])}>
              {followUp.priority}
            </Badge>
          </div>
          
          {followUp.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {followUp.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center mt-3 text-xs text-muted-foreground gap-3">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{format(new Date(followUp.dueDate), 'MMM dd, yyyy')}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{format(new Date(followUp.dueDate), 'h:mm a')}</span>
            </div>
            
            {followUp.queryId && (
              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {followUp.queryId}
              </span>
            )}
          </div>
          
          {followUp.tags && followUp.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {followUp.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {followUp.agentName && (
            <div className="flex items-center mt-3 justify-between">
              <div className="text-xs text-muted-foreground">
                Assigned to: {followUp.agentName}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default FollowUpCard;
