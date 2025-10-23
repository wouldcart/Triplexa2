
import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';
import SuperAdminProfile from './roles/SuperAdminProfile';
import ManagerProfile from './roles/ManagerProfile';
import StaffProfile from './roles/StaffProfile';
import AgentProfile from './roles/AgentProfile';
import UserProfile from './UserProfile';

interface RoleBasedProfileProps {
  isEditing: boolean;
  editData: any;
  setEditData: (data: any) => void;
  validationErrors: Record<string, string>;
}

const RoleBasedProfile: React.FC<RoleBasedProfileProps> = ({
  isEditing,
  editData,
  setEditData,
  validationErrors
}) => {
  const { currentUser } = useApp();
  const { isSuperAdmin, isManager, isStaff, isAgent } = useAccessControl();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Render role-specific profile component
  if (isSuperAdmin) {
    return (
      <SuperAdminProfile 
        isEditing={isEditing}
        editData={editData}
        setEditData={setEditData}
        validationErrors={validationErrors}
      />
    );
  }

  if (isManager) {
    return (
      <ManagerProfile 
        isEditing={isEditing}
        editData={editData}
        setEditData={setEditData}
      />
    );
  }

  if (isStaff) {
    return (
      <StaffProfile 
        isEditing={isEditing}
        editData={editData}
        setEditData={setEditData}
      />
    );
  }

  if (isAgent) {
    return (
      <AgentProfile 
        isEditing={isEditing}
        editData={editData}
        setEditData={setEditData}
      />
    );
  }

  // Default to UserProfile for regular users
  return <UserProfile />;
};

export default RoleBasedProfile;
