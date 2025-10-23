export interface CountryEnquirySettings {
  countryCode: string;
  countryName: string;
  prefix: string;
  yearFormat: 'YYYY' | 'YY' | 'none';
  yearSeparator: 'none' | '/' | '-';
  numberLength: number;
  numberSeparator: 'none' | '/' | '-';
  startingNumber: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface EnquiryConfiguration {
  countries: CountryEnquirySettings[];
  defaultCountryCode: string;
}

export const DEFAULT_ENQUIRY_COUNTRIES: CountryEnquirySettings[] = [
  {
    countryCode: 'TH',
    countryName: 'Thailand',
    prefix: 'ENQ',
    yearFormat: 'YYYY',
    yearSeparator: 'none',
    numberLength: 4,
    numberSeparator: 'none',
    startingNumber: 1,
    isDefault: true,
    isActive: true
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    prefix: 'DEQ',
    yearFormat: 'YYYY',
    yearSeparator: '/',
    numberLength: 4,
    numberSeparator: '/',
    startingNumber: 1,
    isDefault: false,
    isActive: true
  }
];