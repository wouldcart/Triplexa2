import { useState, useCallback, useMemo } from 'react';
import { ProposalComponentOption, ProposalPackage, ProposalVariant, AllOptionTypes } from '@/types/proposalOptions';

interface UseProposalOptionsReturn {
  // Core state
  options: ProposalComponentOption[];
  packages: ProposalPackage[];
  selectedPackage: string | null;
  customOptions: ProposalComponentOption[];
  
  // Actions
  addOption: (option: ProposalComponentOption) => void;
  removeOption: (optionId: string) => void;
  updateOption: (optionId: string, updates: Partial<ProposalComponentOption>) => void;
  toggleOption: (optionId: string) => void;
  
  // Package management
  createPackage: (packageData: Partial<ProposalPackage>) => string;
  selectPackage: (packageId: string) => void;
  updatePackage: (packageId: string, updates: Partial<ProposalPackage>) => void;
  
  // Filtering and querying
  getOptionsByType: (type: ProposalComponentOption['componentType']) => ProposalComponentOption[];
  getSelectedOptions: () => ProposalComponentOption[];
  getOptionalOptions: () => ProposalComponentOption[];
  getAlternativeOptions: () => ProposalComponentOption[];
  
  // Calculations
  getTotalPrice: () => number;
  getPackagePrice: (packageId: string) => number;
  calculateSavings: () => number;
  
  // Utilities
  clearOptions: () => void;
  validateDependencies: (optionId: string) => boolean;
  getCompatibleOptions: (optionId: string) => ProposalComponentOption[];
}

export const useProposalOptions = (initialOptions: ProposalComponentOption[] = []): UseProposalOptionsReturn => {
  const [options, setOptions] = useState<ProposalComponentOption[]>(initialOptions);
  const [packages, setPackages] = useState<ProposalPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customOptions, setCustomOptions] = useState<ProposalComponentOption[]>([]);

  // Core option management
  const addOption = useCallback((option: ProposalComponentOption) => {
    setOptions(prev => [...prev, { ...option, id: option.id || `opt_${Date.now()}` }]);
  }, []);

  const removeOption = useCallback((optionId: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== optionId));
    setCustomOptions(prev => prev.filter(opt => opt.id !== optionId));
  }, []);

  const updateOption = useCallback((optionId: string, updates: Partial<ProposalComponentOption>) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  }, []);

  const toggleOption = useCallback((optionId: string) => {
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, isSelected: !opt.isSelected } : opt
    ));
  }, []);

  // Package management
  const createPackage = useCallback((packageData: Partial<ProposalPackage>): string => {
    const packageId = `pkg_${Date.now()}`;
    const newPackage: ProposalPackage = {
      id: packageId,
      name: packageData.name || 'New Package',
      type: packageData.type || 'custom',
      description: packageData.description || '',
      options: packageData.options || [],
      basePrice: packageData.basePrice || 0,
      totalPrice: packageData.totalPrice || 0,
      isSelected: false,
      ...packageData
    };
    
    setPackages(prev => [...prev, newPackage]);
    return packageId;
  }, []);

  const selectPackage = useCallback((packageId: string) => {
    setSelectedPackage(packageId);
    setPackages(prev => prev.map(pkg => ({ 
      ...pkg, 
      isSelected: pkg.id === packageId 
    })));
    
    // Update options based on selected package
    const selectedPkg = packages.find(pkg => pkg.id === packageId);
    if (selectedPkg) {
      setOptions(prev => prev.map(opt => ({
        ...opt,
        isSelected: selectedPkg.options.some(pkgOpt => pkgOpt.id === opt.id)
      })));
    }
  }, [packages]);

  const updatePackage = useCallback((packageId: string, updates: Partial<ProposalPackage>) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    ));
  }, []);

  // Filtering and querying
  const getOptionsByType = useCallback((type: ProposalComponentOption['componentType']) => {
    return options.filter(opt => opt.componentType === type);
  }, [options]);

  const getSelectedOptions = useCallback(() => {
    return options.filter(opt => opt.isSelected);
  }, [options]);

  const getOptionalOptions = useCallback(() => {
    return options.filter(opt => opt.type === 'optional');
  }, [options]);

  const getAlternativeOptions = useCallback(() => {
    return options.filter(opt => opt.type === 'alternative');
  }, [options]);

  // Calculations
  const getTotalPrice = useCallback(() => {
    return getSelectedOptions().reduce((total, opt) => total + opt.pricing.totalPrice, 0);
  }, [getSelectedOptions]);

  const getPackagePrice = useCallback((packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg?.totalPrice || 0;
  }, [packages]);

  const calculateSavings = useCallback(() => {
    const individualTotal = options.reduce((total, opt) => total + opt.pricing.totalPrice, 0);
    const selectedTotal = getTotalPrice();
    return Math.max(0, individualTotal - selectedTotal);
  }, [options, getTotalPrice]);

  // Utilities
  const clearOptions = useCallback(() => {
    setOptions([]);
    setCustomOptions([]);
    setSelectedPackage(null);
  }, []);

  const validateDependencies = useCallback((optionId: string): boolean => {
    // Implement dependency validation logic
    // For now, return true (no conflicts)
    return true;
  }, []);

  const getCompatibleOptions = useCallback((optionId: string): ProposalComponentOption[] => {
    // Implement compatibility logic
    // For now, return all options except the specified one
    return options.filter(opt => opt.id !== optionId);
  }, [options]);

  return {
    // Core state
    options,
    packages,
    selectedPackage,
    customOptions,
    
    // Actions
    addOption,
    removeOption,
    updateOption,
    toggleOption,
    
    // Package management
    createPackage,
    selectPackage,
    updatePackage,
    
    // Filtering and querying
    getOptionsByType,
    getSelectedOptions,
    getOptionalOptions,
    getAlternativeOptions,
    
    // Calculations
    getTotalPrice,
    getPackagePrice,
    calculateSavings,
    
    // Utilities
    clearOptions,
    validateDependencies,
    getCompatibleOptions
  };
};