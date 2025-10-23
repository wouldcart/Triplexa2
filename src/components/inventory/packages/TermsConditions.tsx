
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { TourPackage } from '@/types/package';

interface TermsConditionsProps {
  packageData: Partial<TourPackage>;
  updatePackageData: (updates: Partial<TourPackage>) => void;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ packageData, updatePackageData }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Inclusions</h3>
          <Textarea 
            placeholder="List all inclusions for this package (e.g., accommodation, meals, transfers, etc.)"
            value={packageData.inclusions || ''}
            onChange={(e) => updatePackageData({ inclusions: e.target.value })}
            rows={6}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Clearly list all services and amenities included in the package price.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Exclusions</h3>
          <Textarea 
            placeholder="List all exclusions for this package (e.g., flights, visa fees, personal expenses, etc.)"
            value={packageData.exclusions || ''}
            onChange={(e) => updatePackageData({ exclusions: e.target.value })}
            rows={6}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Specify what services are not included in the package price to avoid misunderstandings.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Cancellation Policy</h3>
          <Textarea 
            placeholder="Detail the cancellation policy for this package"
            value={packageData.cancellationPolicy || ''}
            onChange={(e) => updatePackageData({ cancellationPolicy: e.target.value })}
            rows={6}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Clearly explain refund percentages based on cancellation timeframes.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Payment Policy</h3>
          <Textarea 
            placeholder="Detail the payment schedule and requirements"
            value={packageData.paymentPolicy || ''}
            onChange={(e) => updatePackageData({ paymentPolicy: e.target.value })}
            rows={6}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Specify deposit requirements, payment deadlines, and accepted payment methods.
          </p>
        </CardContent>
      </Card>
      
      <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/30 rounded-lg">
        <div className="flex">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Well-documented terms and conditions help prevent disputes and provide clarity to your customers.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
              Consider adding any specific restrictions, requirements, or special information that applies to this tour package.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
