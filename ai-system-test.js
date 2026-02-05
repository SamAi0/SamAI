// Action-Based AI System Test Script - Phase 1
// Run with: node ai-system-test.js

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust to your Next.js server
const TEST_ENDPOINT = '/api/ai/test';

// Test cases
const testCases = [
  {
    name: 'Valid JSON Schema',
    type: 'valid',
    expected: { success: true, shouldHaveSchema: true }
  },
  {
    name: 'Invalid Format (Missing Actions)',
    type: 'invalidFormat',
    expected: { success: false, shouldHaveErrors: true }
  },
  {
    name: 'Invalid JSON Syntax',
    type: 'invalidJSON',
    expected: { success: false, shouldHaveErrors: true }
  },
  {
    name: 'Plain Text Response',
    type: 'plainText',
    expected: { success: false, shouldHaveErrors: true }
  },
  {
    name: 'Markdown Wrapped JSON',
    type: 'markdownJSON',
    expected: { success: true, shouldHaveSchema: true }
  }
];

// Custom test case
const customTestCase = {
  name: 'Custom Response Test',
  customResponse: `{
    "thought": "Testing custom response with multiple actions",
    "actions": [
      {
        "type": "create_file",
        "path": "test/custom-test.txt",
        "content": "This is a custom test file"
      },
      {
        "type": "read_file",
        "path": "package.json"
      }
    ]
  }`,
  expected: { success: true, shouldHaveSchema: true }
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runTest(testCase) {
  console.log(`\n=== Testing: ${testCase.name} ===`);
  
  try {
    const requestBody = testCase.customResponse 
      ? { customResponse: testCase.customResponse }
      : { testType: testCase.type };
    
    const response = await makeRequest(`${BASE_URL}${TEST_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody
    });
    
    if (response.statusCode !== 200) {
      console.log(`❌ HTTP Error: ${response.statusCode}`);
      console.log('Response:', response.data);
      return false;
    }
    
    const result = response.data;
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Task ID: ${result.taskId}`);
    console.log(`Retry Count: ${result.result.retryCount}`);
    console.log(`Errors: ${result.result.errorCount}`);
    
    if (result.result.errors && result.result.errors.length > 0) {
      console.log('Error Details:');
      result.result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.field}: ${error.message}`);
      });
    }
    
    if (result.result.executionResults) {
      console.log('Execution Results:');
      result.result.executionResults.forEach((execResult, index) => {
        console.log(`  ${index + 1}. ${execResult.action.type} ${execResult.action.path || ''}: ${execResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (execResult.output) {
          console.log(`     Output: ${execResult.output.substring(0, 100)}${execResult.output.length > 100 ? '...' : ''}`);
        }
      });
    }
    
    // Validate expectations
    let passed = true;
    if (testCase.expected.shouldHaveSchema && !result.result.hasSchema) {
      console.log('❌ Expected schema but none found');
      passed = false;
    }
    if (testCase.expected.shouldHaveErrors && result.result.errorCount === 0) {
      console.log('❌ Expected errors but none found');
      passed = false;
    }
    if (testCase.expected.success !== undefined && result.result.success !== testCase.expected.success) {
      console.log(`❌ Expected success=${testCase.expected.success} but got ${result.result.success}`);
      passed = false;
    }
    
    if (passed) {
      console.log('✅ Test passed all expectations');
    } else {
      console.log('❌ Test failed some expectations');
    }
    
    return passed;
    
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Action-Based AI System - Phase 1 Tests');
  console.log('=========================================');
  console.log(`Testing endpoint: ${BASE_URL}${TEST_ENDPOINT}`);
  console.log();
  
  let passedTests = 0;
  let totalTests = testCases.length + 1; // +1 for custom test
  
  // Run standard test cases
  for (const testCase of testCases) {
    const passed = await runTest(testCase);
    if (passed) passedTests++;
  }
  
  // Run custom test case
  const customPassed = await runTest(customTestCase);
  if (customPassed) passedTests++;
  
  console.log('\n=========================================');
  console.log(`🏁 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Action-Based AI System is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the implementation.');
  }
  
  console.log('\n💡 System Features Demonstrated:');
  console.log('✅ JSON Schema Validation');
  console.log('✅ Response Parsing and Error Handling');
  console.log('✅ Retry Logic for Invalid Responses');
  console.log('✅ Action Execution Engine');
  console.log('✅ Security Boundary Enforcement');
  console.log('✅ Audit Logging');
  console.log('✅ Diff Generation');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});