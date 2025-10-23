import { Sightseeing } from '@/types/sightseeing';

export interface FormHandlersProps {
  setFormData: React.Dispatch<React.SetStateAction<Sightseeing>>;
}

export const useFormHandlers = ({ setFormData }: FormHandlersProps) => {
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value, lastUpdated: new Date().toISOString() };
      
      // If updating pricing options, ensure proper structure
      if (field === 'pricingOptions' && Array.isArray(value)) {
        updated.pricingOptions = value.map(option => ({
          ...option,
          id: option.id || Date.now() + Math.random(),
          name: option.name || option.type || 'Standard',
          adultPrice: Number(option.adultPrice) || 0,
          childPrice: Number(option.childPrice) || 0,
          isEnabled: option.isEnabled !== undefined ? option.isEnabled : true
        }));
      }

      // If updating package options, ensure proper structure
      if (field === 'packageOptions' && Array.isArray(value)) {
        updated.packageOptions = value.map(option => ({
          ...option,
          id: option.id || Date.now() + Math.random(),
          adultPrice: Number(option.adultPrice) || 0,
          childPrice: Number(option.childPrice) || 0,
          isEnabled: option.isEnabled !== undefined ? option.isEnabled : true
        }));
      }

      // If updating group size options, ensure proper structure
      if (field === 'groupSizeOptions' && Array.isArray(value)) {
        updated.groupSizeOptions = value.map(option => ({
          ...option,
          id: option.id || Date.now() + Math.random(),
          adultPrice: Number(option.adultPrice) || 0,
          childPrice: Number(option.childPrice) || 0
        }));
      }

      // Handle SIC pricing updates
      if (field === 'sicPricing' && value) {
        updated.sicPricing = {
          adult: Number(value.adult) || 0,
          child: Number(value.child) || 0
        };
      }

      // Handle SIC availability logic
      if (field === 'sicAvailable') {
        if (value && !updated.sicPricing) {
          updated.sicPricing = { adult: 0, child: 0 };
        }
      }

      // Auto-generate Google Map link when latitude/longitude are set
      if (field === 'latitude' || field === 'longitude') {
        const lat = field === 'latitude' ? value : updated.latitude;
        const lon = field === 'longitude' ? value : updated.longitude;
        if (typeof lat === 'number' && typeof lon === 'number') {
          const autoLink = `https://www.google.com/maps?q=${lat},${lon}`;
          updated.googleMapLink = autoLink;
        }
      }

      return updated;
    });
  };
  
  return { handleFormChange };
};