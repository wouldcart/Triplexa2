
import { CountryEnquirySettings, EnquiryConfiguration, DEFAULT_ENQUIRY_COUNTRIES } from '../types/enquiry';
import { initialCountries } from '../pages/inventory/countries/data/countryData';

export class EnqIdGenerator {
  private static validateCountryForEnquiry(countryCode: string): boolean {
    // Check if country exists in active countries from Countries Management module
    const country = initialCountries.find(c => c.code === countryCode);
    if (!country || country.status !== 'active') {
      console.warn(`Country ${countryCode} is not active in the Countries Management module`);
      return false;
    }
    return true;
  }

  private static getApplicationSettings(): EnquiryConfiguration {
    const savedSettings = localStorage.getItem('applicationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return parsed.enquirySettings || {
          countries: DEFAULT_ENQUIRY_COUNTRIES,
          defaultCountryCode: 'TH'
        };
      } catch (error) {
        console.error('Error parsing application settings:', error);
      }
    }
    
    // Fallback to default - use proper default countries including UAE
    console.log('EnqIdGenerator: Using default enquiry configuration');
    return {
      countries: DEFAULT_ENQUIRY_COUNTRIES,
      defaultCountryCode: 'TH'
    };
  }

  private static buildEnquiryId(country: CountryEnquirySettings, sequenceNumber: number): string {
    const { prefix, yearFormat, yearSeparator, numberLength, numberSeparator } = country;
    
    let year = '';
    if (yearFormat === 'YYYY') {
      year = new Date().getFullYear().toString();
    } else if (yearFormat === 'YY') {
      year = new Date().getFullYear().toString().slice(-2);
    }
    
    // Allow numbers to exceed initial length (e.g., 9999 -> 10000)
    const numberStr = sequenceNumber.toString();
    const minLength = numberLength;
    const paddedNumber = numberStr.length >= minLength ? numberStr : numberStr.padStart(minLength, '0');
    
    // Build format based on separators
    let enquiryId = prefix;
    
    if (year) {
      enquiryId += (yearSeparator === 'none' ? '' : yearSeparator) + year;
    }
    
    if (paddedNumber) {
      enquiryId += (numberSeparator === 'none' ? '' : numberSeparator) + paddedNumber;
    }
    
    return enquiryId;
  }

  public static generateEnqId(countryCode?: string): string {
    const config = this.getApplicationSettings();
    
    // Find the country settings
    const targetCountryCode = countryCode || config.defaultCountryCode;
    console.log('EnqIdGenerator: Generating ID for country code:', targetCountryCode);
    console.log('EnqIdGenerator: Available enquiry configurations:', config.countries.map(c => ({ code: c.countryCode, prefix: c.prefix, active: c.isActive })));
    
    // Validate country is active in Countries Management module
    if (!this.validateCountryForEnquiry(targetCountryCode)) {
      console.error(`EnqIdGenerator: Country ${targetCountryCode} is not active in the Countries Management module`);
      throw new Error(`Country ${targetCountryCode} is not active in the Countries Management module`);
    }
    
    const country = config.countries.find(c => c.countryCode === targetCountryCode && c.isActive);
    console.log('EnqIdGenerator: Found enquiry configuration:', country);
    
    if (!country) {
      console.error(`EnqIdGenerator: Enquiry configuration not found or inactive for country: ${targetCountryCode}`);
      console.log('Available configurations:', config.countries.map(c => ({ code: c.countryCode, active: c.isActive })));
      throw new Error(`Enquiry configuration not found or inactive for country: ${targetCountryCode}`);
    }

    // Get existing enquiries to determine next number
    const savedQueries = localStorage.getItem('travel_queries');
    let queries = [];
    
    if (savedQueries) {
      try {
        queries = JSON.parse(savedQueries);
      } catch (error) {
        console.error('Error parsing saved queries:', error);
        queries = [];
      }
    }

    // Build pattern to match existing IDs for this country
    const currentYear = new Date().getFullYear();
    let searchPattern = country.prefix;
    
    if (country.yearFormat === 'YYYY') {
      searchPattern += (country.yearSeparator === 'none' ? '' : country.yearSeparator) + currentYear.toString();
    } else if (country.yearFormat === 'YY') {
      searchPattern += (country.yearSeparator === 'none' ? '' : country.yearSeparator) + currentYear.toString().slice(-2);
    }
    
    // Find the highest existing number for this country and year
    let maxNumber = country.startingNumber - 1;
    
    queries.forEach((query: any) => {
      if (query.id && query.id.startsWith(searchPattern)) {
        const afterPrefix = query.id.substring(searchPattern.length);
        const numberPart = country.numberSeparator === 'none' ? 
          afterPrefix : 
          afterPrefix.substring(country.numberSeparator.length);
        
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // Generate next number (ensure it's at least the starting number)
    const nextNumber = Math.max(maxNumber + 1, country.startingNumber);
    
    return this.buildEnquiryId(country, nextNumber);
  }

  public static validateEnqId(id: string, countryCode?: string): boolean {
    const config = this.getApplicationSettings();
    
    // If no country specified, try to validate against all active countries
    const countriesToCheck = countryCode ? 
      config.countries.filter(c => c.countryCode === countryCode) :
      config.countries.filter(c => c.isActive);

    // Additional validation: ensure countries are active in Countries Management module
    const validCountries = countriesToCheck.filter(country => 
      this.validateCountryForEnquiry(country.countryCode)
    );

    return validCountries.some(country => {
      let pattern = country.prefix;
      
      if (country.yearFormat === 'YYYY') {
        pattern += country.yearSeparator === 'none' ? '\\d{4}' : `\\${country.yearSeparator}\\d{4}`;
      } else if (country.yearFormat === 'YY') {
        pattern += country.yearSeparator === 'none' ? '\\d{2}' : `\\${country.yearSeparator}\\d{2}`;
      }
      
      pattern += country.numberSeparator === 'none' ? `\\d{${country.numberLength}}` : `\\${country.numberSeparator}\\d{${country.numberLength}}`;
      
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(id);
    });
  }

  public static getCountryFromEnqId(id: string): CountryEnquirySettings | null {
    const config = this.getApplicationSettings();
    
    for (const country of config.countries) {
      if (this.validateEnqId(id, country.countryCode)) {
        return country;
      }
    }
    
    return null;
  }
}

