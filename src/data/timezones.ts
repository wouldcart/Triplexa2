export interface TimezoneOption {
  value: string;
  label: string; // Human-friendly name
  abbreviation: string;
  offset: string; // e.g., UTC+05:30
  cities: string[];
}

// Curated list covering commonly used timezones, aligned to IANA identifiers.
// Includes aliases like Asia/Calcutta for compatibility.
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'Coordinated Universal Time', abbreviation: 'UTC', offset: '±00:00', cities: ['London (winter)', 'Reykjavik'] },
  { value: 'Europe/London', label: 'Greenwich Mean Time', abbreviation: 'GMT', offset: '±00:00', cities: ['London', 'Accra', 'Lisbon'] },
  { value: 'Europe/Paris', label: 'Central European Time', abbreviation: 'CET', offset: 'UTC+01:00', cities: ['Paris', 'Berlin', 'Rome'] },
  { value: 'Europe/Athens', label: 'Eastern European Time', abbreviation: 'EET', offset: 'UTC+02:00', cities: ['Athens', 'Helsinki', 'Cairo'] },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time', abbreviation: 'MSK', offset: 'UTC+03:00', cities: ['Moscow', 'Istanbul', 'Nairobi'] },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time', abbreviation: 'GST', offset: 'UTC+04:00', cities: ['Dubai', 'Abu Dhabi'] },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time', abbreviation: 'PKT', offset: 'UTC+05:00', cities: ['Karachi', 'Islamabad'] },
  { value: 'Asia/Kolkata', label: 'India Standard Time', abbreviation: 'IST', offset: 'UTC+05:30', cities: ['New Delhi', 'Mumbai'] },
  { value: 'Asia/Calcutta', label: 'India Standard Time (alias)', abbreviation: 'IST', offset: 'UTC+05:30', cities: ['Kolkata'] },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time', abbreviation: 'BST', offset: 'UTC+06:00', cities: ['Dhaka'] },
  { value: 'Asia/Bangkok', label: 'Indochina Time', abbreviation: 'ICT', offset: 'UTC+07:00', cities: ['Bangkok', 'Hanoi', 'Jakarta'] },
  { value: 'Asia/Shanghai', label: 'China Standard Time', abbreviation: 'CST', offset: 'UTC+08:00', cities: ['Beijing', 'Singapore', 'Kuala Lumpur'] },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time', abbreviation: 'JST', offset: 'UTC+09:00', cities: ['Tokyo', 'Seoul'] },
  { value: 'Australia/Sydney', label: 'Australian Eastern Standard Time', abbreviation: 'AEST', offset: 'UTC+10:00', cities: ['Sydney', 'Brisbane'] },
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time', abbreviation: 'NZST', offset: 'UTC+12:00', cities: ['Auckland', 'Wellington'] },
  { value: 'America/Puerto_Rico', label: 'Atlantic Standard Time', abbreviation: 'AST', offset: 'UTC−04:00', cities: ['Puerto Rico', 'Halifax'] },
  { value: 'America/New_York', label: 'Eastern Standard Time', abbreviation: 'EST', offset: 'UTC−05:00', cities: ['New York', 'Toronto', 'Miami'] },
  { value: 'America/Chicago', label: 'Central Standard Time', abbreviation: 'CST', offset: 'UTC−06:00', cities: ['Chicago', 'Mexico City'] },
  { value: 'America/Denver', label: 'Mountain Standard Time', abbreviation: 'MST', offset: 'UTC−07:00', cities: ['Denver', 'Phoenix'] },
  { value: 'America/Los_Angeles', label: 'Pacific Standard Time', abbreviation: 'PST', offset: 'UTC−08:00', cities: ['Los Angeles', 'Vancouver'] },
  { value: 'America/Anchorage', label: 'Alaska Standard Time', abbreviation: 'AKST', offset: 'UTC−09:00', cities: ['Anchorage'] },
  { value: 'Pacific/Honolulu', label: 'Hawaii–Aleutian Standard Time', abbreviation: 'HST', offset: 'UTC−10:00', cities: ['Honolulu'] },
];

export function formatTimezoneDisplay(opt: TimezoneOption): string {
  const cities = opt.cities.join(', ');
  return `${opt.label} (${opt.abbreviation}, ${opt.offset}) — ${cities}`;
}