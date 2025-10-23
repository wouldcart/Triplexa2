
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import EnhancedCreateProposalForm from '@/components/proposal/enhanced/EnhancedCreateProposalForm';

const EnhancedProposalCreation: React.FC = () => {
  return (
    <PageLayout>
      <EnhancedCreateProposalForm />
    </PageLayout>
  );
};

export default EnhancedProposalCreation;
