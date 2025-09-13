#!/usr/bin/env node

/**
 * Check if test results meet the minimum pass threshold (95%)
 * Reads from JSON test results and exits with appropriate code
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_THRESHOLD = 95; // 95% pass rate
const RESULTS_FILE = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || path.join(__dirname, '../../tmp/test-results.json');

function main() {
  const threshold = parseFloat(process.env.PLAYWRIGHT_PASS_THRESHOLD || DEFAULT_THRESHOLD);
  
  console.log(`📊 Checking test pass threshold: ${threshold}%`);
  
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error(`❌ Test results file not found: ${RESULTS_FILE}`);
    process.exit(1);
  }
  
  let results;
  try {
    const rawData = fs.readFileSync(RESULTS_FILE, 'utf8');
    results = JSON.parse(rawData);
  } catch (error) {
    console.error(`❌ Failed to parse test results: ${error.message}`);
    process.exit(1);
  }
  
  const stats = results.stats || {};
  const total = stats.expected || 0;
  const passed = stats.passed || 0;
  const failed = stats.failed || 0;
  const flaky = stats.flaky || 0;
  const skipped = stats.skipped || 0;
  
  if (total === 0) {
    console.error('❌ No tests found in results');
    process.exit(1);
  }
  
  const passRate = (passed / total) * 100;
  
  console.log('\n📈 Test Results Summary:');
  console.log(`  Total tests: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Flaky: ${flaky}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Pass rate: ${passRate.toFixed(1)}%`);
  console.log(`  Threshold: ${threshold}%`);
  
  if (passRate >= threshold) {
    console.log(`\n✅ PASS: Test suite meets ${threshold}% pass threshold (${passRate.toFixed(1)}%)`);
    process.exit(0);
  } else {
    console.log(`\n❌ FAIL: Test suite below ${threshold}% pass threshold (${passRate.toFixed(1)}%)`);
    console.log(`   Need ${Math.ceil((threshold / 100) * total)} passing tests, got ${passed}`);
    
    // List some failed tests for context
    if (results.suites && results.suites.length > 0) {
      const failedTests = [];
      
      function collectFailedTests(suite) {
        if (suite.specs) {
          suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
              if (test.status === 'failed' || test.status === 'timedOut') {
                failedTests.push({
                  title: test.title,
                  file: suite.title,
                  error: test.results?.[0]?.error?.message || 'Unknown error'
                });
              }
            });
          });
        }
        if (suite.suites) {
          suite.suites.forEach(collectFailedTests);
        }
      }
      
      results.suites.forEach(collectFailedTests);
      
      if (failedTests.length > 0) {
        console.log('\n🔍 Failed tests (showing first 5):');
        failedTests.slice(0, 5).forEach((test, i) => {
          console.log(`  ${i + 1}. ${test.file} > ${test.title}`);
          console.log(`     Error: ${test.error.split('\n')[0]}`);
        });
        
        if (failedTests.length > 5) {
          console.log(`  ... and ${failedTests.length - 5} more failed tests`);
        }
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
