
import React from 'react';
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { LocationCode } from '../../types/transportTypes';

interface LocationCodesTableProps {
  locations: LocationCode[];
  onView: (location: LocationCode) => void;
  onEdit: (location: LocationCode) => void;
  onDelete: (location: LocationCode) => void;
  onToggleStatus: (location: LocationCode) => void;
}

const LocationCodesTable: React.FC<LocationCodesTableProps> = ({
  locations,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Short Code</TableHead>
          <TableHead className="hidden md:table-cell">Full Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="hidden md:table-cell">Country</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No location codes found
            </TableCell>
          </TableRow>
        ) : (
          locations.map((location) => (
            <TableRow key={`location-${location.id}-${location.code}`}>
              <TableCell className="font-medium">{location.code}</TableCell>
              <TableCell className="hidden md:table-cell">{location.fullName}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  location.category === 'airport' ? 'bg-blue-100 text-blue-800' :
                  location.category === 'hotel' ? 'bg-green-100 text-green-800' :
                  location.category === 'pier' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {location.category}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {location.country}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  location.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {location.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onView(location)}
                    title="View Details"
                    aria-label="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onToggleStatus(location)}
                    title={location.status === 'active' ? "Deactivate" : "Activate"}
                    aria-label={location.status === 'active' ? "Deactivate" : "Activate"}
                  >
                    {location.status === 'active' ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(location)}
                    title="Edit location code"
                    aria-label="Edit location code"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(location)}
                    title="Delete location code"
                    aria-label="Delete location code"
                    className="hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default LocationCodesTable;
