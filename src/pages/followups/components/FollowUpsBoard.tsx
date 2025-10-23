
import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import FollowUpColumn from './FollowUpColumn';
import { FollowUpColumn as ColumnType, FollowUp } from '../types/followUpTypes';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface FollowUpsBoardProps {
  initialColumns: ColumnType[];
}

const FollowUpsBoard: React.FC<FollowUpsBoardProps> = ({ initialColumns }) => {
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
  const { toast } = useToast();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item is dropped back to its original position
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const sourceColumn = columns.find(column => column.id === source.droppableId);
    const destColumn = columns.find(column => column.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;

    // Item moved within the same column
    if (source.droppableId === destination.droppableId) {
      const newFollowUps = Array.from(sourceColumn.followUps);
      const [removed] = newFollowUps.splice(source.index, 1);
      newFollowUps.splice(destination.index, 0, removed);

      const newColumns = columns.map(column => {
        if (column.id === source.droppableId) {
          return { ...column, followUps: newFollowUps };
        }
        return column;
      });

      setColumns(newColumns);
      return;
    }

    // Item moved to a different column (status change)
    const sourceFollowUps = Array.from(sourceColumn.followUps);
    const [removed] = sourceFollowUps.splice(source.index, 1);
    
    // Update the status of the moved item
    const updatedFollowUp: FollowUp = {
      ...removed,
      status: destination.droppableId as any,
      updatedAt: new Date().toISOString()
    };

    const destinationFollowUps = Array.from(destColumn.followUps);
    destinationFollowUps.splice(destination.index, 0, updatedFollowUp);

    // Update the columns with the new state
    const newColumns = columns.map(column => {
      if (column.id === source.droppableId) {
        return { ...column, followUps: sourceFollowUps };
      }
      if (column.id === destination.droppableId) {
        return { ...column, followUps: destinationFollowUps };
      }
      return column;
    });

    setColumns(newColumns);

    // Show a notification about the status change
    const successVariant = destination.droppableId === 'completed' ? true : false;
    toast.default({
      title: `Follow-up moved to ${destColumn.title}`,
      description: `"${updatedFollowUp.title}" reminder scheduled for ${format(new Date(updatedFollowUp.dueDate), "MMM dd, yyyy 'at' h:mm a")}`,
    });
    
    if (successVariant) {
      toast.success({
        title: "Task completed",
        description: `"${updatedFollowUp.title}" has been marked as completed`,
      });
    }
  };

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 h-full overflow-x-auto pb-4">
          {columns.map((column, index) => (
            <FollowUpColumn
              key={column.id}
              column={column}
              index={index}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default FollowUpsBoard;
