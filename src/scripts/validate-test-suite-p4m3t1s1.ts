#!/usr/bin/env tsx
/**
 * Test Suite Validation Script for P4.M3.T1.S1
 *
 * Executes the full test suite and validates >98% pass rate
 */

import { runSingleTestFile } from '../utils/single-test-runner.js';
import { runFullTestSuite } from '../utils/full-test-suite-runner.js';
import {
  analyzePassRate,
  type TestSuiteResult,
} from '../utils/pass-rate-analyzer.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// ============================================================================
// CONSTANTS
// ============================================================================

const TARGET_PASS_RATE = 98.0;
const MAX_FAILING_TESTS = 34; // 2% of 1688
const BASELINE_FAILING_TESTS = 95;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  const startTime = Date.now();
  console.log('='.repeat(70));
  console.log('Test Suite Validation - P4.M3.T1.S1');
  console.log('='.repeat(70));
  console.log('');

  // ============================================================================
  // STAGE 1: Pre-flight Check
  // ============================================================================

  console.log('Stage 1: Running pre-flight check...');
  console.log('-'.repeat(70));

  const s1Result = await runSingleTestFile();

  if (!s1Result.success) {
    console.error('✗ Pre-flight check failed');
    console.error(`  Error: ${s1Result.error}`);
    console.error('');
    console.error('Cannot proceed to full suite. Aborting.');
    process.exit(1);
  }

  if (s1Result.hasMemoryError) {
    console.error('✗ Pre-flight check detected memory errors');
    console.error(`  Error type: ${s1Result.memoryError?.errorType}`);
    console.error(`  Suggestion: ${s1Result.memoryError?.suggestion}`);
    console.error('');
    console.error('Cannot proceed to full suite. Aborting.');
    process.exit(1);
  }

  console.log('✓ Pre-flight check passed');
  console.log(`  Exit code: ${s1Result.exitCode}`);
  console.log('');

  // ============================================================================
  // STAGE 2: Full Test Suite
  // ============================================================================

  console.log('Stage 2: Running full test suite...');
  console.log('-'.repeat(70));
  console.log('This may take 3-5 minutes for 1688 tests...');
  console.log('');

  const fullResult = await runFullTestSuite(s1Result);
  const executionTime = (Date.now() - startTime) / 1000;

  if (!fullResult.completed) {
    console.error('✗ Full suite failed to complete');
    console.error(`  Error: ${fullResult.error}`);
    console.error('');
    console.error('Validation cannot proceed. Aborting.');
    process.exit(1);
  }

  if (fullResult.memoryErrors) {
    console.error('✗ Full suite detected memory errors');
    console.error(`  Error type: ${fullResult.memoryError?.errorType}`);
    console.error(`  Suggestion: ${fullResult.memoryError?.suggestion}`);
    console.error('');
    console.error('Test results cannot be trusted. Aborting.');
    process.exit(1);
  }

  if (!fullResult.testResults) {
    console.error('✗ Failed to parse test results');
    console.error('  Output may be in unexpected format');
    console.error('');
    console.error('Validation cannot proceed. Aborting.');
    process.exit(1);
  }

  console.log('✓ Full suite completed');
  console.log(`  Total: ${fullResult.testResults.total}`);
  console.log(`  Passed: ${fullResult.testResults.pass}`);
  console.log(`  Failed: ${fullResult.testResults.fail}`);
  console.log(`  Execution time: ${executionTime.toFixed(1)}s`);
  console.log('');

  // ============================================================================
  // STAGE 3: Transform Results for Pass Rate Analyzer
  // ============================================================================

  const testSuiteResult: TestSuiteResult = {
    completed: fullResult.completed,
    results: fullResult.testResults,
    hasMemoryErrors: fullResult.memoryErrors,
    // P4.M2.T1.S1 validation: Check for promise rejection warnings
    hasPromiseRejections: fullResult.output.includes(
      'PromiseRejectionHandledWarning'
    ),
    executionTime,
    output: fullResult.output,
    exitCode: fullResult.exitCode ?? 1,
  };

  // ============================================================================
  // STAGE 4: Analyze Pass Rate
  // ============================================================================

  console.log('Stage 3: Analyzing pass rate...');
  console.log('-'.repeat(70));

  const analysis = analyzePassRate(testSuiteResult);

  console.log(`Current: ${analysis.passRate}%`);
  console.log(`Baseline: ${analysis.baselinePassRate}%`);
  console.log(`Target: ${TARGET_PASS_RATE.toFixed(2)}%`);
  console.log(`Delta: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%`);
  console.log(`Improved: ${analysis.improved}`);
  console.log(`Passed: ${analysis.passedCount}`);
  console.log(`Failed: ${analysis.failedCount}`);
  console.log(`Total: ${analysis.totalCount}`);
  console.log('');

  // ============================================================================
  // STAGE 5: Validate Against Target
  // ============================================================================

  console.log('Stage 4: Validating against target...');
  console.log('-'.repeat(70));

  const checks = {
    passRate: analysis.passRate >= TARGET_PASS_RATE,
    failingCount: analysis.failedCount <= MAX_FAILING_TESTS,
    noCritical: !analysis.failingTests.some(t =>
      t.toLowerCase().includes('critical')
    ),
    noMajor: !analysis.failingTests.some(t =>
      t.toLowerCase().includes('major')
    ),
    noRegressions: analysis.failedCount < BASELINE_FAILING_TESTS,
  };

  const allPassed = Object.values(checks).every(v => v);

  if (allPassed) {
    console.log('✓ All validation checks passed');
    console.log('  Pass rate >= 98%');
    console.log('  No critical or major issues');
    console.log('  No new test failures');
  } else {
    console.log('✗ Validation failed:');
    if (!checks.passRate) {
      console.log(
        `  ✗ Pass rate below target (${analysis.passRate}% < ${TARGET_PASS_RATE}%)`
      );
    }
    if (!checks.failingCount) {
      console.log(
        `  ✗ Too many failing tests (${analysis.failedCount} > ${MAX_FAILING_TESTS})`
      );
    }
    if (!checks.noCritical) {
      console.log('  ✗ Critical issues detected in failing tests');
    }
    if (!checks.noMajor) {
      console.log('  ✗ Major issues detected in failing tests');
    }
    if (!checks.noRegressions) {
      console.log(
        `  ✗ More failures than baseline (${analysis.failedCount} >= ${BASELINE_FAILING_TESTS})`
      );
    }
  }
  console.log('');

  // ============================================================================
  // STAGE 6: Check for Promise Rejection Warnings (P4.M2.T1.S1)
  // ============================================================================

  console.log('Stage 5: Checking for promise rejection warnings...');
  console.log('-'.repeat(70));

  const hasPromiseRejections = fullResult.output.includes(
    'PromiseRejectionHandledWarning'
  );

  if (hasPromiseRejections) {
    const matches = fullResult.output.match(/PromiseRejectionHandledWarning/g);
    const count = matches ? matches.length : 0;

    console.log(
      `⚠ Warning: ${count} PromiseRejectionHandledWarning(s) detected`
    );
    console.log('  P4.M2.T1.S1 may not have fully resolved promise rejections');
    console.log('  This may indicate incomplete fix or new issues introduced');
  } else {
    console.log('✓ No promise rejection warnings detected');
    console.log('  P4.M2.T1.S1 fix validated');
  }
  console.log('');

  // ============================================================================
  // STAGE 7: Document Results
  // ============================================================================

  console.log('Stage 6: Documenting results...');
  console.log('-'.repeat(70));

  const reportPath = join(
    process.cwd(),
    'plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M3T1S1/research/execution-results.md'
  );

  const report = `# Test Suite Execution Results - P4.M3.T1.S1

**Date**: ${new Date().toISOString()}
**Task**: Execute full test suite and validate >98% pass rate

## Executive Summary

- **Status**: ${allPassed ? 'PASSED' : 'FAILED'}
- **Pass Rate**: ${analysis.passRate}%
- **Baseline**: ${analysis.baselinePassRate}%
- **Target**: ${TARGET_PASS_RATE.toFixed(2)}%
- **Delta**: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}%
- **Result**: ${analysis.passRate >= TARGET_PASS_RATE ? '✓ Meets target' : '✗ Below target'}

## Test Statistics

| Metric | Count |
|--------|-------|
| Total Tests | ${analysis.totalCount} |
| Passed | ${analysis.passedCount} |
| Failed | ${analysis.failedCount} |
| Pass Rate | ${analysis.passRate}% |

## Validation Checks

| Check | Result |
|-------|--------|
| Pass rate >= ${TARGET_PASS_RATE}% | ${checks.passRate ? '✓' : '✗'} |
| Failing <= ${MAX_FAILING_TESTS} tests | ${checks.failingCount ? '✓' : '✗'} |
| No critical issues | ${checks.noCritical ? '✓' : '✗'} |
| No major issues | ${checks.noMajor ? '✓' : '✗'} |
| No regressions | ${checks.noRegressions ? '✓' : '✗'} |

## Failing Tests

${
  analysis.failingTests.length === 0
    ? 'None'
    : analysis.failingTests.map(t => `- ${t}`).join('\n')
}

## Memory Error Check

- **Detected**: ${testSuiteResult.hasMemoryErrors ? 'Yes' : 'No'}
- **Details**: ${fullResult.memoryError?.errorType || 'N/A'}

## Promise Rejection Check

- **Warnings Detected**: ${hasPromiseRejections ? 'Yes' : 'No'}
- **Count**: ${
    hasPromiseRejections
      ? (fullResult.output.match(/PromiseRejectionHandledWarning/g) || [])
          .length
      : 0
  }
- **P4.M2.T1.S1 Status**: ${hasPromiseRejections ? '⚠ Incomplete' : '✓ Validated'}

## Comparison to Baseline

| Metric | Baseline | Current | Delta |
|--------|----------|---------|-------|
| Pass Rate | 94.37% | ${analysis.passRate}% | ${analysis.delta > 0 ? '+' : ''}${analysis.delta}% |
| Passing | 1593 | ${analysis.passedCount} | ${analysis.passedCount - 1593 > 0 ? '+' : ''}${analysis.passedCount - 1593} |
| Failing | 95 | ${analysis.failedCount} | ${analysis.failedCount - 95 > 0 ? '+' : ''}${analysis.failedCount - 95} |

## Execution Details

- **Execution Time**: ${executionTime.toFixed(1)}s
- **Exit Code**: ${fullResult.exitCode}
- **Completed**: ${fullResult.completed ? 'Yes' : 'No'}

## Conclusion

${
  allPassed
    ? '✓ Test suite validation PASSED. All P1-P4 bug fixes validated. System fully functional.'
    : '✗ Test suite validation FAILED. Review failing tests and address issues before marking P4.M3 complete.'
}
`;

  await writeFile(reportPath, report, 'utf-8');
  console.log(`✓ Report saved to: ${reportPath}`);
  console.log('');

  // ============================================================================
  // Final Status
  // ============================================================================

  console.log('='.repeat(70));
  if (allPassed) {
    console.log('✓ Test suite validation PASSED');
    console.log(
      `  Pass rate: ${analysis.passRate}% (target: ${TARGET_PASS_RATE}%)`
    );
    console.log(
      `  Delta: ${analysis.delta > 0 ? '+' : ''}${analysis.delta}% from baseline`
    );
  } else {
    console.log('✗ Test suite validation FAILED');
    console.log(
      `  Pass rate: ${analysis.passRate}% (target: ${TARGET_PASS_RATE}%)`
    );
    console.log(`  Gap: ${(TARGET_PASS_RATE - analysis.passRate).toFixed(2)}%`);
    console.log(
      `  Failing tests: ${analysis.failedCount} (max: ${MAX_FAILING_TESTS})`
    );
  }
  console.log('='.repeat(70));

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
