
import React from 'react';
import { Input } from '@/components/ui/input';

interface AddressSectionProps {
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  handleAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  address,
  handleAddressChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Street</label>
          <Input
            type="text"
            name="street"
            value={address?.street || ''}
            onChange={handleAddressChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">City</label>
          <Input
            type="text"
            name="city"
            value={address?.city || ''}
            onChange={handleAddressChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">State</label>
          <Input
            type="text"
            name="state"
            value={address?.state || ''}
            onChange={handleAddressChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Zip Code</label>
          <Input
            type="text"
            name="zipCode"
            value={address?.zipCode || ''}
            onChange={handleAddressChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Country</label>
          <Input
            type="text"
            name="country"
            value={address?.country || ''}
            onChange={handleAddressChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressSection;
