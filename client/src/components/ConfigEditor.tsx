import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Card,
  CardContent,
  Chip,
  Container
} from '@mui/material';
import { Build, Download, Language, Settings } from '@mui/icons-material';

export default function ConfigEditor() {
  const [url, setUrl] = useState('');
  const [appName, setAppName] = useState('My Web App');
  const [packageName, setPackageName] = useState('com.example.webapp');
  const [author, setAuthor] = useState('App Developer');
  const [platforms, setPlatforms] = useState({
    android: true,
    ios: false,
    windows: false,
    linux: false,
    macos: false
  });
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildComplete, setBuildComplete] = useState(false);

  const handlePlatformChange = (platform: string) => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform as keyof typeof prev]
    }));
  };

  const handleBuild = async () => {
    setIsBuilding(true);
    
    // Simulate build process
    setTimeout(() => {
      setIsBuilding(false);
      setBuildComplete(true);
    }, 3000);
  };

  const selectedPlatforms = Object.entries(platforms)
    .filter(([_, selected]) => selected)
    .map(([platform, _]) => platform);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Multi-Platform App Builder
      </Typography>
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Convert any website into native mobile and desktop applications
      </Typography>
      
      {!buildComplete ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Website Source */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Language sx={{ mr: 1 }} />
                <Typography variant="h6">Website Source</Typography>
              </Box>
              <TextField
                fullWidth
                label="Website URL"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Alert severity="info">
                Enter the URL of the website you want to convert into an app.
              </Alert>
            </CardContent>
          </Card>

          {/* App Configuration */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1 }} />
                <Typography variant="h6">App Configuration</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="App Name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Package Name"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Target Platforms
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={platforms.android}
                      onChange={() => handlePlatformChange('android')}
                    />
                  }
                  label="Android"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={platforms.ios}
                      onChange={() => handlePlatformChange('ios')}
                    />
                  }
                  label="iOS"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={platforms.windows}
                      onChange={() => handlePlatformChange('windows')}
                    />
                  }
                  label="Windows"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={platforms.linux}
                      onChange={() => handlePlatformChange('linux')}
                    />
                  }
                  label="Linux"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={platforms.macos}
                      onChange={() => handlePlatformChange('macos')}
                    />
                  }
                  label="macOS"
                />
              </FormGroup>
              
              {selectedPlatforms.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Platforms:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedPlatforms.map((platform) => (
                      <Chip key={platform} label={platform} color="primary" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Build Section */}
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Ready to Build?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your app will be built for {selectedPlatforms.length} platform(s)
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleBuild}
              disabled={isBuilding || !url || selectedPlatforms.length === 0}
              startIcon={<Build />}
            >
              {isBuilding ? 'Building...' : 'Build App'}
            </Button>
            
            {isBuilding && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Building your app... This may take a few minutes.
              </Alert>
            )}
          </Paper>
        </Box>
      ) : (
        /* Build Complete */
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom color="success.main">
            🎉 Build Complete!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your app has been successfully built for {selectedPlatforms.length} platform(s).
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {selectedPlatforms.map((platform) => (
              <Card key={platform} variant="outlined">
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {platform}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ready for download
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => {
                      // Simulate download
                      alert(`Downloading ${platform} app...`);
                    }}
                  >
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          <Button
            variant="outlined"
            onClick={() => {
              setBuildComplete(false);
              setIsBuilding(false);
            }}
          >
            Build Another App
          </Button>
        </Paper>
      )}
    </Container>
  );
}
