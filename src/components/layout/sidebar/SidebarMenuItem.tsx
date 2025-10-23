
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarMenuItemProps {
  title: string;
  path: string;
  icon: LucideIcon;
  isActive: boolean;
  sidebarOpen: boolean;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({ 
  title, 
  path, 
  icon: Icon, 
  isActive, 
  sidebarOpen 
}) => {
  const location = useLocation();
  
  // Check if this is the active path or a subpath
  const isActivePath = isActive || location.pathname.startsWith(`${path}/`);
  
  // Wrap link in tooltip when sidebar is collapsed
  if (!sidebarOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to={path}
            className={cn(
              "flex items-center justify-center py-2.5 px-3 my-0.5 rounded-md transition-colors duration-200",
              isActivePath 
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            <Icon size={18} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  // Full sidebar mode
  return (
    <Link 
      to={path}
      className={cn(
        "flex items-center py-2 px-3 my-0.5 rounded-md transition-colors duration-200",
        isActivePath 
          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
    >
      <Icon size={18} className="mr-2.5" />
      <span className="text-sm">{title}</span>
    </Link>
  );
};

export default SidebarMenuItem;
