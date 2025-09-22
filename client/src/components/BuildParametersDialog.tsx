import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Divider,
  Switch,
} from '@mui/material';

export interface BuildParameters {
  platforms: string[];
  buildType: 'debug' | 'release';
  skipErrors: boolean;
  dockerImage: string;
  githubToken: string;
  repository: string;
}

interface BuildParametersDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (params: BuildParameters) => void;
  initialParams?: Partial<BuildParameters>;
}

const AVAILABLE_PLATFORMS = [
  { id: 'android', label: 'Android (APK)', description: 'Build Android application' },
  { id: 'ios', label: 'iOS (IPA)', description: 'Build iOS application (requires macOS)' },
  { id: 'windows', label: 'Windows (EXE/MSI)', description: 'Build Windows desktop application' },
  { id: 'linux', label: 'Linux (DEB/RPM)', description: 'Build Linux desktop application' },
  { id: 'macos', label: 'macOS (DMG)', description: 'Build macOS application (requires macOS)' },
];

export default function BuildParametersDialog({
  open,
  onClose,
  onConfirm,
  initialParams = {}
}: BuildParametersDialogProps) {
  const [platforms, setPlatforms] = useState<string[]>(
    initialParams.platforms || ['android']
  );
  const [buildType, setBuildType] = useState<'debug' | 'release'>(
    initialParams.buildType || 'release'
  );
  const [skipErrors, setSkipErrors] = useState<boolean>(
    initialParams.skipErrors || false
  );
  const [dockerImage, setDockerImage] = useState<string>(
    initialParams.dockerImage || 'devlouix/appizer:latest'
  );
  const [githubToken, setGithubToken] = useState<string>(
    initialParams.githubToken || ''
  );
  const [repository, setRepository] = useState<string>(
    initialParams.repository || 'https://github.com/DevLouix/appizer-ona.git'
  );

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setPlatforms(prev => [...prev, platformId]);
    } else {
      setPlatforms(prev => prev.filter(p => p !== platformId));
    }
  };

  const handleConfirm = () => {
    if (platforms.length === 0) {
      alert('Please select at least one platform to build for.');
      return;
    }

    if (!githubToken.trim()) {
      alert('GitHub token is required for codespace creation.');
      return;
    }

    onConfirm({
      platforms,
      buildType,
      skipErrors,
      dockerImage,
      githubToken,
      repository,
    });
  };

  const handleSelectAll = () => {
    setPlatforms(AVAILABLE_PLATFORMS.map(p => p.id));
  };

  const handleSelectNone = () => {
    setPlatforms([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Build Parameters</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your app build settings and target platforms
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Target Platforms
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button size="small" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="small" onClick={handleSelectNone}>
              Select None
            </Button>
          </Box>
          <FormGroup>
            {AVAILABLE_PLATFORMS.map((platform) => (
              <FormControlLabel
                key={platform.id}
                control={
                  <Checkbox
                    checked={platforms.includes(platform.id)}
                    onChange={(e) => handlePlatformChange(platform.id, e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{platform.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {platform.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Build Configuration
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Build Type</InputLabel>
            <Select
              value={buildType}
              label="Build Type"
              onChange={(e) => setBuildType(e.target.value as 'debug' | 'release')}
            >
              <MenuItem value="debug">Debug - Faster build, includes debug info</MenuItem>
              <MenuItem value="release">Release - Optimized for production</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2">Skip Build Errors</Typography>
                <Typography variant="caption" color="text.secondary">
                  Continue building other platforms if one fails
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Docker & Repository Settings
          </Typography>
          
          <TextField
            fullWidth
            label="Docker Image"
            value={dockerImage}
            onChange={(e) => setDockerImage(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Docker image containing the build environment"
          />

          <TextField
            fullWidth
            label="Repository URL"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            sx={{ mb: 2 }}
            helperText="GitHub repository for codespace creation"
          />

          <TextField
            fullWidth
            type="password"
            label="GitHub Token"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            helperText="Personal access token with codespace permissions"
            required
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={platforms.length === 0 || !githubToken.trim()}
        >
          Start Build
        </Button>
      </DialogActions>
    </Dialog>
  );
}