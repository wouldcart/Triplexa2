
import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface CheckInOutSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const CheckInOutSection: React.FC<CheckInOutSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Check-in/Check-out Times</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-2">
              <label className="block text-base font-medium">Check-in Time</label>
              <div className="relative">
                <Input
                  type="time"
                  name="checkInTime"
                  value={formData.checkInTime || ''}
                  onChange={handleInputChange}
                  className="pl-10"
                />
                <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Standard check-in time for guests (usually between 12:00 - 15:00)
              </p>
            </div>
          </div>

          <div>
            <div className="space-y-2">
              <label className="block text-base font-medium">Check-out Time</label>
              <div className="relative">
                <Input
                  type="time"
                  name="checkOutTime"
                  value={formData.checkOutTime || ''}
                  onChange={handleInputChange}
                  className="pl-10"
                />
                <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Standard check-out time for guests (usually between 10:00 - 12:00)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckInOutSection;
