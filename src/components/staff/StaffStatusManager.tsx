
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { UserCheck, UserX, AlertCircle } from 'lucide-react';
import { EnhancedStaffMember } from '@/types/staff';
import { updateStaffStatusBothTables } from '@/services/staffStorageService';
import { toast } from '@/hooks/use-toast';

interface StaffStatusManagerProps {
  staff: EnhancedStaffMember;
  onStatusUpdate?: (newStatus: 'active' | 'inactive') => void;
}

const StaffStatusManager: React.FC<StaffStatusManagerProps> = ({ 
  staff, 
  onStatusUpdate 
}) => {
  const [currentStatus, setCurrentStatus] = useState<'active' | 'inactive'>(
    staff.status === 'on-leave' ? 'inactive' : staff.status as 'active' | 'inactive'
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: 'active' | 'inactive') => {
    setIsUpdating(true);
    
    try {
      // Update status in both profiles and staff tables
      const { profileError, staffError } = await updateStaffStatusBothTables(staff.id, newStatus);
      if (profileError && staffError) {
        throw new Error('Failed to update status in both tables');
      }
      
      setCurrentStatus(newStatus);
      onStatusUpdate?.(newStatus);
      
      if (!profileError && !staffError) {
        toast({
          title: "Status Updated",
          description: `${staff.name} is now ${newStatus} (profiles + staff)`,
        });
      } else if (!profileError && staffError) {
        toast({
          title: "Partial Update",
          description: `Updated profiles.status, but staff.status failed: ${staffError?.message || staffError}`,
          variant: "destructive",
        });
      } else if (profileError && !staffError) {
        toast({
          title: "Partial Update",
          description: `Updated staff.status, but profiles.status failed: ${profileError?.message || profileError}`,
          variant: "destructive",
        });
      }
      
      console.log(`Staff ${staff.name} status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: 'active' | 'inactive') => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-4 w-4" />;
      case 'inactive':
        return <UserX className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: 'active' | 'inactive') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Staff Status Management</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Manage staff working status. Leave requests are handled separately by the leave system.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(currentStatus)}
              <span className="font-medium text-gray-900 dark:text-gray-100">Current Status</span>
            </div>
          </div>
          <Badge className={getStatusColor(currentStatus)}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </Badge>
        </div>

        {/* Status Change Controls */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Update Status
          </label>
          <div className="flex gap-3">
            <Select
              value={currentStatus}
              onValueChange={(value: 'active' | 'inactive') => handleStatusChange(value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-600" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={currentStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('active')}
            disabled={isUpdating || currentStatus === 'active'}
            className="flex-1"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Set Active
          </Button>
          <Button
            variant={currentStatus === 'inactive' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('inactive')}
            disabled={isUpdating || currentStatus === 'inactive'}
            className="flex-1"
          >
            <UserX className="h-4 w-4 mr-2" />
            Set Inactive
          </Button>
        </div>

        {/* Status Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
          <strong>Note:</strong> Staff members on leave should use the dedicated leave management system. 
          This status controls general work availability and login permissions.
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffStatusManager;
