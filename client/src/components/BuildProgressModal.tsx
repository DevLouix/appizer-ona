import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  PlayArrow,
  Pause,
  Download,
  ExpandMore,
  Refresh,
  Delete,
} from '@mui/icons-material';
import { CodespaceAutomation } from '../lib/codespace-automation';

interface BuildProgressModalProps {
  open: boolean;
  onClose: () => void;
  buildStatus: CodespaceAutomation | null;
  onRetry?: () => void;
  onDownload?: (artifact: { platform: string; filename: string; downloadUrl: string }) => void;
}

const BUILD_STEPS = [
  { id: 'creating', label: 'Creating Codespace', description: 'Setting up development environment' },
  { id: 'starting', label: 'Starting Environment', description: 'Initializing codespace' },
  { id: 'running', label: 'Preparing Build', description: 'Setting up build environment' },
  { id: 'building', label: 'Building Applications', description: 'Compiling for target platforms' },
  { id: 'downloading', label: 'Preparing Downloads', description: 'Packaging build artifacts' },
  { id: 'cleaning', label: 'Cleaning Up', description: 'Removing temporary resources' },
  { id: 'completed', label: 'Build Complete', description: 'All tasks finished successfully' },
];

export default function BuildProgressModal({
  open,
  onClose,
  buildStatus,
  onRetry,
  onDownload,
}: BuildProgressModalProps) {
  const [expandedLogs, setExpandedLogs] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const currentStepIndex = buildStatus 
    ? BUILD_STEPS.findIndex(step => step.id === buildStatus.status)
    : -1;

  const getStepIcon = (stepId: string) => {
    if (!buildStatus) return <PlayArrow />;
    
    const stepIndex = BUILD_STEPS.findIndex(step => step.id === stepId);
    const currentIndex = BUILD_STEPS.findIndex(step => step.id === buildStatus.status);
    
    if (buildStatus.status === 'error') {
      return stepIndex <= currentIndex ? <Error color="error" /> : <PlayArrow />;
    }
    
    if (stepIndex < currentIndex || buildStatus.status === 'completed') {
      return <CheckCircle color="success" />;
    } else if (stepIndex === currentIndex) {
      return <PlayArrow color="primary" />;
    } else {
      return <PlayArrow />;
    }
  };

  const getProgressColor = (): "primary" | "error" | "success" => {
    if (!buildStatus) return "primary";
    if (buildStatus.status === 'error') return "error";
    if (buildStatus.status === 'completed') return "success";
    return "primary";
  };

  const canClose = buildStatus?.status === 'completed' || buildStatus?.status === 'error';

  useEffect(() => {
    if (autoScroll && buildStatus?.logs) {
      // Auto-scroll to bottom of logs
      const logsContainer = document.getElementById('build-logs-container');
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }
  }, [buildStatus?.logs, autoScroll]);

  return (
    <Dialog 
      open={open} 
      onClose={canClose ? onClose : undefined}
      maxWidth="lg" 
      fullWidth
      disableEscapeKeyDown={!canClose}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">App Build Progress</Typography>
          {buildStatus && (
            <Chip 
              label={buildStatus.status.toUpperCase()} 
              color={getProgressColor()}
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ minHeight: 500 }}>
        {buildStatus && (
          <Box>
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {buildStatus.message}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {buildStatus.progress}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={buildStatus.progress} 
                color={getProgressColor()}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Error Alert */}
            {buildStatus.status === 'error' && buildStatus.error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Build Failed</Typography>
                <Typography variant="body2">{buildStatus.error}</Typography>
              </Alert>
            )}

            {/* Success Alert with Artifacts */}
            {buildStatus.status === 'completed' && buildStatus.artifacts && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Build Completed Successfully!</Typography>
                <Typography variant="body2">
                  {buildStatus.artifacts.length} artifact(s) ready for download
                </Typography>
              </Alert>
            )}

            {/* Build Steps */}
            <Stepper activeStep={currentStepIndex} orientation="vertical" sx={{ mb: 3 }}>
              {BUILD_STEPS.map((step, index) => (
                <Step key={step.id}>
                  <StepLabel icon={getStepIcon(step.id)}>
                    <Typography variant="subtitle2">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {/* Artifacts Download Section */}
            {buildStatus.artifacts && buildStatus.artifacts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Download Artifacts
                </Typography>
                <List dense>
                  {buildStatus.artifacts.map((artifact, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <Button
                          startIcon={<Download />}
                          onClick={() => onDownload?.(artifact)}
                          variant="outlined"
                          size="small"
                        >
                          Download
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={artifact.filename}
                        secondary={`Platform: ${artifact.platform}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Build Logs */}
            <Accordion expanded={expandedLogs} onChange={() => setExpandedLogs(!expandedLogs)}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  Build Logs ({buildStatus.logs?.length || 0} entries)
                </Typography>
                <Box sx={{ ml: 'auto', mr: 1 }}>
                  <Tooltip title="Auto-scroll to latest">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAutoScroll(!autoScroll);
                      }}
                      color={autoScroll ? "primary" : "default"}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  id="build-logs-container"
                  sx={{
                    maxHeight: 300,
                    overflow: 'auto',
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  {buildStatus.logs && buildStatus.logs.length > 0 ? (
                    buildStatus.logs.map((log, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        component="div"
                        sx={{ 
                          mb: 0.5,
                          color: log.includes('Error') || log.includes('❌') ? 'error.main' : 'text.primary'
                        }}
                      >
                        [{new Date().toLocaleTimeString()}] {log}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No logs available yet...
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {!buildStatus && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Waiting for build to start...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {buildStatus?.status === 'error' && onRetry && (
          <Button onClick={onRetry} startIcon={<Refresh />}>
            Retry Build
          </Button>
        )}
        <Button 
          onClick={onClose} 
          disabled={!canClose}
          variant={canClose ? "contained" : "outlined"}
        >
          {canClose ? 'Close' : 'Building...'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}