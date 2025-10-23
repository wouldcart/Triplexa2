#!/usr/bin/env node

/**
 * Script to update all flag URLs in the Supabase countries table
 * This script will generate flag URLs for all countries based on their country codes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generates a flag URL from flagcdn.com based on country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'IN')
 * @param {string} size - Flag size: 'w20', 'w40', 'w80', 'w160', 'w320', 'w640', 'w1280'
 * @returns {string} Flag URL from flagcdn.com
 */
function generateFlagUrl(countryCode, size = 'w40') {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }
  
  // Convert to lowercase as required by flagcdn.com
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/${size}/${code}.png`;
}

/**
 * Fetches all countries from the database
 */
async function fetchAllCountries() {
  console.log('📥 Fetching all countries from database...');
  
  const { data: countries, error } = await supabase
    .from('countries')
    .select('id, name, code, flag_url')
    .order('name');

  if (error) {
    console.error('❌ Error fetching countries:', error);
    throw error;
  }

  console.log(`✅ Found ${countries.length} countries in database`);
  return countries;
}

/**
 * Updates flag URLs for countries
 */
async function updateFlagUrls() {
  try {
    const countries = await fetchAllCountries();
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('\n🔄 Processing countries...\n');
    
    for (const country of countries) {
      try {
        // Skip if no country code
        if (!country.code || country.code.trim() === '') {
          console.log(`⚠️  Skipping ${country.name}: No country code`);
          skippedCount++;
          continue;
        }
        
        // Generate flag URL
        const newFlagUrl = generateFlagUrl(country.code.trim());
        
        if (!newFlagUrl) {
          console.log(`⚠️  Skipping ${country.name}: Invalid country code "${country.code}"`);
          skippedCount++;
          continue;
        }
        
        // Check if flag URL needs updating
        const currentFlagUrl = country.flag_url;
        if (currentFlagUrl === newFlagUrl) {
          console.log(`✅ ${country.name} (${country.code}): Already has correct flag URL`);
          skippedCount++;
          continue;
        }
        
        // Update the flag URL in database
        const { error: updateError } = await supabase
          .from('countries')
          .update({ flag_url: newFlagUrl })
          .eq('id', country.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${country.name}:`, updateError);
          errorCount++;
          continue;
        }
        
        console.log(`🔄 Updated ${country.name} (${country.code}): ${newFlagUrl}`);
        updatedCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ${country.name}:`, error);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} countries`);
    console.log(`⚠️  Skipped: ${skippedCount} countries`);
    console.log(`❌ Errors: ${errorCount} countries`);
    console.log(`📝 Total: ${countries.length} countries processed`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Flag URL update completed successfully!');
    } else {
      console.log('\n✨ All countries already have correct flag URLs!');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

/**
 * Verifies the updates by checking a few random countries
 */
async function verifyUpdates() {
  console.log('\n🔍 Verifying updates...');
  
  try {
    const { data: sampleCountries, error } = await supabase
      .from('countries')
      .select('name, code, flag_url')
      .not('code', 'is', null)
      .not('code', 'eq', '')
      .limit(5);
    
    if (error) {
      console.error('❌ Error verifying updates:', error);
      return;
    }
    
    console.log('\n📋 Sample of updated countries:');
    sampleCountries.forEach(country => {
      const expectedUrl = generateFlagUrl(country.code);
      const isCorrect = country.flag_url === expectedUrl;
      console.log(`${isCorrect ? '✅' : '❌'} ${country.name} (${country.code}): ${country.flag_url}`);
    });
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Flag URL Update Script');
  console.log('=====================================\n');
  
  await updateFlagUrls();
  await verifyUpdates();
  
  console.log('\n✨ Script completed!');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed with error:', error);
  process.exit(1);
});