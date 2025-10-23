
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransportRoute } from '../types/transportTypes';
import { MapPin, MoreHorizontal, User, Clock, Eye, Pencil, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RouteVehicleTypes from './RouteVehicleTypes';
import { StatusToggle } from '@/components/ui/status-toggle';

interface RoutesTableProps {
  routes: TransportRoute[];
  onView: (route: TransportRoute) => void;
  onEdit: (route: TransportRoute) => void;
  onDelete: (route: TransportRoute) => void;
  onToggleStatus?: (routeId: string, newStatus: boolean) => void;
  formatRouteId?: (routeId: string, index: number) => string;
  showUserTracking?: boolean; // Option to show/hide user tracking columns
}

const RoutesTable: React.FC<RoutesTableProps> = ({
  routes,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  formatRouteId,
  showUserTracking = false,
}) => {
  // Helper functions
  const getOrigin = (route: TransportRoute): string => {
    return route.origin || route.startLocationFullName || route.startLocation;
  };
  
  const getDestination = (route: TransportRoute): string => {
    return route.destination || route.endLocationFullName || route.endLocation;
  };
  
  // Get current status as boolean for the toggle component
  const getCurrentStatus = (route: TransportRoute): boolean => {
    // Prefer the new isActive field if available
    if (route.isActive !== undefined) {
      return route.isActive;
    }
    // Fall back to converting status field
    if (typeof route.status === 'boolean') {
      return route.status;
    }
    return route.status === 'active';
  };

  // Format user display name
  const formatUserDisplay = (userId?: string, userName?: string): string => {
    if (userName) return userName;
    if (userId) return `User ${userId.slice(0, 8)}...`;
    return 'Unknown';
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp?: string | Date): string => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine the toggle status text based on current status
  const getToggleStatusText = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'Disable' : 'Enable';
    }
    return status === 'active' ? 'Disable' : 'Enable';
  };

  // Row numbering helper
  const getRowNumber = (index: number): number => index + 1;

  // Check if routes array is empty or undefined
  const hasNoRoutes = routes.length === 0;

  return (
    <TooltipProvider>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[140px]">Route Code</TableHead>
              <TableHead>Transport Options</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {showUserTracking && (
                <>
                  <TableHead className="text-center">Created By</TableHead>
                  <TableHead className="text-center">Updated By</TableHead>
                </>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasNoRoutes ? (
              <TableRow>
                <TableCell colSpan={showUserTracking ? 8 : 6} className="text-center py-8 text-gray-500">
                  No transport routes found
                </TableCell>
              </TableRow>
            ) : (
              routes.map((route, index) => (
                <TableRow
                  key={`${route.id}-${index}`}
                  className={!getCurrentStatus(route) ? "opacity-70" : ""}
                >
                  <TableCell className="font-medium font-mono">
                    <span className="bg-muted px-2 py-1 rounded text-xs">
                      {getRowNumber(index)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium truncate max-w-[260px]">{route.name || `${getOrigin(route)} → ${getDestination(route)}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono block truncate w-full">{route.code || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(route.transportTypes) && route.transportTypes.length > 0 ? (
                      <RouteVehicleTypes
                        transportTypes={route.transportTypes}
                        country={route.country}
                      />
                    ) : (
                      (() => {
                        // eslint-disable-next-line no-console
                        console.debug('No transportTypes for route', { id: route.id, name: route.name });
                        return <span className="text-muted-foreground">-</span>;
                      })()
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {onToggleStatus && (
                        <StatusToggle
                          isActive={getCurrentStatus(route)}
                          onToggle={(newStatus) => onToggleStatus(route.id, newStatus)}
                          size="sm"
                          showLabels={true}
                        />
                      )}
                    </div>
                  </TableCell>
                  {showUserTracking && (
                    <>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">
                                {formatUserDisplay(route.createdByUser || route.createdBy)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div>Created by: {formatUserDisplay(route.createdByUser || route.createdBy)}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(route.createdAt)}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">
                                {formatUserDisplay(route.updatedByUser || route.updatedBy)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div>Updated by: {formatUserDisplay(route.updatedByUser || route.updatedBy)}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(route.updatedAt)}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onView(route)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(route)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(route)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile compact card layout */}
      <div className="block md:hidden">
        {hasNoRoutes ? (
          <div className="text-center py-8 text-gray-500">No transport routes found</div>
        ) : (
          <div className="space-y-3">
            {routes.map((route, index) => (
              <div
                key={`${route.id}-${index}`}
                className={"border rounded-lg p-3 bg-card text-card-foreground " + (!getCurrentStatus(route) ? "opacity-70" : "")}
              >
                <div className="grid grid-cols-1 gap-2">
                  {/* Header: Name and Code */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate text-sm max-w-[70%]">
                      {route.name || `${getOrigin(route)} → ${getDestination(route)}`}
                    </span>
                    <span className="text-xs font-mono truncate max-w-[30%]">{route.code}</span>
                  </div>

                  {/* Transport Options */}
                  <div>
                    <RouteVehicleTypes
                      transportTypes={route.transportTypes || []}
                      country={route.country}
                    />
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {onToggleStatus && (
                      <StatusToggle
                        isActive={getCurrentStatus(route)}
                        onToggle={(newStatus) => onToggleStatus(route.id, newStatus)}
                        size="lg"
                        showLabels={false}
                        className="scale-110"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onView(route)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(route)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(route)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default RoutesTable;
