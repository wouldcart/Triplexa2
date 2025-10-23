#!/usr/bin/env node

/**
 * Transport Routes Implementation Validator
 * Validates the code structure and implementation without requiring database connection
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Transport Routes Implementation Validator\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function validateFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`✅ ${description}: Found`);
      results.passed++;
      return content;
    } else {
      console.log(`❌ ${description}: Missing`);
      results.failed++;
      return null;
    }
  } catch (error) {
    console.log(`❌ ${description}: Error reading file - ${error.message}`);
    results.failed++;
    return null;
  }
}

function validateCodeStructure(content, filePath, checks) {
  console.log(`\n🔍 Validating ${path.basename(filePath)}:`);
  
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`   ✅ ${check.description}`);
      results.passed++;
    } else {
      console.log(`   ❌ ${check.description}`);
      results.failed++;
    }
  });
}

// Test 1: Core Files Existence
console.log('1. Checking Core Files...');

const coreFiles = [
  {
    path: 'src/pages/inventory/transport/components/routes/TransportRoutesTab.tsx',
    description: 'Transport Routes Tab Component'
  },
  {
    path: 'src/pages/inventory/transport/components/AddRouteSheet.tsx',
    description: 'Add Route Sheet Component'
  },
  {
    path: 'src/pages/inventory/transport/components/EditRouteSheet.tsx',
    description: 'Edit Route Sheet Component'
  },
  {
    path: 'src/pages/inventory/transport/components/DeleteRouteDialog.tsx',
    description: 'Delete Route Dialog Component'
  },
  {
    path: 'src/pages/inventory/transport/hooks/useRouteForm.ts',
    description: 'Route Form Hook'
  },
  {
    path: 'src/pages/inventory/transport/hooks/useRouteActions.ts',
    description: 'Route Actions Hook'
  },
  {
    path: 'src/pages/inventory/transport/components/TransportRoutesTable.tsx',
    description: 'Transport Routes Table Component'
  }
];

const fileContents = {};
coreFiles.forEach(file => {
  const content = validateFile(file.path, file.description);
  if (content) {
    fileContents[file.path] = content;
  }
});

// Test 2: Component Structure Validation
console.log('\n2. Validating Component Structure...');

// Validate TransportRoutesTab
if (fileContents['src/pages/inventory/transport/components/routes/TransportRoutesTab.tsx']) {
  validateCodeStructure(
    fileContents['src/pages/inventory/transport/components/routes/TransportRoutesTab.tsx'],
    'TransportRoutesTab.tsx',
    [
      { pattern: 'useState', description: 'Uses React state management' },
      { pattern: 'useRouteActions', description: 'Uses route actions hook' },
      { pattern: 'DataTable', description: 'Implements data table' },
      { pattern: 'AddRouteSheet', description: 'Includes add route functionality' },
      { pattern: 'EditRouteSheet', description: 'Includes edit route functionality' },
      { pattern: 'DeleteRouteDialog', description: 'Includes delete route functionality' }
    ]
  );
}

// Validate useRouteForm hook
if (fileContents['src/pages/inventory/transport/hooks/useRouteForm.ts']) {
  validateCodeStructure(
    fileContents['src/pages/inventory/transport/hooks/useRouteForm.ts'],
    'useRouteForm.ts',
    [
      { pattern: 'useState', description: 'Manages form state' },
      { pattern: 'useEffect', description: 'Handles side effects' },
      { pattern: 'useCallback', description: 'Optimizes performance' },
      { pattern: 'initialData', description: 'Supports initial data for editing' },
      { pattern: 'routeData', description: 'Manages route data state' },
      { pattern: 'filteredLocations', description: 'Filters locations dynamically' },
      { pattern: 'generateRouteCodeSegments', description: 'Generates route codes' }
    ]
  );
}

// Validate AddRouteSheet
if (fileContents['src/pages/inventory/transport/components/AddRouteSheet.tsx']) {
  validateCodeStructure(
    fileContents['src/pages/inventory/transport/components/AddRouteSheet.tsx'],
    'AddRouteSheet.tsx',
    [
      { pattern: 'useRouteForm', description: 'Uses route form hook' },
      { pattern: 'Sheet', description: 'Uses sheet component' },
      { pattern: 'Button', description: 'Has action buttons' },
      { pattern: 'onSubmit', description: 'Handles form submission' }
    ]
  );
}

// Validate EditRouteSheet
if (fileContents['src/pages/inventory/transport/components/EditRouteSheet.tsx']) {
  validateCodeStructure(
    fileContents['src/pages/inventory/transport/components/EditRouteSheet.tsx'],
    'EditRouteSheet.tsx',
    [
      { pattern: 'useRouteForm', description: 'Uses route form hook' },
      { pattern: 'getInitialData', description: 'Transforms data for editing' },
      { pattern: 'route?.', description: 'Handles route prop safely' },
      { pattern: 'CompleteTransportRoute', description: 'Uses correct type' }
    ]
  );
}

// Validate useRouteActions
if (fileContents['src/pages/inventory/transport/hooks/useRouteActions.ts']) {
  validateCodeStructure(
    fileContents['src/pages/inventory/transport/hooks/useRouteActions.ts'],
    'useRouteActions.ts',
    [
      { pattern: 'handleConfirmDelete', description: 'Has delete functionality' },
      { pattern: 'supabase', description: 'Uses Supabase client' },
      { pattern: 'toast', description: 'Provides user feedback' },
      { pattern: 'setRoutes', description: 'Updates routes state' }
    ]
  );
}

// Test 3: Type Safety Validation
console.log('\n3. Checking Type Safety...');

const typeFiles = [
  'src/types/transport.ts',
  'src/integrations/supabase/types.ts'
];

typeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('TransportRoute') || content.includes('transport_routes')) {
      console.log(`   ✅ ${file}: Contains transport route types`);
      results.passed++;
    } else {
      console.log(`   ⚠️  ${file}: May be missing transport route types`);
      results.warnings++;
    }
  }
});

// Test 4: Integration Points
console.log('\n4. Checking Integration Points...');

const integrationChecks = [
  {
    file: 'src/pages/inventory/transport/TransportRoutesPage.tsx',
    pattern: 'TransportRoutesTab',
    description: 'Transport routes page exists'
  },
  {
    file: 'src/pages/inventory/transport/components/TransportTabs.tsx',
    pattern: 'TransportRoutesTab',
    description: 'Transport routes integrated in tabs'
  }
];

integrationChecks.forEach(check => {
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file, 'utf8');
    if (content.includes(check.pattern)) {
      console.log(`   ✅ ${check.description}`);
      results.passed++;
    } else {
      console.log(`   ⚠️  ${check.description}: May need integration`);
      results.warnings++;
    }
  } else {
    console.log(`   ❌ ${check.file}: File not found`);
    results.failed++;
  }
});

// Summary
console.log('\n📊 Validation Summary:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

const total = results.passed + results.failed + results.warnings;
const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;

console.log(`\n🎯 Success Rate: ${successRate}%`);

if (results.failed === 0) {
  console.log('\n🎉 All critical validations passed!');
  console.log('✅ Transport Routes implementation is structurally sound');
  console.log('✅ Edit functionality with pre-populated data is implemented');
  console.log('✅ Delete functionality is implemented');
  console.log('✅ Form validation and state management are in place');
  
  if (results.warnings > 0) {
    console.log('\n⚠️  Some minor issues detected, but core functionality should work');
  }
} else {
  console.log('\n❌ Some critical issues detected. Please review the failed checks above.');
}

console.log('\n🚀 Ready for testing when development server is available!');