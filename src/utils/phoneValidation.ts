/**
 * Phone number validation and formatting utilities
 */

/**
 * Validate phone number format (E.164 international format)
 * @param phone - Phone number to validate
 * @returns boolean indicating if phone is valid
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Must start with + followed by 1-15 digits
  const e164Regex = /^\+\d{1,15}$/;
  
  return e164Regex.test(cleanPhone);
}

/**
 * Format phone number to E.164 international format
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume it's a local number and add +
  if (!cleanPhone.startsWith('+')) {
    // If it starts with 0, remove the 0 and add country code (assuming US/Canada for now)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+1' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10) {
      // Assume US/Canada number if 10 digits
      cleanPhone = '+1' + cleanPhone;
    } else {
      // Otherwise just add +
      cleanPhone = '+' + cleanPhone;
    }
  }
  
  return cleanPhone;
}

/**
 * Mask phone number for display (show only last 4 digits)
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export function maskPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  if (cleanPhone.length <= 4) {
    return cleanPhone;
  }
  
  const lastFour = cleanPhone.slice(-4);
  const masked = cleanPhone.slice(0, -4).replace(/\d/g, '*');
  
  return masked + lastFour;
}

/**
 * Extract country code from phone number
 * @param phone - Phone number in E.164 format
 * @returns Country code or null if invalid
 */
