// Debug script for "Couldn't find a style target" error
console.log('=== Style Target Error Diagnostic ===');

// Check for common causes of this error:

// 1. Check if document.head exists
console.log('1. Document head exists:', !!document.head);

// 2. Check for style elements
const styleElements = document.querySelectorAll('style');
console.log('2. Number of style elements:', styleElements.length);

// 3. Check for CSS-in-JS libraries
const possibleLibraries = [
  'styled-components',
  'emotion',
  '@emotion/react',
  'jss',
  'aphrodite'
];

possibleLibraries.forEach(lib => {
  try {
    const module = require(lib);
    console.log(`3. Found ${lib}:`, !!module);
  } catch (e) {
    console.log(`3. ${lib}: Not found`);
  }
});

// 4. Check for dynamic style insertion
console.log('4. Can insert style:', (() => {
  try {
    const style = document.createElement('style');
    document.head.appendChild(style);
    style.textContent = '/* test */';
    document.head.removeChild(style);
    return true;
  } catch (e) {
    console.log('Style insertion error:', e.message);
    return false;
  }
})());

// 5. Check for browser extensions that might interfere
console.log('5. User agent:', navigator.userAgent);

// 6. Check for any error listeners
console.log('6. Window error handlers:', window.onerror ? 'Present' : 'None');

// 7. Check for React DevTools or other extensions
console.log('7. React DevTools:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

console.log('=== End Diagnostic ===');