
import React from 'react';
import { FollowUpColumn as ColumnType } from '../types/followUpTypes';
import FollowUpCard from './FollowUpCard';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface FollowUpColumnProps {
  column: ColumnType;
  index: number;
}

const FollowUpColumn: React.FC<FollowUpColumnProps> = ({ column, index }) => {
  return (
    <div className="flex flex-col rounded-lg bg-gray-50 dark:bg-gray-800/50 h-full min-h-[500px]">
      <div className="p-3 border-b bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm">{column.title}</h3>
          <span className="text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 h-5 min-w-5 inline-flex items-center justify-center px-1.5">
            {column.followUps.length}
          </span>
        </div>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            className={cn(
              "flex-1 p-2 overflow-y-auto",
              snapshot.isDraggingOver && "bg-gray-100 dark:bg-gray-700/50"
            )}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {column.followUps.map((followUp, index) => (
              <FollowUpCard key={followUp.id} followUp={followUp} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default FollowUpColumn;
