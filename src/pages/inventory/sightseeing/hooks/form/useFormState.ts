import { useState } from 'react';
import { Sightseeing } from '@/types/sightseeing';

export const useFormState = () => {
  const emptyForm: Sightseeing = {
    id: 0,
    name: '',
    description: '',
    country: '',
    city: '',
    status: 'active',
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    duration: '',
    transferTypes: ['SIC', 'Private'],
    transferOptions: [
      {
        id: Date.now(),
        vehicleType: 'Standard Vehicle',
        capacity: '1-4',
        price: 0,
        priceUnit: 'Per Person',
        isEnabled: true,
        type: 'SIC'
      }
    ],
    activities: [],
    daysOfWeek: [],
    price: { adult: 0, child: 0 },
    isFree: false,
    images: [],
    pricingOptions: [
      {
        id: Date.now() + 100,
        type: 'Ticket Only',
        name: 'Standard Ticket',
        adultPrice: 0,
        childPrice: 0,
        isEnabled: true
      }
    ],
    packageOptions: [],
    groupSizeOptions: [],
    policies: {
      highlights: [],
      inclusions: [],
      exclusions: [],
      advisory: '',
      refundPolicy: '',
      termsConditions: '',
      cancellationPolicy: '',
      confirmationPolicy: ''
    },
    // SIC availability management
    sicAvailable: false,
    sicPricing: { adult: 0, child: 0 },
    requiresMandatoryTransfer: false,
    transferMandatory: false
  };
  
  const [formData, setFormData] = useState<Sightseeing>(emptyForm);
  
  return { formData, setFormData };
};