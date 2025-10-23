import { useEffect } from 'react';
import { Sightseeing } from '@/types/sightseeing';
import { getSightseeingById } from '../../services/sightseeingService';

export interface EditModeEffectProps {
  sightseeingId?: number;
  setFormData: React.Dispatch<React.SetStateAction<Sightseeing>>;
}

export const useEditModeEffect = ({ sightseeingId, setFormData }: EditModeEffectProps) => {
  useEffect(() => {
    const loadExisting = async () => {
      if (!sightseeingId) return;
      const existingSightseeing = await getSightseeingById(sightseeingId);
      if (existingSightseeing) {
        // Ensure we have an images array
        const preparedData = { 
          ...existingSightseeing,
          images: existingSightseeing.images || [],
          policies: existingSightseeing.policies || {
            highlights: [],
            inclusions: [],
            exclusions: [],
            advisory: '',
            refundPolicy: '',
            termsConditions: '',
            cancellationPolicy: '',
            confirmationPolicy: ''
          }
        };
        
        // If there's an imageUrl but no images array, create one
        if (existingSightseeing.imageUrl && (!existingSightseeing.images || existingSightseeing.images.length === 0)) {
          preparedData.images = [
            {
              id: 1,
              url: existingSightseeing.imageUrl,
              isPrimary: true
            }
          ];
        }

        // Initialize transferOptions if they don't exist
        if (!preparedData.transferOptions || preparedData.transferOptions.length === 0) {
          preparedData.transferOptions = [
            {
              id: Date.now(),
              vehicleType: 'Standard Vehicle',
              capacity: '1-4',
              price: 0,
              priceUnit: 'Per Person',
              isEnabled: true,
              type: 'SIC'
            }
          ];
          preparedData.transferTypes = preparedData.transferTypes || ['SIC', 'Private'];
        }

        // Ensure pricing options have proper structure
        if (!preparedData.pricingOptions || preparedData.pricingOptions.length === 0) {
          preparedData.pricingOptions = [
            {
              id: Date.now() + 100,
              type: 'Ticket Only',
              name: 'Standard Ticket',
              adultPrice: preparedData.price?.adult || 0,
              childPrice: preparedData.price?.child || 0,
              isEnabled: true
            }
          ];
        }

        // Ensure package options are initialized
        if (!preparedData.packageOptions) {
          preparedData.packageOptions = [];
        }

        // Ensure group size options are initialized
        if (!preparedData.groupSizeOptions) {
          preparedData.groupSizeOptions = [];
        }
        
        setFormData(preparedData);
      }
    };

    loadExisting();
  }, [sightseeingId, setFormData]);
};