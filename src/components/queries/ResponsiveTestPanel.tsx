import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone, Maximize2 } from 'lucide-react';

interface ResponsiveTestPanelProps {
  onViewportChange?: (width: number, height: number) => void;
}

const ResponsiveTestPanel: React.FC<ResponsiveTestPanelProps> = ({ onViewportChange }) => {
  const [currentWidth, setCurrentWidth] = useState(window.innerWidth);
  const [currentHeight, setCurrentHeight] = useState(window.innerHeight);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const breakpoints = [
    { name: 'iPhone SE', width: 375, height: 667, icon: Smartphone },
    { name: 'iPhone 12/13', width: 390, height: 844, icon: Smartphone },
    { name: 'iPhone 14 Pro', width: 393, height: 852, icon: Smartphone },
    { name: 'iPad Mini', width: 768, height: 1024, icon: Tablet },
    { name: 'iPad Air', width: 820, height: 1180, icon: Tablet },
    { name: 'iPad Pro', width: 1024, height: 1366, icon: Tablet },
    { name: 'Desktop', width: 1920, height: 1080, icon: Monitor },
  ];

  useEffect(() => {
    const updateDimensions = () => {
      setCurrentWidth(window.innerWidth);
      setCurrentHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const setViewport = (width: number, height: number) => {
    if (onViewportChange) {
      onViewportChange(width, height);
    }
    // In a real implementation, you might resize the container
    console.log(`Testing viewport: ${width}x${height}`);
  };

  const getCurrentBreakpoint = () => {
    if (currentWidth < 640) return 'Mobile';
    if (currentWidth < 1024) return 'Tablet';
    return 'Desktop';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPanelVisible(!isPanelVisible)}
          className="flex items-center gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="text-xs">
            {getCurrentBreakpoint()} ({currentWidth}px)
          </span>
        </Button>

        {isPanelVisible && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold mb-3">Responsive Testing</h3>
            
            <div className="space-y-2">
              {breakpoints.map((breakpoint) => {
                const Icon = breakpoint.icon;
                return (
                  <Button
                    key={breakpoint.name}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setViewport(breakpoint.width, breakpoint.height)}
                  >
                    <Icon className="h-3 w-3 mr-2" />
                    <span className="flex-1 text-left">{breakpoint.name}</span>
                    <span className="text-muted-foreground">
                      {breakpoint.width}px
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-muted-foreground">
                <p>Current: {currentWidth} × {currentHeight}px</p>
                <p>Breakpoint: {getCurrentBreakpoint()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveTestPanel;