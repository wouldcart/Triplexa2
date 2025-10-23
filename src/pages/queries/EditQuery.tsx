
import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import BreadcrumbNav from '@/components/navigation/BreadcrumbNav';
import EnquiryForm from '@/components/queries/EnquiryForm';

const EditQuery: React.FC = () => {
  const { id: encodedId } = useParams<{ id: string }>();
  const id = encodedId ? decodeURIComponent(encodedId) : undefined;

  return (
    <PageLayout>
      <BreadcrumbNav 
        customPaths={{
          [id!]: `Edit Query ${id}`
        }}
      />
      <EnquiryForm mode="edit" enquiryId={id} />
    </PageLayout>
  );
};

export default EditQuery;
