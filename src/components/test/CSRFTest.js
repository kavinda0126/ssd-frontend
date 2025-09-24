import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Badge } from 'react-bootstrap';
import apiService from '../../utils/apiService';

const CSRFTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName, testFunction) => {
    setIsLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, message: result.message, data: result.data }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          message: error.message || 'Test failed', 
          error: error.response?.data || error
        }
      }));
    }
    setIsLoading(false);
  };

  // Test 1: Get CSRF token
  const testGetCSRFToken = async () => {
    const response = await apiService.get('/csrf-token');
    return {
      message: 'CSRF token retrieved successfully',
      data: response.data
    };
  };

  // Test 2: Test protected endpoint with token
  const testProtectedEndpointWithToken = async () => {
    const response = await apiService.get('/appointment/test-endpoint');
    return {
      message: 'Protected endpoint accessible with valid CSRF token',
      data: response.data
    };
  };

  // Test 3: Test exempted endpoint (should work without token)
  const testExemptedEndpoint = async () => {
    // Create a direct axios call without CSRF token for login
    const axios = require('axios');
    const response = await axios.post('http://localhost:5000/customer/login', {
      email: 'test@example.com',
      password: 'testpassword'
    });
    return {
      message: 'Exempted endpoint works without CSRF token',
      data: 'Login endpoint accessible'
    };
  };

  // Test 4: Test malicious request without CSRF token
  const testMaliciousRequest = async () => {
    try {
      const axios = require('axios');
      // Try to make a request to a protected endpoint without CSRF token
      await axios.post('http://localhost:5000/appointment/addmechanicalAppointment', {
        maliciousData: 'This should be rejected'
      });
      throw new Error('Security vulnerability: Request should have been rejected!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return {
          message: 'CSRF protection working: Malicious request correctly rejected',
          data: 'Request blocked due to missing CSRF token'
        };
      }
      throw error;
    }
  };

  const runAllTests = async () => {
    await runTest('csrfToken', testGetCSRFToken);
    await runTest('protectedEndpoint', testProtectedEndpointWithToken);
    await runTest('exemptedEndpoint', testExemptedEndpoint);
    await runTest('maliciousRequest', testMaliciousRequest);
  };

  const renderTestResult = (testName, result) => {
    if (!result) return null;

    return (
      <Alert variant={result.success ? 'success' : 'danger'} className="mb-2">
        <div className="d-flex justify-content-between align-items-center">
          <strong>{testName}</strong>
          <Badge bg={result.success ? 'success' : 'danger'}>
            {result.success ? 'PASS' : 'FAIL'}
          </Badge>
        </div>
        <div className="mt-2">
          <small>{result.message}</small>
          {result.data && (
            <pre className="mt-1" style={{ fontSize: '0.8rem', backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
          {result.error && (
            <pre className="mt-1" style={{ fontSize: '0.8rem', backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
              {JSON.stringify(result.error, null, 2)}
            </pre>
          )}
        </div>
      </Alert>
    );
  };

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <h3>CSRF Protection Test Suite</h3>
          <p className="mb-0 text-muted">Test your CSRF implementation to ensure security</p>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <Button 
              variant="primary" 
              onClick={runAllTests}
              disabled={isLoading}
              className="me-2"
            >
              {isLoading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => setTestResults({})}
            >
              Clear Results
            </Button>
          </div>

          <div className="mb-3">
            <h5>Individual Tests:</h5>
            <div className="d-flex flex-wrap gap-2">
              <Button size="sm" variant="outline-primary" onClick={() => runTest('csrfToken', testGetCSRFToken)}>
                Test CSRF Token
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => runTest('protectedEndpoint', testProtectedEndpointWithToken)}>
                Test Protected Endpoint
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => runTest('exemptedEndpoint', testExemptedEndpoint)}>
                Test Exempted Endpoint
              </Button>
              <Button size="sm" variant="outline-danger" onClick={() => runTest('maliciousRequest', testMaliciousRequest)}>
                Test Malicious Request
              </Button>
            </div>
          </div>

          <div>
            <h5>Test Results:</h5>
            {Object.keys(testResults).length === 0 ? (
              <Alert variant="info">No tests run yet. Click "Run All Tests" to begin.</Alert>
            ) : (
              Object.entries(testResults).map(([testName, result]) => 
                renderTestResult(testName, result)
              )
            )}
          </div>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5>How to Manually Test CSRF Protection</h5>
        </Card.Header>
        <Card.Body>
          <ol>
            <li><strong>Browser DevTools:</strong> Open Network tab, make API calls, verify 'x-csrf-token' header is present</li>
            <li><strong>Console Test:</strong> Try making requests without CSRF token - they should fail</li>
            <li><strong>Login Test:</strong> Verify login/register still work (exempted routes)</li>
            <li><strong>Protected Routes:</strong> Verify all other endpoints require valid CSRF tokens</li>
          </ol>
          
          <Alert variant="warning" className="mt-3">
            <strong>Security Note:</strong> CSRF protection should reject requests without valid tokens with 403 Forbidden errors.
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CSRFTest;