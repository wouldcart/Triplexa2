
import React, { useState } from 'react';
import { TourPackage } from '@/types/package';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Trash, Eye, Edit, Clock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updatePackage } from '@/pages/inventory/packages/services/storageService';
import { useToast } from '@/hooks/use-toast';

interface PackageCardProps {
  packageData: TourPackage;
  onDelete?: () => void;
  onStatusChange?: (id: string, newStatus: 'draft' | 'published') => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  packageData, 
  onDelete,
  onStatusChange
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPublished, setIsPublished] = useState(packageData.status === 'published');
  
  const handleViewDetails = () => {
    navigate(`/inventory/packages/view/${packageData.id}`);
  };
  
  const handleEditPackage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/inventory/packages/edit/${packageData.id}`);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteDialog(false);
  };
  
  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newStatus: 'draft' | 'published' = isPublished ? 'draft' : 'published';
    
    setIsPublished(!isPublished);
    
    const updatedPackage: TourPackage = {
      ...packageData,
      status: newStatus
    };
    
    updatePackage(packageData.id, updatedPackage);
    
    if (onStatusChange) {
      onStatusChange(packageData.id, newStatus);
    }
    
    toast({
      title: `Package ${newStatus === 'published' ? 'Published' : 'Set to Draft'}`,
      description: `${packageData.name} has been ${newStatus === 'published' ? 'published' : 'set to draft'}.`
    });
  };
  
  const createdAtDate = packageData.createdAt ? new Date(packageData.createdAt) : null;
  const formattedDate = createdAtDate ? format(createdAtDate, 'MMM dd, yyyy') : 'N/A';
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: packageData.currency || 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get first banner image or fallback
  const bannerImage = packageData.banners && packageData.banners.length > 0 
    ? packageData.banners[0] 
    : 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070';
  
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md hover:-translate-y-2 bg-white dark:bg-gray-800 overflow-hidden rounded-2xl" onClick={handleViewDetails}>
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={bannerImage} 
          alt={packageData.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          {packageData.status === 'published' ? (
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
              <CheckCircle className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 shadow-lg">
              <Clock className="h-3 w-3 mr-1" />
              Draft
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg"
            onClick={handleEditPackage}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Package Type */}
        {packageData.packageType && (
          <div className="absolute bottom-4 left-4">
            <Badge variant="outline" className="bg-white/90 text-gray-700 border-0 shadow-lg">
              <Globe className="h-3 w-3 mr-1" />
              {packageData.packageType.charAt(0).toUpperCase() + packageData.packageType.slice(1)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Package Name */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
            {packageData.name}
          </h3>
        </div>
        
        {/* Duration & Travelers */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{packageData.days}D / {packageData.nights}N</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Min {packageData.minPax || 2}</span>
          </div>
        </div>
        
        {/* Destinations */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {packageData.destinations?.slice(0, 2).map((dest, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300">
                {dest.country}
              </Badge>
            )) || <span className="text-sm text-gray-500">No destinations</span>}
            {packageData.destinations && packageData.destinations.length > 2 && (
              <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                +{packageData.destinations.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Themes */}
        {packageData.themes && packageData.themes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {packageData.themes.slice(0, 2).map((theme, index) => (
              <Badge key={index} variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50 dark:bg-purple-900 dark:text-purple-300">
                {theme}
              </Badge>
            ))}
            {packageData.themes.length > 2 && (
              <Badge variant="outline" className="text-xs text-gray-600 border-gray-200">
                +{packageData.themes.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(packageData.pricePerPerson)}
            <span className="text-sm font-normal text-gray-500 ml-1">/ person</span>
          </div>
          {packageData.finalPrice !== packageData.pricePerPerson && (
            <div className="text-sm text-gray-500">
              Total: {formatCurrency(packageData.finalPrice)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500">
            Created {formattedDate}
          </div>
          
          {/* Status Toggle */}
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Switch
                id={`status-switch-${packageData.id}`}
                checked={isPublished}
                onCheckedChange={() => {}}
                onClick={handleStatusChange}
                className="data-[state=checked]:bg-green-500"
              />
              <Label htmlFor={`status-switch-${packageData.id}`} className="text-xs cursor-pointer">
                {isPublished ? 'Live' : 'Draft'}
              </Label>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteClick}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Package</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete "{packageData.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={cancelDelete}
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PackageCard;
