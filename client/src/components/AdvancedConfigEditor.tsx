"use client";
import {
  Android,
  Apple,
  Build,
  Computer,
  Download,
  ExpandMore,
  Palette,
  Security,
  Settings,
  Terminal,
  Web,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type React from "react";
import { useState } from "react";
import type { BackendConfig } from "../types/backend-config";
import BackendStatus from "./BackendStatus";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`platform-tabpanel-${index}`}
      aria-labelledby={`platform-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdvancedConfigEditor() {
  const [activeStep, setActiveStep] = useState(0);
  const [platformTab, setPlatformTab] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildComplete, setBuildComplete] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  const [config, setConfig] = useState<BackendConfig>({
    app_name: "My WebView App",
    package_name: "com.example.webviewapp",
    author: "App Developer",
    url: "https://example.com",
    platform_config: {
      android: {
        logo: "",
        splash: {
          type: "color",
          content: "",
          duration: 1500,
          background_color: "#FFFFFF",
          text_color: "#000000",
        },
        webapp: {
          enable_javascript: true,
          allow_file_access: false,
          orientation: "portrait",
          fullscreen: true,
          theme_color: "#4285F4",
          user_agent: "",
          built_in_zoom_controls: false,
          support_zoom: false,
        },
        build: {
          build_type: "release",
          min_sdk_version: 21,
          compile_sdk_version: 34,
          target_sdk_version: 34,
          build_tools_version: "34.0.0",
          version_code: 1,
          version_name: "1.0.0",
          gradle_custom_configs: {},
        },
        signing: {
          keystore_file_in_container:
            "/build/android/keystores/production.keystore",
          keystore_password: "",
          key_alias: "",
          key_password: "",
        },
      },
      ios: {
        build: {
          target_os_version: "14.0",
          build_scheme: "DefaultiOSApp",
          bundle_identifier: "com.example.iosapp",
          version_string: "1.0.0",
          build_number: 1,
        },
        webapp: {
          enable_javascript: true,
          fullscreen: true,
          theme_color: "#F8F8F8",
          user_agent: "",
        },
        logo: "",
        splash: {
          type: "color",
          content: "",
          duration: 1500,
          background_color: "#FFFFFF",
        },
      },
      linux: {
        build: {
          architecture: "x64",
          version: "1.0.0",
          app_id: "com.example.linuxapp",
          product_name: "Linux WebView App",
          package_format: "deb",
        },
        webapp: {
          width: 1280,
          height: 800,
          resizable: true,
          frameless: false,
          background_color: "#FFFFFF",
          user_agent: "",
        },
        icon: "",
      },
      windows: {
        build: {
          architecture: "x64",
          version: "1.0.0",
          app_id: "com.example.windowsapp",
          product_name: "Windows WebView App",
          output_format: "msi",
        },
        webapp: {
          width: 1024,
          height: 768,
          resizable: true,
          frameless: false,
          background_color: "#FFFFFF",
          user_agent: "",
        },
        icon: "",
      },
      macos: {
        build: {
          architecture: "x64",
          version: "1.0.0",
          app_id: "com.example.macosapp",
          product_name: "macOS WebView App",
          output_format: "dmg",
        },
        webapp: {
          width: 1280,
          height: 800,
          resizable: true,
          frameless: false,
          background_color: "#FFFFFF",
          user_agent: "",
        },
        icon: "",
      },
    },
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "android",
  ]);

  const updateConfig = (field: keyof BackendConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePlatformConfig = (
    platform: string,
    section: string,
    field: string,
    value: any,
  ) => {
    setConfig((prev) => ({
      ...prev,
      platform_config: {
        ...prev.platform_config,
        [platform]: {
          ...prev.platform_config[
            platform as keyof typeof prev.platform_config
          ],
          [section]: {
            ...(
              prev.platform_config[
                platform as keyof typeof prev.platform_config
              ] as any
            )?.[section],
            [field]: value,
          },
        },
      },
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleBuild = async () => {
    setIsBuilding(true);
    setBuildProgress(0);
    setBuildLogs([]);

    try {
      // Import backend client dynamically
      const { backendClient } = await import("../lib/backend-client");

      const platform =
        selectedPlatforms.length === 1 ? selectedPlatforms[0] : "all";

      setBuildLogs((prev) => [...prev, "🚀 Starting build process..."]);
      setBuildLogs((prev) => [...prev, `📡 Connecting to Docker backend...`]);

      // Test connection first
      const isConnected = await backendClient.testConnection();
      if (!isConnected) {
        throw new Error(
          "Cannot connect to Docker backend. Please ensure your backend server is running.",
        );
      }

      setBuildLogs((prev) => [...prev, `✅ Connected to backend successfully`]);
      setBuildLogs((prev) => [...prev, `🔧 Generating YAML configuration...`]);

      // Generate YAML config for debugging
      const yamlConfig = backendClient.generateYamlConfig(config);
      console.log("Generated YAML config:", yamlConfig);

      setBuildLogs((prev) => [
        ...prev,
        `📦 Starting Docker build for platform(s): ${platform}`,
      ]);

      // Start the actual build
      const result = await backendClient.startBuild(config, platform);

      if (!result.success) {
        throw new Error(result.error || "Build failed");
      }

      setBuildLogs((prev) => [
        ...prev,
        `✅ Build started with ID: ${result.build_id || "unknown"}`,
      ]);

      // If we have a build ID, poll for status
      if (result.build_id) {
        const pollInterval = setInterval(async () => {
          try {
            const status = await backendClient.getBuildStatus(result.build_id!);

            setBuildLogs(status.logs);

            if (status.status === "completed") {
              clearInterval(pollInterval);
              setBuildProgress(100);
              setIsBuilding(false);
              setBuildComplete(true);
              setBuildLogs((prev) => [
                ...prev,
                "🎉 Build completed successfully!",
              ]);
            } else if (status.status === "failed") {
              clearInterval(pollInterval);
              setIsBuilding(false);
              setBuildLogs((prev) => [...prev, "❌ Build failed"]);
              throw new Error("Build failed on backend");
            } else {
              // Update progress based on logs
              const progressPercent = Math.min(
                (status.logs.length / 10) * 100,
                90,
              );
              setBuildProgress(progressPercent);
            }
          } catch (error) {
            clearInterval(pollInterval);
            setIsBuilding(false);
            console.error("Status polling failed:", error);
          }
        }, 2000);

        // Cleanup after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isBuilding) {
            setIsBuilding(false);
            setBuildLogs((prev) => [
              ...prev,
              "⚠️ Build status polling timed out",
            ]);
          }
        }, 600000);
      } else {
        // No build ID, simulate completion
        setBuildProgress(100);
        setIsBuilding(false);
        setBuildComplete(true);
      }
    } catch (error) {
      setIsBuilding(false);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setBuildLogs((prev) => [...prev, `❌ Build failed: ${errorMessage}`]);

      // Show user-friendly error message
      if (errorMessage.includes("Cannot connect")) {
        alert(
          `❌ Backend Connection Failed\n\nPlease ensure:\n1. Your Docker backend is running\n2. Backend URL is correct: ${process.env.NEXT_PUBLIC_BACKEND_URL}\n3. No firewall is blocking the connection\n\nError: ${errorMessage}`,
        );
      } else {
        alert(`Build failed: ${errorMessage}`);
      }
    }
  };

  const steps = [
    "Basic Config",
    "Platform Selection",
    "Platform Settings",
    "Build",
  ];

  const renderBasicConfig = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Settings sx={{ mr: 1 }} />
          <Typography variant="h6">Basic Application Configuration</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Box>
            <TextField
              fullWidth
              label="App Name"
              value={config.app_name}
              onChange={(e) => updateConfig("app_name", e.target.value)}
              helperText="The display name of your application"
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Package Name"
              value={config.package_name}
              onChange={(e) => updateConfig("package_name", e.target.value)}
              helperText="Unique identifier (e.g., com.company.app)"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <TextField
              fullWidth
              label="Author"
              value={config.author}
              onChange={(e) => updateConfig("author", e.target.value)}
              helperText="Developer or company name"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <TextField
              fullWidth
              label="Website URL"
              value={config.url}
              onChange={(e) => updateConfig("url", e.target.value)}
              helperText="The website to load in the app"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPlatformSelection = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Select Target Platforms
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            {
              key: "android",
              label: "Android",
              icon: <Android />,
              color: "#4CAF50",
            },
            { key: "ios", label: "iOS", icon: <Apple />, color: "#000000" },
            {
              key: "windows",
              label: "Windows",
              icon: <Computer />,
              color: "#0078D4",
            },
            {
              key: "linux",
              label: "Linux",
              icon: <Terminal />,
              color: "#FCC624",
            },
            { key: "macos", label: "macOS", icon: <Apple />, color: "#000000" },
          ].map((platform) => (
            <Box>
              <Card
                variant={
                  selectedPlatforms.includes(platform.key)
                    ? "outlined"
                    : "elevation"
                }
                sx={{
                  cursor: "pointer",
                  border: selectedPlatforms.includes(platform.key)
                    ? `2px solid ${platform.color}`
                    : undefined,
                  "&:hover": { boxShadow: 3 },
                }}
                onClick={() => handlePlatformToggle(platform.key)}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Box sx={{ color: platform.color, mb: 1, fontSize: "2rem" }}>
                    {platform.icon}
                  </Box>
                  <Typography variant="h6">{platform.label}</Typography>
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.key)}
                    onChange={() => handlePlatformToggle(platform.key)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {selectedPlatforms.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Platforms ({selectedPlatforms.length}):
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {selectedPlatforms.map((platform) => (
                <Chip
                  key={platform}
                  label={platform}
                  color="primary"
                  onDelete={() => handlePlatformToggle(platform)}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderAndroidSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Android Configuration
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Build sx={{ mr: 1 }} />
          <Typography>Build Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Box>
              <FormControl fullWidth>
                <InputLabel>Build Type</InputLabel>
                <Select
                  value={
                    config.platform_config.android?.build.build_type ||
                    "release"
                  }
                  onChange={(e) =>
                    updatePlatformConfig(
                      "android",
                      "build",
                      "build_type",
                      e.target.value,
                    )
                  }
                >
                  <MenuItem value="debug">Debug</MenuItem>
                  <MenuItem value="release">Release</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Min SDK Version"
                value={
                  config.platform_config.android?.build.min_sdk_version || 21
                }
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "build",
                    "min_sdk_version",
                    parseInt(e.target.value, 10),
                  )
                }
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Target SDK Version"
                value={
                  config.platform_config.android?.build.target_sdk_version || 34
                }
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "build",
                    "target_sdk_version",
                    parseInt(e.target.value, 10),
                  )
                }
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Version Name"
                value={
                  config.platform_config.android?.build.version_name || "1.0.0"
                }
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "build",
                    "version_name",
                    e.target.value,
                  )
                }
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Web sx={{ mr: 1 }} />
          <Typography>WebView Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Box>
              <FormControl fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={
                    config.platform_config.android?.webapp.orientation ||
                    "portrait"
                  }
                  onChange={(e) =>
                    updatePlatformConfig(
                      "android",
                      "webapp",
                      "orientation",
                      e.target.value,
                    )
                  }
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Theme Color"
                value={
                  config.platform_config.android?.webapp.theme_color ||
                  "#4285F4"
                }
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "webapp",
                    "theme_color",
                    e.target.value,
                  )
                }
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      config.platform_config.android?.webapp
                        .enable_javascript || true
                    }
                    onChange={(e) =>
                      updatePlatformConfig(
                        "android",
                        "webapp",
                        "enable_javascript",
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Enable JavaScript"
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      config.platform_config.android?.webapp.fullscreen || true
                    }
                    onChange={(e) =>
                      updatePlatformConfig(
                        "android",
                        "webapp",
                        "fullscreen",
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Fullscreen Mode"
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Palette sx={{ mr: 1 }} />
          <Typography>Splash Screen</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Box>
              <FormControl fullWidth>
                <InputLabel>Splash Type</InputLabel>
                <Select
                  value={config.platform_config.android?.splash.type || "color"}
                  onChange={(e) =>
                    updatePlatformConfig(
                      "android",
                      "splash",
                      "type",
                      e.target.value,
                    )
                  }
                >
                  <MenuItem value="color">Color</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Duration (ms)"
                value={config.platform_config.android?.splash.duration || 1500}
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "splash",
                    "duration",
                    parseInt(e.target.value, 10),
                  )
                }
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Background Color"
                value={
                  config.platform_config.android?.splash.background_color ||
                  "#FFFFFF"
                }
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "splash",
                    "background_color",
                    e.target.value,
                  )
                }
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Security sx={{ mr: 1 }} />
          <Typography>App Signing (Optional)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Box>
              <Alert severity="info">
                App signing is required for release builds. Leave empty for
                debug builds.
              </Alert>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Key Alias"
                value={config.platform_config.android?.signing?.key_alias || ""}
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "signing",
                    "key_alias",
                    e.target.value,
                  )
                }
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="password"
                label="Keystore Password"
                value={
                  config.platform_config.android?.signing?.keystore_password ||
                  ""
                }
                onChange={(e) =>
                  updatePlatformConfig(
                    "android",
                    "signing",
                    "keystore_password",
                    e.target.value,
                  )
                }
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderPlatformSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Platform-Specific Settings
        </Typography>

        <Tabs
          value={platformTab}
          onChange={(_, newValue) => setPlatformTab(newValue)}
        >
          {selectedPlatforms.map((platform, _index) => (
            <Tab
              key={platform}
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            />
          ))}
        </Tabs>

        {selectedPlatforms.map((platform, index) => (
          <TabPanel key={platform} value={platformTab} index={index}>
            {platform === "android" && renderAndroidSettings()}
            {platform === "ios" && (
              <Typography>iOS settings coming soon...</Typography>
            )}
            {platform === "windows" && (
              <Typography>Windows settings coming soon...</Typography>
            )}
            {platform === "linux" && (
              <Typography>Linux settings coming soon...</Typography>
            )}
            {platform === "macos" && (
              <Typography>macOS settings coming soon...</Typography>
            )}
          </TabPanel>
        ))}
      </CardContent>
    </Card>
  );

  const renderBuildSummary = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Build Summary
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="subtitle2">App Name:</Typography>
            <Typography variant="body2">{config.app_name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Package Name:</Typography>
            <Typography variant="body2">{config.package_name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Website URL:</Typography>
            <Typography variant="body2">{config.url}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Author:</Typography>
            <Typography variant="body2">{config.author}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Platforms:</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {selectedPlatforms.map((platform) => (
                <Chip key={platform} label={platform} color="primary" />
              ))}
            </Box>
          </Box>
        </Box>

        {isBuilding && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Build Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={buildProgress}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              {buildProgress.toFixed(0)}% Complete
            </Typography>

            <Box
              sx={{
                mt: 2,
                maxHeight: 200,
                overflow: "auto",
                bgcolor: "grey.100",
                p: 2,
                borderRadius: 1,
              }}
            >
              {buildLogs.map((log, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  {log}
                </Typography>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleBuild}
            disabled={isBuilding || selectedPlatforms.length === 0}
            startIcon={<Build />}
          >
            {isBuilding ? "Building..." : "Start Build"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Advanced Multi-Platform App Builder
      </Typography>
      <Typography
        variant="h6"
        color="text.secondary"
        align="center"
        sx={{ mb: 4 }}
      >
        Configure and build native apps from your website using Docker backend
      </Typography>

      {/* Backend Status */}
      <Box sx={{ mb: 3 }}>
        <BackendStatus />
      </Box>

      {!buildComplete ? (
        <Box>
          {/* Progress Stepper */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: "pointer" }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Step Content */}
          <Box sx={{ mb: 3 }}>
            {activeStep === 0 && renderBasicConfig()}
            {activeStep === 1 && renderPlatformSelection()}
            {activeStep === 2 && renderPlatformSettings()}
            {activeStep === 3 && renderBuildSummary()}
          </Box>

          {/* Navigation */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep((prev) => prev + 1)}
              >
                Next
              </Button>
            </Box>
          </Paper>
        </Box>
      ) : (
        /* Build Complete */
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom color="success.main">
            🎉 Build Complete!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your app has been successfully built for {selectedPlatforms.length}{" "}
            platform(s).
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {selectedPlatforms.map((platform) => (
              <Box>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ textTransform: "capitalize", mb: 1 }}
                    >
                      {platform}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Ready for download
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Download />}
                      onClick={() => alert(`Downloading ${platform} app...`)}
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          <Button
            variant="outlined"
            onClick={() => {
              setBuildComplete(false);
              setIsBuilding(false);
              setActiveStep(0);
            }}
          >
            Build Another App
          </Button>
        </Paper>
      )}
    </Container>
  );
}
