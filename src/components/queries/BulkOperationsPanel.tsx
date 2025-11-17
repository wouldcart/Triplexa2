
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Download, 
  CheckCircle, 
  UserPlus, 
  Trash2,
  Star,
  X
} from 'lucide-react';
import { Query } from '@/types/query';

interface BulkOperationsPanelProps {
  selectedQueries: Query[];
  onClearSelection: () => void;
  onBulkAssign: (staffMember: string) => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkPriorityUpdate: (priority: string) => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
}

const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedQueries,
  onClearSelection,
  onBulkAssign,
  onBulkStatusUpdate,
  onBulkPriorityUpdate,
  onBulkExport,
  onBulkDelete
}) => {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  if (selectedQueries.length === 0) return null;

  const staffMembers = [
    'Sarah Sales',
    'Mike Marketing', 
    'Operations Staff',
    'John Manager'
  ];

  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'proposal-sent', label: 'Proposal Sent' },
    { value: 'confirmed', label: 'Confirmed' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  return (
    <Card className="border-blue-200 bg-blue-50 sticky top-4 z-10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-blue-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Bulk Operations
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedQueries.length} selected
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Bulk Assign */}
          <div className="space-y-2">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map(staff => (
                  <SelectItem key={staff} value={staff}>
                    {staff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => selectedStaff && onBulkAssign(selectedStaff)}
              disabled={!selectedStaff}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Assign
            </Button>
          </div>

          {/* Bulk Status Update */}
          <div className="space-y-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedStatus && onBulkStatusUpdate(selectedStatus)}
              disabled={!selectedStatus}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Update
            </Button>
          </div>

          {/* Bulk Priority Update */}
          <div className="space-y-2">
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Set priority..." />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedPriority && onBulkPriorityUpdate(selectedPriority)}
              disabled={!selectedPriority}
              className="w-full"
            >
              <Star className="h-4 w-4 mr-1" />
              Priority
            </Button>
          </div>

          {/* Export & Actions */}
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onBulkExport}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onBulkDelete}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkOperationsPanel;
