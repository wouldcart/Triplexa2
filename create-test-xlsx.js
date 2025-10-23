import XLSX from 'xlsx';

// Test data for import
const testData = [
  {
    'Country Name': 'Test Country 1',
    'Country Code': 'TC1',
    'Region': 'Test Region',
    'Continent': 'Test Continent',
    'Currency': 'USD',
    'Currency Symbol': '$',
    'Status': 'active',
    'Flag URL': 'https://flagcdn.com/tc1.svg',
    'Is Popular': 'true',
    'Visa Required': 'false',
    'Languages': 'English',
    'Pricing Currency Override': 'false',
    'Pricing Currency': '',
    'Pricing Currency Symbol': ''
  },
  {
    'Country Name': 'Test Country 2',
    'Country Code': 'TC2',
    'Region': 'Test Region',
    'Continent': 'Test Continent',
    'Currency': 'EUR',
    'Currency Symbol': '€',
    'Status': 'active',
    'Flag URL': 'https://flagcdn.com/tc2.svg',
    'Is Popular': 'false',
    'Visa Required': 'true',
    'Languages': 'French',
    'Pricing Currency Override': 'false',
    'Pricing Currency': '',
    'Pricing Currency Symbol': ''
  },
  {
    'Country Name': 'Test Country 3',
    'Country Code': 'TC3',
    'Region': 'Test Region',
    'Continent': 'Test Continent',
    'Currency': 'GBP',
    'Currency Symbol': '£',
    'Status': 'inactive',
    'Flag URL': 'https://flagcdn.com/tc3.svg',
    'Is Popular': 'true',
    'Visa Required': 'false',
    'Languages': 'English',
    'Pricing Currency Override': 'true',
    'Pricing Currency': 'USD',
    'Pricing Currency Symbol': '$'
  }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(testData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Countries');

// Write file
XLSX.writeFile(wb, 'test-countries-import.xlsx');

console.log('Test XLSX file created: test-countries-import.xlsx');