// Enable Nominatim geocoding in localStorage
const setting = {
  category: 'Integrations',
  setting_key: 'nominatim_geocoding_enabled',
  setting_value: 'true',
  description: 'Toggle to enable Nominatim geocoding features'
};

// Store in localStorage
localStorage.setItem('app_setting_Integrations_nominatim_geocoding_enabled', JSON.stringify(setting));

console.log('✅ Nominatim geocoding enabled in localStorage');
console.log('Setting stored:', setting);
