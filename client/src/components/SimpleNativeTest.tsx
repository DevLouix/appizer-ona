"use client"
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';

const SimpleNativeTest: React.FC = () => {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testNativeAPI();
  }, []);

  const testNativeAPI = async () => {
    try {
      setStatus('Testing Native API...');
      
      // Simple platform detection test
      const platform = typeof window !== 'undefined' ? 
        window.navigator.platform : 'Server';
      
      setStatus(`Platform detected: ${platform}`);
      
      // Test basic functionality
      setTimeout(() => {
        setStatus('Native API test completed successfully!');
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus('Test failed');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Native API Test
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Status
          </Typography>
          <Typography variant="body1">
            {status}
          </Typography>
          <Button 
            variant="contained" 
            onClick={testNativeAPI}
            sx={{ mt: 2 }}
          >
            Run Test Again
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleNativeTest;