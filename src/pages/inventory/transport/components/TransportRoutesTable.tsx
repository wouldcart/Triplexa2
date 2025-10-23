
import React, { useState, useEffect } from 'react';
import { TransportRoute } from '../types/transportTypes';
import RoutesTable from './RoutesTable';
import RoutesPagination from './RoutesPagination';
import RouteDetailsSheet from './RouteDetailsSheet';
import DeleteRouteDialog from './DeleteRouteDialog';
import { formatRouteId } from '../utils/routeUtils';
import { useToast } from '@/hooks/use-toast';

interface TransportRoutesTableProps {
  routes: TransportRoute[];
  onEdit: (route: TransportRoute) => void;
  onDelete: (route: TransportRoute) => void;
  onView?: (route: TransportRoute) => void;
  onToggleStatus?: (routeId: string, newStatus: boolean) => void;
  showUserTracking?: boolean; // Option to show/hide user tracking columns
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onPageSelect?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPage?: number;
}

const TransportRoutesTable: React.FC<TransportRoutesTableProps> = ({ 
  routes, 
  onEdit, 
  onDelete,
  onView,
  onToggleStatus,
  showUserTracking = false,
  // Using the props from parent or defaulting to internal state
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onNextPage: externalNextPage,
  onPrevPage: externalPrevPage,
  onPageSelect,
  onItemsPerPageChange,
  itemsPerPage: externalItemsPerPage,
}) => {
  // Use internal state if external pagination is not provided
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalItemsPerPage, setInternalItemsPerPage] = useState(10);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const { toast } = useToast();
  
  // Reset page when routes change significantly
  useEffect(() => {
    if (!externalCurrentPage && routes.length > 0) {
      setInternalCurrentPage(1);
    }
  }, [routes.length, externalCurrentPage]);
  
  // Determine whether to use external or internal pagination
  const usingExternalPagination = externalCurrentPage !== undefined && externalTotalPages !== undefined;
  const currentPageValue = usingExternalPagination ? externalCurrentPage : internalCurrentPage;
  const itemsPerPageValue = externalItemsPerPage || internalItemsPerPage;
  
  // Calculate pagination for internal use only if not using external pagination
  let indexOfLastItem = 0;
  let indexOfFirstItem = 0;
  let currentItems = routes;
  let totalPagesValue = externalTotalPages || 1;
  
  if (!usingExternalPagination) {
    indexOfLastItem = internalCurrentPage * internalItemsPerPage;
    indexOfFirstItem = indexOfLastItem - internalItemsPerPage;
    currentItems = routes.slice(indexOfFirstItem, indexOfLastItem);
    totalPagesValue = Math.max(1, Math.ceil(routes.length / internalItemsPerPage));
  }

  // Ensure we don't have empty pages
  useEffect(() => {
    if (currentItems.length === 0 && routes.length > 0 && internalCurrentPage > 1) {
      setInternalCurrentPage(Math.max(1, Math.ceil(routes.length / internalItemsPerPage)));
    }
  }, [currentItems.length, routes.length, internalCurrentPage, internalItemsPerPage]);

  // Pagination controls for internal pagination
  const handlePageChange = (page: number) => {
    if (onPageSelect && usingExternalPagination) {
      onPageSelect(page);
    } else if (page >= 1 && page <= totalPagesValue) {
      setInternalCurrentPage(page);
    }
  };
  
  const handleItemsPerPageChange = (value: number) => {
    if (onItemsPerPageChange && usingExternalPagination) {
      onItemsPerPageChange(value);
    } else {
      setInternalItemsPerPage(value);
      setInternalCurrentPage(1); // Reset to first page when changing items per page
    }
  };

  // Handle view route details
  const handleView = (route: TransportRoute) => {
    if (onView) {
      onView(route);
    } else {
      setSelectedRoute(route);
      setIsViewOpen(true);
    }
  };
  
  // Handle delete
  const handleDelete = (route: TransportRoute) => {
    setSelectedRoute(route);
    setIsDeleteOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (selectedRoute) {
      onDelete(selectedRoute);
      setIsDeleteOpen(false);
    }
  };

  // Handle toggle status using newStatus boolean from toggle component
  const handleToggleStatus = (routeId: string, newStatus: boolean) => {
    if (onToggleStatus) {
      onToggleStatus(routeId, newStatus);
    }
  };
  
  // Find index of selected route in current items
  const selectedRouteIndex = selectedRoute 
    ? currentItems.findIndex(r => r.id === selectedRoute.id)
    : -1;

  return (
    <div>
      <div className="rounded-md border overflow-x-auto">
        <RoutesTable 
          routes={currentItems}
          onView={handleView}
          onEdit={onEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          formatRouteId={formatRouteId}
          showUserTracking={showUserTracking}
        />
      </div>
      
      <RoutesPagination
        currentPage={currentPageValue}
        totalPages={totalPagesValue}
        totalItems={routes.length}
        itemsPerPage={itemsPerPageValue}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={Math.min(indexOfLastItem, routes.length)}
        usingExternalPagination={usingExternalPagination}
      />
      
      {/* Route Details Sheet */}
      <RouteDetailsSheet
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        route={selectedRoute}
        onEdit={onEdit}
        formatRouteId={formatRouteId}
        routeIndex={selectedRouteIndex}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteRouteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        route={selectedRoute}
      />
    </div>
  );
};

export default TransportRoutesTable;
