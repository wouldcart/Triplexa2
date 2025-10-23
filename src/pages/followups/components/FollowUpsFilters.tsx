
import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Filter, Search, MapPin, User, Briefcase, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FollowUpsFiltersProps {
  onFilterChange: (filters: any) => void;
}

interface FilterState {
  search: string;
  priority: string;
  category: string;
  type: string;
  status: string;
  assignedTo: string;
  enquiryStatus: string;
  bookingStatus: string;
  date: Date | undefined;
  overdue: boolean;
}

const FollowUpsFilters: React.FC<FollowUpsFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    priority: 'all',
    category: 'all',
    type: 'all',
    status: 'all',
    assignedTo: 'all',
    enquiryStatus: 'all',
    bookingStatus: 'all',
    date: undefined,
    overdue: false
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value });
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      search: '',
      priority: 'all',
      category: 'all',
      type: 'all',
      status: 'all',
      assignedTo: 'all',
      enquiryStatus: 'all',
      bookingStatus: 'all',
      date: undefined,
      overdue: false
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.priority !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.assignedTo !== 'all') count++;
    if (filters.enquiryStatus !== 'all') count++;
    if (filters.bookingStatus !== 'all') count++;
    if (filters.date) count++;
    if (filters.overdue) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Primary Filters Row */}
      <div className="flex flex-col space-y-3 lg:flex-row lg:items-end lg:space-y-0 lg:space-x-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search follow-ups, enquiries, destinations..."
              className="pl-8"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Select value={filters.priority} onValueChange={(value) => updateFilters({ priority: value })}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">🔴 Urgent</SelectItem>
              <SelectItem value="high">🟡 High</SelectItem>
              <SelectItem value="medium">🔵 Medium</SelectItem>
              <SelectItem value="low">⚪ Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.date ? format(filters.date, 'MMM dd') : 'Due Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.date}
                onSelect={(date) => updateFilters({ date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
          <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
            <SelectTrigger className="w-full sm:w-40">
              <Briefcase className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="enquiry">Enquiry</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="post-travel">Post-Travel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.assignedTo} onValueChange={(value) => updateFilters({ assignedTo: value })}>
            <SelectTrigger className="w-full sm:w-40">
              <User className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="Sarah Sales">Sarah Sales</SelectItem>
              <SelectItem value="Mike Marketing">Mike Marketing</SelectItem>
              <SelectItem value="Operations Staff">Operations Staff</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.enquiryStatus} onValueChange={(value) => updateFilters({ enquiryStatus: value })}>
            <SelectTrigger className="w-full sm:w-40">
              <MapPin className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Enquiry Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Enquiries</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="proposal-sent">Proposal Sent</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.bookingStatus} onValueChange={(value) => updateFilters({ bookingStatus: value })}>
            <SelectTrigger className="w-full sm:w-40">
              <CreditCard className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Booking Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filters.overdue ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ overdue: !filters.overdue })}
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Overdue Only
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="flex items-center gap-1"
          >
            <Filter className="h-3 w-3" />
            Reset
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0"
                onClick={() => updateFilters({ search: '' })}
              >
                ×
              </Button>
            </Badge>
          )}
          {filters.priority !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Priority: {filters.priority}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0"
                onClick={() => updateFilters({ priority: 'all' })}
              >
                ×
              </Button>
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0"
                onClick={() => updateFilters({ category: 'all' })}
              >
                ×
              </Button>
            </Badge>
          )}
          {filters.overdue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              Overdue Only
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 text-white hover:text-white"
                onClick={() => updateFilters({ overdue: false })}
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowUpsFilters;
