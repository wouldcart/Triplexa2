import React from 'react';
import RealTimeOptionalToggle from './RealTimeOptionalToggle';
import { useOptionalItem } from '@/hooks/useOptionalRecords';

interface ActivityOptionalToggleProps {
  proposalId: string;
  activityId: string;
  activityName: string;
  dayId: string;
  onUpdateActivity: (dayId: string, activityId: string, updates: any) => void;
}

/**
 * ActivityOptionalToggle Component
 * 
 * Separate component to handle activity optional toggles without violating React Hooks rules.
 * This component calls hooks at the top level and manages the optional state for individual activities.
 */
export const ActivityOptionalToggle: React.FC<ActivityOptionalToggleProps> = ({
  proposalId,
  activityId,
  activityName,
  dayId,
  onUpdateActivity
}) => {
  const { isOptional, updateItem } = useOptionalItem(proposalId, activityId, 'sightseeing');

  const handleToggle = (isOptional: boolean) => {
    // Update activity with optional status
    onUpdateActivity(dayId, activityId, {
      isOptional
    });
    updateItem(isOptional);
  };

  return (
    <RealTimeOptionalToggle
      proposalId={proposalId}
      itemType="sightseeing"
      itemId={activityId}
      itemTitle={activityName || 'Untitled Activity'}
      isOptional={isOptional}
      onToggle={handleToggle}
      size="sm"
    />
  );
};

export default ActivityOptionalToggle;