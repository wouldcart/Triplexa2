import { seedCountries } from './src/scripts/seedCountries.ts';

async function runSeed() {
  console.log('Running countries seed script...');
  
  try {
    const result = await seedCountries();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('📊 Data:', result.data?.length || 0, 'countries');
    } else {
      console.error('❌ Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  process.exit(0);
}

runSeed();