export function getCountryCode(phone: string): string | null {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  if (!cleanPhone.startsWith('+')) {
    return null;
  }
  
  // Remove + and get the country code (1-3 digits)
  const digitsOnly = cleanPhone.substring(1);
  
  // Common country codes
  const countryCodes = [
    '1',    // US, Canada
    '7',    // Russia, Kazakhstan
    '20',   // Egypt
    '27',   // South Africa
    '30',   // Greece
    '31',   // Netherlands
    '32',   // Belgium
    '33',   // France
    '34',   // Spain
    '36',   // Hungary
    '39',   // Italy
    '40',   // Romania
    '41',   // Switzerland
    '43',   // Austria
    '44',   // UK
    '45',   // Denmark
    '46',   // Sweden
    '47',   // Norway
    '48',   // Poland
    '49',   // Germany
    '51',   // Peru
    '52',   // Mexico
    '53',   // Cuba
    '54',   // Argentina
    '55',   // Brazil
    '56',   // Chile
    '57',   // Colombia
    '58',   // Venezuela
    '60',   // Malaysia
    '61',   // Australia
    '62',   // Indonesia
    '63',   // Philippines
    '64',   // New Zealand
    '65',   // Singapore
    '66',   // Thailand
    '81',   // Japan
    '82',   // South Korea
    '84',   // Vietnam
    '86',   // China
    '90',   // Turkey
    '91',   // India
    '92',   // Pakistan
    '93',   // Afghanistan
    '94',   // Sri Lanka
    '95',   // Myanmar
    '98',   // Iran
    '212',  // Morocco
    '213',  // Algeria
    '216',  // Tunisia
    '218',  // Libya
    '220',  // Gambia
    '221',  // Senegal
    '222',  // Mauritania
    '223',  // Mali
    '224',  // Guinea
    '225',  // Ivory Coast
    '226',  // Burkina Faso
    '227',  // Niger
    '228',  // Togo
    '229',  // Benin
    '230',  // Mauritius
    '231',  // Liberia
    '232',  // Sierra Leone
    '233',  // Ghana
    '234',  // Nigeria
    '235',  // Chad
    '236',  // Central African Republic
    '237',  // Cameroon
    '238',  // Cape Verde
    '239',  // Sao Tome and Principe
    '240',  // Equatorial Guinea
    '241',  // Gabon
    '242',  // Congo
    '243',  // Democratic Republic of Congo
    '244',  // Angola
    '245',  // Guinea-Bissau
    '246',  // Diego Garcia
    '248',  // Seychelles
    '249',  // Sudan
    '250',  // Rwanda
    '251',  // Ethiopia
    '252',  // Somalia
    '253',  // Djibouti
    '254',  // Kenya
    '255',  // Tanzania
    '256',  // Uganda
    '257',  // Burundi
    '258',  // Mozambique
    '260',  // Zambia
    '261',  // Madagascar
    '262',  // Reunion
    '263',  // Zimbabwe
    '264',  // Namibia
    '265',  // Malawi
    '266',  // Lesotho
    '267',  // Botswana
    '268',  // Swaziland
    '269',  // Comoros
    '290',  // Saint Helena
    '291',  // Eritrea
    '297',  // Aruba
    '298',  // Faroe Islands
    '299',  // Greenland
    '350',  // Gibraltar
    '351',  // Portugal
    '352',  // Luxembourg
    '353',  // Ireland
    '354',  // Iceland
    '355',  // Albania
    '356',  // Malta
    '357',  // Cyprus
    '358',  // Finland
    '359',  // Bulgaria
    '370',  // Lithuania
    '371',  // Latvia
    '372',  // Estonia
    '373',  // Moldova
    '374',  // Armenia
    '375',  // Belarus
    '376',  // Andorra
    '377',  // Monaco
    '378',  // San Marino
    '380',  // Ukraine
    '381',  // Serbia
    '382',  // Montenegro
    '383',  // Kosovo
    '385',  // Croatia
    '386',  // Slovenia
    '387',  // Bosnia and Herzegovina
    '389',  // Macedonia
    '420',  // Czech Republic
    '421',  // Slovakia
    '423',  // Liechtenstein
    '500',  // Falkland Islands
    '501',  // Belize
    '502',  // Guatemala
    '503',  // El Salvador
    '504',  // Honduras
    '505',  // Nicaragua
    '506',  // Costa Rica
    '507',  // Panama
    '508',  // Saint Pierre and Miquelon
    '509',  // Haiti
    '590',  // Guadeloupe
    '591',  // Bolivia
    '592',  // Guyana
    '593',  // Ecuador
    '594',  // French Guiana
    '595',  // Paraguay
    '596',  // Martinique
    '597',  // Suriname
    '598',  // Uruguay
    '599',  // Netherlands Antilles
    '670',  // East Timor
    '672',  // Norfolk Island
    '673',  // Brunei
    '674',  // Nauru
    '675',  // Papua New Guinea
    '676',  // Tonga
    '677',  // Solomon Islands
    '678',  // Vanuatu
    '679',  // Fiji
    '680',  // Palau
    '681',  // Wallis and Futuna
    '682',  // Cook Islands
    '683',  // Niue
    '684',  // Samoa
    '685',  // Western Samoa
    '686',  // Kiribati
    '687',  // New Caledonia
    '688',  // Tuvalu
    '689',  // French Polynesia
    '690',  // Tokelau
    '691',  // Micronesia
    '692',  // Marshall Islands
    '800',  // International Freephone
    '808',  // International Shared Cost
    '850',  // North Korea
    '852',  // Hong Kong
    '853',  // Macau
    '855',  // Cambodia
    '856',  // Laos
    '870',  // Inmarsat
    '878',  // Universal Personal Telecommunications
    '880',  // Bangladesh
    '881',  // Global Mobile Satellite
    '882',  // International Networks
    '883',  // International Networks
    '886',  // Taiwan
    '960',  // Maldives
    '961',  // Lebanon
    '962',  // Jordan
    '963',  // Syria
    '964',  // Iraq
    '965',  // Kuwait
    '966',  // Saudi Arabia
    '967',  // Yemen
    '968',  // Oman
    '970',  // Palestine
    '971',  // UAE
    '972',  // Israel
    '973',  // Bahrain
    '974',  // Qatar
    '975',  // Bhutan
    '976',  // Mongolia
    '977',  // Nepal
    '979',  // International Premium Rate
    '992',  // Tajikistan
    '993',  // Turkmenistan
    '994',  // Azerbaijan
    '995',  // Georgia
    '996',  // Kyrgyzstan
    '998'   // Uzbekistan
  ];
  
  // Find the longest matching country code
  for (const code of countryCodes) {
    if (digitsOnly.startsWith(code)) {
      return code;
    }
  }
  
  return null;
}