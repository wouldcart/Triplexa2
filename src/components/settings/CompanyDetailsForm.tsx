
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building, Save } from 'lucide-react';

interface CompanyDetails {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface CompanyDetailsFormProps {
  companyDetails: CompanyDetails;
  onSave: (details: CompanyDetails) => void;
}

const CompanyDetailsForm: React.FC<CompanyDetailsFormProps> = ({ companyDetails, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CompanyDetails>(companyDetails);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(companyDetails);
    setHasChanges(false);
  }, [companyDetails]);

  const handleChange = (field: keyof CompanyDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(formData);
    setHasChanges(false);
    toast({
      title: "Company details saved",
      description: "Company information has been updated successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Company Details
        </CardTitle>
        <CardDescription>
          Configure your company information and contact details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="Enter company tagline"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your company and services"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter complete business address"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website URL</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://www.company.com"
          />
        </div>

        {hasChanges && (
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Company Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyDetailsForm;
