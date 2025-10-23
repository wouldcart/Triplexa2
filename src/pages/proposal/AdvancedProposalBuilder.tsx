
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import EnhancedProposalManager from '@/components/proposal/EnhancedProposalManager';

const AdvancedProposalBuilder: React.FC = () => {
  return (
    <PageLayout>
      <EnhancedProposalManager />
    </PageLayout>
  );
};

export default AdvancedProposalBuilder;
