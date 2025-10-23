
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';

interface SidebarLogoProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const SidebarLogo: React.FC<SidebarLogoProps> = ({ sidebarOpen, isMobile, onClose }) => {
  let settings;
  try {
    const context = useApplicationSettings();
    settings = context.settings;
  } catch (error) {
    // Fallback if context is not available
    settings = {
      logo: null,
      darkLogo: null,
      logoSize: 'medium' as const,
      companyDetails: { name: 'TripOex' }
    };
  }
  const { theme } = useTheme();

  // Determine which logo to show based on theme
  const currentLogo = theme === 'dark' && settings.darkLogo ? settings.darkLogo : settings.logo;

  const getLogoSizeClasses = () => {
    switch (settings.logoSize) {
      case 'small':
        return 'h-8 w-8';
      case 'large':
        return 'h-14 w-14';
      default:
        return 'h-10 w-10';
    }
  };

  const getImageSizeClasses = () => {
    switch (settings.logoSize) {
      case 'small':
        return 'h-8 w-auto';
      case 'large':
        return 'h-14 w-auto';
      default:
        return 'h-10 w-auto';
    }
  };

  return (
    <div className={cn(
      "h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700",
      sidebarOpen ? "px-4" : "px-2 justify-center"
    )}>
      <div className={cn(
        "flex items-center justify-center w-full",
        sidebarOpen ? "justify-start space-x-3" : "justify-center"
      )}>
        {currentLogo ? (
          <div className={`${getLogoSizeClasses()} flex items-center justify-center flex-shrink-0 mx-auto`}>
            <img 
              src={currentLogo} 
              alt={settings.companyDetails.name}
              className={`logo-image ${getImageSizeClasses()} max-w-none object-contain`}
            />
          </div>
        ) : (
          <div className={`${getLogoSizeClasses()} bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0 mx-auto`}>
            <span className="font-bold text-white text-lg">
              {settings.companyDetails.name.charAt(0)}
            </span>
          </div>
        )}
        {sidebarOpen && !currentLogo && (
          <span className="font-semibold text-base text-gray-900 dark:text-white">
            {settings.companyDetails.name}
          </span>
        )}
      </div>

      {/* Mobile Close Button */}
      {sidebarOpen && isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default SidebarLogo;
