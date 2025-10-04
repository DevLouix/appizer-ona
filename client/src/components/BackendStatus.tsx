"use client";
import {
  CheckCircle,
  Code,
  Computer,
  Error as ErrorIcon,
  ExpandMore,
  Refresh,
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
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function BackendStatus() {
  const [status, setStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [healthData, setHealthData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [yamlPreview, setYamlPreview] = useState<string>("");

  const checkBackendStatus = async () => {
    setStatus("checking");
    setError(null);

    try {
      const { backendClient } = await import("../lib/backend-client");

      const health = await backendClient.getHealth();
      setHealthData(health);
      setStatus("connected");

      // Generate sample YAML config
      const sampleConfig = {
        app_name: "Sample App",
        package_name: "com.example.sample",
        author: "Developer",
        url: "https://example.com",
        platform_config: {
          android: {
            logo: "",
            splash: {
              type: "color" as const,
              content: "",
              duration: 1500,
              background_color: "#FFFFFF",
              text_color: "#000000",
            },
            webapp: {
              enable_javascript: true,
              allow_file_access: false,
              orientation: "portrait" as const,
              fullscreen: true,
              theme_color: "#4285F4",
              user_agent: "",
              built_in_zoom_controls: false,
              support_zoom: false,
            },
            build: {
              build_type: "release" as const,
              min_sdk_version: 21,
              compile_sdk_version: 34,
              target_sdk_version: 34,
              build_tools_version: "34.0.0",
              version_code: 1,
              version_name: "1.0.0",
              gradle_custom_configs: {},
            },
          },
        },
      };

      const yaml = backendClient.generateYamlConfig(sampleConfig);
      setYamlPreview(yaml);
    } catch (err) {
      setStatus("disconnected");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, [checkBackendStatus]);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "success";
      case "disconnected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle />;
      case "disconnected":
        return <ErrorIcon />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6">Backend Status</Typography>
          <Button
            startIcon={<Refresh />}
            onClick={checkBackendStatus}
            disabled={status === "checking"}
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Chip
            icon={getStatusIcon()}
            label={
              status === "checking"
                ? "Checking..."
                : status === "connected"
                  ? "Connected"
                  : "Disconnected"
            }
            color={getStatusColor() as "success" | "error" | "warning"}
          />
          <Typography variant="body2" color="text.secondary">
            {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Connection Failed</Typography>
            <Typography variant="body2">{error}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please ensure your Docker backend is running and accessible.
            </Typography>
          </Alert>
        )}

        {healthData && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Backend Information:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {(healthData as any)?.version && (
                <Chip size="small" label={`Version: ${(healthData as any).version}`} />
              )}
              {(healthData as any)?.docker_available !== undefined && (
                <Chip
                  size="small"
                  label={`Docker: ${(healthData as any).docker_available ? "Available" : "Not Available"}`}
                  color={(healthData as any).docker_available ? "success" : "error"}
                />
              )}
            </Box>
          </Box>
        )}

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Computer sx={{ mr: 1 }} />
            <Typography>Backend Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Your backend expects YAML configuration in the following format:
            </Typography>
            <Box
              sx={{
                bgcolor: "grey.100",
                p: 2,
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: "0.875rem",
                overflow: "auto",
                maxHeight: 300,
              }}
            >
              <pre>{yamlPreview || "Loading..."}</pre>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Code sx={{ mr: 1 }} />
            <Typography>Docker Commands</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              To run your backend Docker container:
            </Typography>
            <Box
              sx={{
                bgcolor: "grey.100",
                p: 2,
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              <pre>{`# Build the Docker image
docker build -t appizer-backend ./lib

# Run the backend server
docker run -d \\
  -p 8080:8080 \\
  -v /path/to/config.yaml:/config.yaml \\
  -v /path/to/webapp:/webapp \\
  -v /path/to/output:/output \\
  appizer-backend -p android

# Check container logs
docker logs <container-id>`}</pre>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
