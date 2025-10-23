
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import EnquiryForm from '@/components/queries/EnquiryForm';

const CreateEnquiry: React.FC = () => {
  return (
    <PageLayout>
      <EnquiryForm mode="create" />
    </PageLayout>
  );
};

export default CreateEnquiry;
