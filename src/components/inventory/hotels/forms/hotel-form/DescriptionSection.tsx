
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface DescriptionSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Description & Amenities</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <label className="block text-base font-medium">Hotel Description</label>
          <Textarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder="Enter a detailed description of the hotel, including its features, surroundings, and unique selling points."
            className="min-h-[150px] resize-y border-gray-300 dark:border-gray-600 rounded-md"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Provide a comprehensive description of the hotel to help guests understand what makes it special. Include information about location highlights, services offered, and any notable amenities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DescriptionSection;
