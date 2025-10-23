#!/usr/bin/env node

/**
 * Script to verify flag URL updates in the Supabase countries table
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generates expected flag URL for comparison
 */
function generateFlagUrl(countryCode, size = 'w40') {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/${size}/${code}.png`;
}

async function verifyFlagUrls() {
  try {
    console.log('🔍 Verifying flag URLs in database...\n');
    
    // Fetch all countries with their flag URLs
    const { data: countries, error } = await supabase
      .from('countries')
      .select('id, name, code, flag_url')
      .order('name');

    if (error) {
      console.error('❌ Error fetching countries:', error);
      return;
    }

    let correctCount = 0;
    let missingCount = 0;
    let incorrectCount = 0;
    let noCodeCount = 0;

    console.log('📊 Flag URL Verification Results:\n');

    countries.forEach(country => {
      if (!country.code || country.code.trim() === '') {
        console.log(`⚠️  ${country.name}: No country code`);
        noCodeCount++;
        return;
      }

      const expectedUrl = generateFlagUrl(country.code.trim());
      const actualUrl = country.flag_url;

      if (!actualUrl) {
        console.log(`❌ ${country.name} (${country.code}): Missing flag URL`);
        missingCount++;
      } else if (actualUrl === expectedUrl) {
        console.log(`✅ ${country.name} (${country.code}): Correct flag URL`);
        correctCount++;
      } else {
        console.log(`⚠️  ${country.name} (${country.code}): Incorrect flag URL`);
        console.log(`   Expected: ${expectedUrl}`);
        console.log(`   Actual:   ${actualUrl}`);
        incorrectCount++;
      }
    });

    // Summary
    console.log('\n📈 Verification Summary:');
    console.log(`✅ Correct flag URLs: ${correctCount}`);
    console.log(`❌ Missing flag URLs: ${missingCount}`);
    console.log(`⚠️  Incorrect flag URLs: ${incorrectCount}`);
    console.log(`⚠️  No country code: ${noCodeCount}`);
    console.log(`📝 Total countries: ${countries.length}`);

    const successRate = ((correctCount / (countries.length - noCodeCount)) * 100).toFixed(1);
    console.log(`🎯 Success rate: ${successRate}%`);

    if (correctCount === countries.length - noCodeCount) {
      console.log('\n🎉 All countries with valid codes have correct flag URLs!');
    } else if (missingCount > 0 || incorrectCount > 0) {
      console.log('\n⚠️  Some countries need flag URL updates.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyFlagUrls();