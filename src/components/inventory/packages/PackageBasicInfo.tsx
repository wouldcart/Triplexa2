
import React from 'react';
import { PackageComponentProps } from './types/packageTypes';
import BasicInfoCard from './components/BasicInfoCard';
import DestinationsCard from './components/DestinationsCard';
import ThemesCard from './components/ThemesCard';
import BannersCard from './components/BannersCard';

const PackageBasicInfo: React.FC<PackageComponentProps> = ({ packageData, updatePackageData }) => {
  return (
    <div className="space-y-6">
      <BasicInfoCard packageData={packageData} updatePackageData={updatePackageData} />
      <DestinationsCard packageData={packageData} updatePackageData={updatePackageData} />
      <ThemesCard packageData={packageData} updatePackageData={updatePackageData} />
      <BannersCard packageData={packageData} updatePackageData={updatePackageData} />
    </div>
  );
};

export default PackageBasicInfo;
