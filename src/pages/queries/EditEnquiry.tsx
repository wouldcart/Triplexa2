
import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import EnquiryForm from '@/components/queries/EnquiryForm';

const EditEnquiry: React.FC = () => {
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? decodeURIComponent(encodedId) : undefined;

  return (
    <PageLayout>
      <EnquiryForm mode="edit" enquiryId={id} />
    </PageLayout>
  );
};

export default EditEnquiry;
