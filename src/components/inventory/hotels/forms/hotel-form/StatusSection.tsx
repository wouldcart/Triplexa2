
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HotelStatus } from '../../types/hotel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tag } from 'lucide-react';

interface StatusSectionProps {
  status: HotelStatus;
  handleStatusChange: (status: HotelStatus) => void;
}

const StatusSection: React.FC<StatusSectionProps> = ({
  status,
  handleStatusChange,
}) => {
  return (
    <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Publication Status</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-2">
          <label className="text-base font-medium">Status</label>
          <Select
            onValueChange={(value) => handleStatusChange(value as HotelStatus)}
            defaultValue={status}
          >
            <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 focus:ring-blue-500">
              <SelectValue placeholder="Select a status">
                {status && (
                  <div className="flex items-center">
                    <Badge className={`mr-2 ${
                      status === 'active' ? 'bg-green-500 hover:bg-green-600' : 
                      status === 'inactive' ? 'bg-red-500 hover:bg-red-600' : 
                      'bg-yellow-500 hover:bg-yellow-600'
                    }`}>{status}</Badge>
                    {status === 'active' ? 'Active - Visible to customers' : 
                     status === 'inactive' ? 'Inactive - Hidden from customers' : 'Draft - Not published yet'}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <div className="flex items-center">
                  <Badge className="bg-green-500 mr-2">active</Badge>
                  Active - Visible to customers
                </div>
              </SelectItem>
              <SelectItem value="inactive">
                <div className="flex items-center">
                  <Badge className="bg-red-500 mr-2">inactive</Badge>
                  Inactive - Hidden from customers
                </div>
              </SelectItem>
              <SelectItem value="draft">
                <div className="flex items-center">
                  <Badge className="bg-yellow-500 mr-2">draft</Badge>
                  Draft - Not published yet
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Active hotels are visible to customers in search results and booking forms. Inactive hotels are hidden from customers but remain in your inventory. Draft hotels are not published and visible only to staff.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusSection;
