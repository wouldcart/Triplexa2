
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbNavProps {
  customPaths?: { [key: string]: string };
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ customPaths = {} }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const getPathName = (path: string, index: number): string => {
    if (customPaths[path]) return customPaths[path];

    const pathMappings: { [key: string]: string } = {
      'queries': 'Queries',
      'proposal': 'Basic Proposal',
      'enhanced-proposal': 'Enhanced Proposal',
      'advanced-proposal': 'Advanced Proposal',
      'create': 'Create',
      'edit': 'Edit',
      'details': 'Details',
      'inventory': 'Inventory',
      'hotels': 'Hotels',
      'transport': 'Transport',
      'restaurants': 'Restaurants',
      'sightseeing': 'Sightseeing',
      'packages': 'Packages',
      'management': 'Management',
      'agents': 'Agents',
      'staff': 'Staff',
      'settings': 'Settings',
      'bookings': 'Bookings',
      'followups': 'Follow-ups'
    };

    // Check if it's an ID (starts with ENQ or contains numbers)
    if (path.startsWith('ENQ') || /^\d+$/.test(path)) {
      return `#${path}`;
    }

    return pathMappings[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  const generatePath = (index: number): string => {
    return '/' + pathnames.slice(0, index + 1).join('/');
  };

  if (pathnames.length === 0) return null;

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home
    },
    ...pathnames.map((path, index) => {
      const isLast = index === pathnames.length - 1;
      const href = isLast ? undefined : generatePath(index);
      const name = getPathName(path, index);

      return {
        label: name,
        href
      };
    })
  ];

  return <Breadcrumb items={breadcrumbItems} className="mb-4" />;
};

export default BreadcrumbNav;
