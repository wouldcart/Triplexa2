
import { TourPackage } from '@/types/package';
import { mockPackages } from '@/data/packageData';

// Load packages from localStorage or use mock data if none exists
export const loadPackages = (): TourPackage[] => {
  try {
    const savedPackages = localStorage.getItem('tourPackages');
    if (savedPackages) {
      return JSON.parse(savedPackages);
    } else {
      savePackages(mockPackages);
      return mockPackages;
    }
  } catch (error) {
    console.error("Error loading packages:", error);
    return mockPackages;
  }
};

// Save packages to localStorage
export const savePackages = (packages: TourPackage[]): void => {
  try {
    localStorage.setItem('tourPackages', JSON.stringify(packages));
  } catch (error) {
    console.error("Error saving packages:", error);
  }
};

// Get a package by ID
export const getPackageById = (id: string): TourPackage | null => {
  const packages = loadPackages();
  return packages.find(pkg => pkg.id === id) || null;
};

// Add a new package
export const addPackage = (newPackage: TourPackage): void => {
  const packages = loadPackages();
  
  // Add timestamp if not present
  if (!newPackage.createdAt) {
    newPackage.createdAt = new Date().toISOString();
  }
  
  packages.push(newPackage);
  savePackages(packages);
};

// Update an existing package
export const updatePackage = (id: string, updatedPackage: TourPackage): void => {
  let packages = loadPackages();
  
  // Add timestamp for updates
  updatedPackage.updatedAt = new Date().toISOString();
  
  // Find and update package
  packages = packages.map(pkg => 
    pkg.id === id ? { ...updatedPackage, id } : pkg
  );
  
  savePackages(packages);
};

// Delete a package
export const deletePackage = (id: string): void => {
  let packages = loadPackages();
  packages = packages.filter(pkg => pkg.id !== id);
  savePackages(packages);
};

// Generate a new package ID
export const getNextId = (): string => {
  const packages = loadPackages();
  if (packages.length === 0) return 'PKG001';
  
  // Find the highest ID number and increment
  const highestId = packages
    .map(pkg => pkg.id)
    .filter(id => id.startsWith('PKG'))
    .map(id => parseInt(id.replace('PKG', ''), 10))
    .reduce((max, id) => Math.max(max, id), 0);
  
  // Format the new ID with leading zeros
  return `PKG${(highestId + 1).toString().padStart(3, '0')}`;
};
