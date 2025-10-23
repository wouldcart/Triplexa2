
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';
import { PackageComponentProps } from '../types/packageTypes';

const BannersCard: React.FC<PackageComponentProps> = ({ packageData, updatePackageData }) => {
  const [bannerUrl, setBannerUrl] = useState('');
  
  const handleAddBanner = () => {
    if (!bannerUrl.trim()) return;
    
    updatePackageData({ 
      banners: [...(packageData.banners || []), bannerUrl] 
    });
    setBannerUrl('');
  };
  
  const handleRemoveBanner = (url: string) => {
    updatePackageData({ 
      banners: (packageData.banners || []).filter(b => b !== url) 
    });
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Package Banners</h3>
        
        <div className="flex space-x-2 mb-4">
          <Input 
            placeholder="Enter image URL" 
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="flex-grow"
          />
          
          <Button 
            type="button" 
            onClick={handleAddBanner}
            disabled={!bannerUrl.trim()}
            className="flex-shrink-0"
          >
            <Image className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>
        
        {(packageData.banners && packageData.banners.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {packageData.banners.map((url, index) => (
              <div key={index} className="relative rounded-md overflow-hidden h-40">
                <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={() => handleRemoveBanner(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm p-8 text-center border border-dashed rounded-md">
            No banners added yet. Add at least one banner image for your package.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BannersCard;
