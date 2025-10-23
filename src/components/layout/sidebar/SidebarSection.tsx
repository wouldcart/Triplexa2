
import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import iconMap from './IconMap';
import SidebarMenuItem from './SidebarMenuItem';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';

interface SidebarItem {
  title: string;
  path: string;
  icon?: string;
  adminOnly?: boolean;
}

interface SidebarSectionItem {
  title: string;
  section?: boolean;
  path?: string;
  items?: SidebarItem[];
  icon?: string;
  adminOnly?: boolean;
}

interface SidebarSectionProps {
  section: SidebarSectionItem;
  sidebarOpen: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ section, sidebarOpen }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { translate } = useApp();
  const { isAdmin } = useAccessControl();

  // If this section is for admins only and the user is not an admin, don't render anything
  if (section.adminOnly && !isAdmin) {
    return null;
  }

  // Check if this section or any of its items is active
  const isActiveSection = section.path === currentPath || 
                          section.items?.some(item => 
                            currentPath === item.path || currentPath.startsWith(item.path + '/')
                          );

  // State to track if section is expanded (default to expanded if active)
  const [isExpanded, setIsExpanded] = useState(isActiveSection);

  // Toggle section expansion
  const toggleSection = () => {
    if (sidebarOpen) {
      setIsExpanded(prev => !prev);
    }
  };

  // Update the title if it's "Query Management" to "Enquiry Management"
  const getTitle = (title: string) => {
    if (title === "Query Management") {
      return "Enquiry Management";
    } else if (title === "Queries Management") {
      return "Enquiry Management";
    } else if (title === "Itinerary Builder") {
      return "AI Itinerary Builder";
    }
    return title;
  };

  if (section.section) {
    // Section header with items
    return (
      <div className={cn("mt-2", !sidebarOpen && "px-0")}>
        {sidebarOpen && (
          <div 
            className={cn(
              "flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 py-1 px-3 cursor-pointer",
              isActiveSection && "text-blue-500"
            )}
            onClick={toggleSection}
          >
            <span>{translate(getTitle(section.title))}</span>
            {isExpanded ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronRight className="h-3 w-3" />
            }
          </div>
        )}
        
        {/* Show items if expanded or if sidebar is collapsed */}
        {(isExpanded || !sidebarOpen) && section.items?.map((subItem, subIndex) => {
          // If the item is adminOnly and user is not admin, skip rendering
          if (subItem.adminOnly && !isAdmin) return null;
          
          // Check if this route or any of its subroutes is active
          const isActive = currentPath === subItem.path || currentPath.startsWith(subItem.path + '/');
          const Icon = iconMap[getTitle(subItem.title)] || iconMap[getTitle(section.title)] || iconMap['Dashboard']; // Default to section icon or dashboard icon if not found
          
          return (
            <SidebarMenuItem
              key={subIndex}
              title={translate(getTitle(subItem.title))}
              path={subItem.path}
              icon={Icon}
              isActive={isActive}
              sidebarOpen={sidebarOpen}
            />
          );
        })}
      </div>
    );
  } else {
    // Top-level menu item
    const isActive = currentPath === section.path || currentPath.startsWith(section.path + '/');
    const Icon = iconMap[getTitle(section.title)] || iconMap['Dashboard'];
    
    return (
      <SidebarMenuItem
        title={translate(getTitle(section.title))}
        path={section.path || "/"}
        icon={Icon}
        isActive={isActive}
        sidebarOpen={sidebarOpen}
      />
    );
  }
};

export default SidebarSection;
