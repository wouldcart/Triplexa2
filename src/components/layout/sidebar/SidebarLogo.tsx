
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { useTheme } from 'next-themes';
import { X, Image as ImageIcon } from 'lucide-react';

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
  const { theme, systemTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  // Determine which logo to show based on theme with system theme support
  const currentTheme = theme === 'system' ? (systemTheme || 'light') : theme;
  const shouldShowDarkLogo = currentTheme === 'dark' && settings.darkLogo;
  const activeLogo = shouldShowDarkLogo ? settings.darkLogo : settings.logo;

  // Handle smooth logo transitions
  useEffect(() => {
    if (activeLogo !== currentLogoUrl) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentLogoUrl(activeLogo);
        setIsTransitioning(false);
      }, 150); // Smooth transition delay
      return () => clearTimeout(timer);
    }
  }, [activeLogo, currentLogoUrl]);

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
      "h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 transition-colors duration-300",
      sidebarOpen ? "px-4" : "px-2 justify-center"
    )}>
      <div className={cn(
        "flex items-center justify-center w-full transition-all duration-300 ease-in-out",
        sidebarOpen ? "justify-start space-x-3" : "justify-center"
      )}>
        {/* Logo Container with Smooth Transitions */}
        <div className={cn(
          `${getLogoSizeClasses()} flex items-center justify-center flex-shrink-0 mx-auto transition-all duration-300 ease-in-out`,
          isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"
        )}>
          {currentLogoUrl ? (
            <img 
              src={currentLogoUrl} 
              alt={`${settings.companyDetails.name} Logo`}
              className={`${getImageSizeClasses()} max-w-none object-contain transition-all duration-300 ease-in-out`}
              loading="eager"
              decoding="sync"
            />
          ) : (
            <div className={cn(
              "w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center transition-all duration-300 ease-in-out",
              currentTheme === 'dark' ? "shadow-lg shadow-blue-500/20" : "shadow-md shadow-blue-500/10"
            )}>
              <span className="font-bold text-white text-lg transition-all duration-300">
                {settings.companyDetails.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        {/* Company Name with Smooth Transition */}
        {sidebarOpen && !currentLogoUrl && (
          <span className={cn(
            "font-semibold text-base transition-all duration-300 ease-in-out",
            "text-gray-900 dark:text-white"
          )}>
            {settings.companyDetails.name}
          </span>
        )}
      </div>

      {/* Mobile Close Button with Enhanced Accessibility */}
      {sidebarOpen && isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className={cn(
            "h-8 w-8 rounded-full flex-shrink-0 transition-all duration-200",
            "hover:bg-gray-100 dark:hover:bg-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          )}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <X className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
        </Button>
      )}
    </div>
  );
};

export default SidebarLogo;
