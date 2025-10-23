
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';

interface WorkingShift {
  id: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  label?: string;
}

interface DaySchedule {
  isWorking: boolean;
  shifts: WorkingShift[];
}

interface WorkingHoursData {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface WorkingHoursSectionProps {
  workingHours: WorkingHoursData;
  onWorkingHoursChange: (hours: WorkingHoursData) => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const SHIFT_TEMPLATES = [
  { label: 'Morning Shift', startTime: '09:00', endTime: '17:00' },
  { label: 'Evening Shift', startTime: '17:00', endTime: '01:00' },
  { label: 'Night Shift', startTime: '22:00', endTime: '06:00' },
  { label: 'Split Morning', startTime: '08:00', endTime: '12:00' },
  { label: 'Split Afternoon', startTime: '14:00', endTime: '18:00' },
];

const WorkingHoursSection: React.FC<WorkingHoursSectionProps> = ({
  workingHours,
  onWorkingHoursChange,
}) => {
  const updateDaySchedule = (day: string, schedule: DaySchedule) => {
    onWorkingHoursChange({
      ...workingHours,
      [day]: schedule,
    });
  };

  const addShift = (day: string, template?: { label: string; startTime: string; endTime: string }) => {
    const currentSchedule = workingHours[day as keyof WorkingHoursData];
    const newShift: WorkingShift = {
      id: `shift_${Date.now()}`,
      startTime: template?.startTime || '09:00',
      endTime: template?.endTime || '17:00',
      label: template?.label || `Shift ${currentSchedule.shifts.length + 1}`,
    };

    updateDaySchedule(day, {
      ...currentSchedule,
      isWorking: true,
      shifts: [...currentSchedule.shifts, newShift],
    });
  };

  const removeShift = (day: string, shiftId: string) => {
    const currentSchedule = workingHours[day as keyof WorkingHoursData];
    const newShifts = currentSchedule.shifts.filter(shift => shift.id !== shiftId);
    
    updateDaySchedule(day, {
      ...currentSchedule,
      shifts: newShifts,
      isWorking: newShifts.length > 0,
    });
  };

  const updateShift = (day: string, shiftId: string, updatedShift: Partial<WorkingShift>) => {
    const currentSchedule = workingHours[day as keyof WorkingHoursData];
    const newShifts = currentSchedule.shifts.map(shift =>
      shift.id === shiftId ? { ...shift, ...updatedShift } : shift
    );
    
    updateDaySchedule(day, {
      ...currentSchedule,
      shifts: newShifts,
    });
  };

  const toggleDay = (day: string, isWorking: boolean) => {
    const currentSchedule = workingHours[day as keyof WorkingHoursData];
    
    if (isWorking && currentSchedule.shifts.length === 0) {
      // Add default shift when enabling a day
      addShift(day);
    } else {
      updateDaySchedule(day, {
        ...currentSchedule,
        isWorking,
      });
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts
    if (end <= start) {
      end = new Date(`2000-01-02T${endTime}`);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Clock className="h-5 w-5" />
          Working Hours & Shifts
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure multiple shifts per day including night shifts and split schedules
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {DAYS.map(({ key, label }) => {
          const daySchedule = workingHours[key as keyof WorkingHoursData] || { isWorking: false, shifts: [] };
          
          return (
            <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={daySchedule.isWorking}
                    onCheckedChange={(checked) => toggleDay(key, checked)}
                  />
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">{label}</Label>
                  {daySchedule.shifts.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {daySchedule.shifts.length} shift{daySchedule.shifts.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                {daySchedule.isWorking && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addShift(key)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Shift
                    </Button>
                  </div>
                )}
              </div>

              {daySchedule.isWorking && (
                <div className="space-y-4">
                  {/* Quick Templates */}
                  {daySchedule.shifts.length === 0 && (
                    <div>
                      <Label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Quick Templates:</Label>
                      <div className="flex flex-wrap gap-2">
                        {SHIFT_TEMPLATES.map((template, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addShift(key, template)}
                            className="text-xs"
                          >
                            {template.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shift Configuration */}
                  <div className="space-y-3">
                    {daySchedule.shifts.map((shift) => (
                      <div key={shift.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <div>
                          <Label className="text-sm text-gray-700 dark:text-gray-300">Shift Name</Label>
                          <Input
                            value={shift.label || ''}
                            onChange={(e) => updateShift(key, shift.id, { label: e.target.value })}
                            placeholder="e.g., Morning Shift"
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm text-gray-700 dark:text-gray-300">Start Time</Label>
                          <Input
                            type="time"
                            value={shift.startTime}
                            onChange={(e) => updateShift(key, shift.id, { startTime: e.target.value })}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm text-gray-700 dark:text-gray-300">End Time</Label>
                          <Input
                            type="time"
                            value={shift.endTime}
                            onChange={(e) => updateShift(key, shift.id, { endTime: e.target.value })}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm text-gray-700 dark:text-gray-300">Break Start</Label>
                          <Input
                            type="time"
                            value={shift.breakStart || ''}
                            onChange={(e) => updateShift(key, shift.id, { breakStart: e.target.value })}
                            placeholder="Optional"
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm text-gray-700 dark:text-gray-300">Break End</Label>
                          <Input
                            type="time"
                            value={shift.breakEnd || ''}
                            onChange={(e) => updateShift(key, shift.id, { breakEnd: e.target.value })}
                            placeholder="Optional"
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Duration: {calculateShiftDuration(shift.startTime, shift.endTime)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeShift(key, shift.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Day Summary */}
                  {daySchedule.shifts.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <strong>Today's Schedule:</strong> {daySchedule.shifts.map((shift, index) => (
                        <span key={shift.id}>
                          {shift.label || `Shift ${index + 1}`}: {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          {index < daySchedule.shifts.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!daySchedule.isWorking && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No shifts scheduled for {label}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default WorkingHoursSection;
