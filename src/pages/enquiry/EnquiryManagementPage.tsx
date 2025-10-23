import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import EnquiryManagement from '@/components/enquiry/EnquiryManagement';

const EnquiryManagementPage: React.FC = () => {
  return (
    <PageLayout>
      <EnquiryManagement />
    </PageLayout>
  );
};

export default EnquiryManagementPage;