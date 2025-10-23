
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FullScreenItineraryLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showBackButton?: boolean;
  backUrl?: string;
  rightContent?: React.ReactNode;
}

const FullScreenItineraryLayout: React.FC<FullScreenItineraryLayoutProps> = ({
  children,
  title = "Itinerary Builder",
  subtitle,
  isFullscreen = false,
  onToggleFullscreen,
  showBackButton = true,
  backUrl = "/queries",
  rightContent
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-border/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {rightContent}
              {onToggleFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  className="flex items-center gap-2"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4" />
                      Fullscreen
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FullScreenItineraryLayout;
