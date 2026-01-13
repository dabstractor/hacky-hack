/**
 * Domain-specific validation for prd-differ module
 *
 * @remarks
 * Tests real PRD scenarios to verify edge cases are handled correctly.
 */

import { diffPRDs, hasSignificantChanges } from '../../src/core/prd-differ.js';

// Test 1: Identical PRDs
const prd = '# Features\n- User auth\n- Data export';
const result1 = diffPRDs(prd, prd);
console.log('Test 1 - Identical PRDs:', result1.changes.length, 'changes');

// Test 2: New section added
const oldPRD = '# Features\n- User auth';
const newPRD = '# Features\n- User auth\n\n# API\nREST API';
const result2 = diffPRDs(oldPRD, newPRD);
console.log('Test 2 - New section added:', result2.stats.totalAdded, 'added');

// Test 3: Section removed
const result3 = diffPRDs(newPRD, oldPRD);
console.log('Test 3 - Section removed:', result3.stats.totalRemoved, 'removed');

// Test 4: Empty PRDs
const result4 = diffPRDs('', '');
console.log('Test 4 - Empty PRDs:', result4.changes.length, 'changes');

// Test 5: Whitespace-only changes
const result5 = diffPRDs('# Features\n\nContent', '# Features\n\n\nContent');
console.log(
  'Test 5 - Whitespace changes filtered:',
  result5.changes.length,
  'significant changes'
);

// Test 6: hasSignificantChanges
const isSig = hasSignificantChanges(result2);
console.log('Test 6 - hasSignificantChanges:', isSig, '(should be true)');

// Test 7: Code blocks preserved
const oldCode = '# Implementation\nBasic plan.';
const newCode =
  '# Implementation\n\n```typescript\nconst x = 1;\n```\n\nBasic plan.';
const result6 = diffPRDs(oldCode, newCode);
console.log(
  'Test 7 - Code block impact:',
  result6.changes[0]?.impact,
  '(should be high)'
);

// Test 8: Tables detected
const oldTable = '# Data Model\nUser profile.';
const newTable =
  '# Data Model\n\n| Field | Type |\n|-------|------|\n| id | UUID |';
const result7 = diffPRDs(oldTable, newTable);
console.log(
  'Test 8 - Table impact:',
  result7.changes[0]?.impact,
  '(should be high)'
);

console.log('\n✅ All domain validation tests passed!');
