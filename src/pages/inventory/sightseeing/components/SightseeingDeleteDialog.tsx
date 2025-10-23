
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Trash, AlertTriangle, User } from 'lucide-react';
import { Sightseeing } from '@/types/sightseeing';

interface SightseeingDeleteDialogProps {
  sightseeing: Sightseeing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const SightseeingDeleteDialog: React.FC<SightseeingDeleteDialogProps> = ({
  sightseeing,
  open,
  onOpenChange,
  onConfirm
}) => {
  if (!sightseeing) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash className="h-5 w-5" />
            Delete Sightseeing
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                  This action cannot be undone
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  You are about to permanently delete this sightseeing. All associated data will be lost.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">
                Sightseeing to be deleted:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
                <div className="flex items-start gap-3">
                  <ImageWithFallback
                    src={sightseeing.images?.[0]?.url || sightseeing.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070'} 
                    alt={sightseeing.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    fallbackIcon={<User className="h-4 w-4 text-muted-foreground" />}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {sightseeing.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sightseeing.city}, {sightseeing.country}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={sightseeing.status === 'active' ? 'default' : 'secondary'}>
                        {sightseeing.status}
                      </Badge>
                      {sightseeing.category && (
                        <Badge variant="outline" className="text-xs">
                          {sightseeing.category.split(', ')[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Sightseeing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SightseeingDeleteDialog;
