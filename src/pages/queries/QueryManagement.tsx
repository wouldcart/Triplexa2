
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import EnhancedQueryManagement from '@/components/queries/EnhancedQueryManagement';

const QueryManagement: React.FC = () => {
  return (
    <PageLayout>
      <BreadcrumbNav />
      <EnhancedQueryManagement />
    </PageLayout>
  );
};

export default QueryManagement;
