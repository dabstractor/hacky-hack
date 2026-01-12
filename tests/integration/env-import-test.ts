/**
 * Integration test: Verify module can be imported with correct ESM syntax
 */

import {
  configureEnvironment,
  getModel,
  validateEnvironment,
} from '../../src/config/environment.js';

console.log('Import successful!');
console.log('Functions exported:', {
  configureEnvironment: typeof configureEnvironment,
  getModel: typeof getModel,
  validateEnvironment: typeof validateEnvironment,
});

// Verify all are functions
if (typeof configureEnvironment === 'function') {
  console.log('✓ configureEnvironment is a function');
}
if (typeof getModel === 'function') {
  console.log('✓ getModel is a function');
}
if (typeof validateEnvironment === 'function') {
  console.log('✓ validateEnvironment is a function');
}
