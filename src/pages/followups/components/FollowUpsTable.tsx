
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FollowUp } from '../types/followUpTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Edit, Eye, List, MoveRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface FollowUpsTableProps {
  followUps: FollowUp[];
}

const FollowUpsTable: React.FC<FollowUpsTableProps> = ({ followUps }) => {
  const [tableData, setTableData] = useState<FollowUp[]>(followUps);
  const { toast } = useToast();

  const handleStatusChange = (followUpId: string, newStatus: string) => {
    const updatedData = tableData.map(followUp => 
      followUp.id === followUpId 
        ? { 
            ...followUp, 
            status: newStatus as any, 
            updatedAt: new Date().toISOString() 
          } 
        : followUp
    );
    
    setTableData(updatedData);
    toast.default({
      title: "Status updated",
      description: `Follow-up status changed to ${newStatus}`,
    });
  };

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case 'in-progress':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case 'completed':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case 'cancelled':
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "";
    }
  };

  const priorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case 'medium':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case 'low':
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "";
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table hoverable>
        <TableHeader sticky>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.length > 0 ? (
            tableData.map((followUp) => (
              <TableRow key={followUp.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{followUp.title}</p>
                    {followUp.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{followUp.description}</p>
                    )}
                    {followUp.queryId && (
                      <Badge variant="outline" className="mt-1">
                        {followUp.queryId}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    <span>{format(new Date(followUp.dueDate), 'MMM dd, h:mm a')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={priorityBadgeColor(followUp.priority)}>
                    {followUp.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={followUp.status}
                    onValueChange={(value) => handleStatusChange(followUp.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <Badge className={statusBadgeColor(followUp.status)}>
                          {followUp.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <Badge className={statusBadgeColor("pending")}>pending</Badge>
                      </SelectItem>
                      <SelectItem value="in-progress">
                        <Badge className={statusBadgeColor("in-progress")}>in-progress</Badge>
                      </SelectItem>
                      <SelectItem value="completed">
                        <Badge className={statusBadgeColor("completed")}>completed</Badge>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <Badge className={statusBadgeColor("cancelled")}>cancelled</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {followUp.agentName || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No follow-ups found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FollowUpsTable;
