import { useState, useCallback } from 'react';
import { z } from 'zod';

// Validation schema for individual fields
const fieldValidationSchema = {
  name: z.string()
    .min(1, 'Route name is required')
    .max(100, 'Route name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_()]+$/, 'Route name contains invalid characters'),
  
  country: z.string()
    .min(1, 'Country is required')
    .max(50, 'Country name is too long'),
  
  transferType: z.enum(['One-Way', 'Round-Trip', 'Multi-Stop', 'en route'], {
    errorMap: () => ({ message: 'Please select a valid transfer type' })
  }),
  
  startLocation: z.string()
    .min(1, 'Start location is required'),
  
  endLocation: z.string()
    .min(1, 'End location is required'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  // Transport type validations
  seatingCapacity: z.number()
    .min(1, 'Seating capacity must be at least 1')
    .max(100, 'Seating capacity cannot exceed 100'),
  
  luggageCapacity: z.number()
    .min(0, 'Luggage capacity cannot be negative')
    .max(50, 'Luggage capacity cannot exceed 50'),
  
  duration: z.string()
    .regex(/^\d{1,2}:\d{2}$/, 'Duration must be in HH:MM format'),
  
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price seems too high'),
  
  // Sightseeing option validations
  adultPrice: z.number()
    .min(0, 'Adult price cannot be negative')
    .max(1000, 'Adult price seems too high'),
  
  childPrice: z.number()
    .min(0, 'Child price cannot be negative')
    .max(1000, 'Child price seems too high'),
  
  additionalCharges: z.number()
    .min(0, 'Additional charges cannot be negative')
    .max(1000, 'Additional charges seem too high'),
  
  sightseeingDescription: z.string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
};

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseFormValidationReturn {
  errors: Record<string, string>;
  validateField: (field: string, value: any) => string | null;
  validateAllFields: (data: Record<string, any>) => ValidationError[];
  clearError: (field: string) => void;
}

export const useFormValidation = (): UseFormValidationReturn => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: any): string | null => {
    try {
      const schema = fieldValidationSchema[field as keyof typeof fieldValidationSchema];
      if (!schema) return null;

      // Convert string numbers to actual numbers for numeric fields
      let processedValue = value;
      if (['seatingCapacity', 'luggageCapacity', 'price', 'adultPrice', 'childPrice', 'additionalCharges'].includes(field)) {
        processedValue = value === '' ? 0 : Number(value);
      }

      schema.parse(processedValue);
      
      // Clear error if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        
        // Set error
        setErrors(prev => ({
          ...prev,
          [field]: errorMessage
        }));
        
        return errorMessage;
      }
      return null;
    }
  }, []);

  const validateAllFields = useCallback((data: Record<string, any>): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    
    Object.keys(fieldValidationSchema).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        validationErrors.push({ field, message: error });
      }
    });
    
    return validationErrors;
  }, [validateField]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validateField,
    validateAllFields,
    clearError,
  };
};

// Custom validation rules for complex scenarios
export const customValidationRules = {
  // Validate that start and end locations are different
  validateLocationsDifferent: (startLocation: string, endLocation: string): string | null => {
    if (startLocation && endLocation && startLocation === endLocation) {
      return 'Start and end locations must be different';
    }
    return null;
  },

  // Validate that intermediate stops don't duplicate start/end locations
  validateIntermediateStops: (
    intermediateStops: Array<{ locationCode: string }>,
    startLocation: string,
    endLocation: string
  ): string | null => {
    if (!intermediateStops || intermediateStops.length === 0) return null;

    const duplicateStart = intermediateStops.some(stop => stop.locationCode === startLocation);
    const duplicateEnd = intermediateStops.some(stop => stop.locationCode === endLocation);

    if (duplicateStart) {
      return 'Intermediate stops cannot include the start location';
    }
    if (duplicateEnd) {
      return 'Intermediate stops cannot include the end location';
    }

    // Check for duplicate intermediate stops
    const locationCodes = intermediateStops.map(stop => stop.locationCode);
    const uniqueCodes = new Set(locationCodes);
    if (locationCodes.length !== uniqueCodes.size) {
      return 'Intermediate stops must be unique';
    }

    return null;
  },

  // Validate that at least one sightseeing option exists when sightseeing is enabled
  validateSightseeingOptions: (
    enableSightseeing: boolean,
    sightseeingOptions: Array<any>
  ): string | null => {
    if (enableSightseeing && (!sightseeingOptions || sightseeingOptions.length === 0)) {
      return 'At least one sightseeing option is required when sightseeing is enabled';
    }
    return null;
  },

  // Validate child price is not higher than adult price
  validatePriceRelationship: (adultPrice: number, childPrice: number): string | null => {
    if (adultPrice > 0 && childPrice > 0 && childPrice > adultPrice) {
      return 'Child price should not be higher than adult price';
    }
    return null;
  },
};