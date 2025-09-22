import { FieldSchema } from "@/types/main";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Tooltip,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { useState, useRef } from "react";
import SectionRenderer from "./SectionRenderer";
import { generateYAML } from "@/funcs/yaml_geneator";
import { exampleSchema } from "@/configs/defaultEditor";
import BuildParametersDialog, { BuildParameters } from "./BuildParametersDialog";
import BuildProgressModal from "./BuildProgressModal";
import { AppBuildOrchestrator, CodespaceAutomation } from "@/lib/codespace-automation";
import * as yaml from "js-yaml";

// ---------- Main component ----------
export default function ConfigEditor() {
  // Build a default values object from the schema
  const buildDefault = (schema: FieldSchema[]): any => {
    const out: any = {};
    for (const f of schema) {
      if (f.type === "object") {
        out[f.key] = buildDefault(f.fields ?? []);
      } else {
        out[f.key] = f.default ?? (f.type === "boolean" ? false : "");
      }
    }
    return out;
  };

  const [schema] = useState<FieldSchema[]>(exampleSchema);
  const [formData, setFormData] = useState<any>(() =>
    buildDefault(exampleSchema)
  );
  const [yamlPreview, setYamlPreview] = useState<string>("");
  const [isAppizing, setIsAppizing] = useState<boolean>(false);
  const [appizeStatus, setAppizeStatus] = useState<string>("");
  const [showBuildDialog, setShowBuildDialog] = useState<boolean>(false);
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [buildStatus, setBuildStatus] = useState<CodespaceAutomation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge incoming partial changes (from setNested outputs)
  const applyPartial = (partial: any) => {
    // Shallow merge at top-level keys where needed. We perform a deep merge.
    const deepMerge = (target: any, src: any): any => {
      if (!src) return target;
      const out: any = Array.isArray(target)
        ? [...target]
        : { ...(target ?? {}) };
      for (const k of Object.keys(src)) {
        if (
          typeof src[k] === "object" &&
          src[k] !== null &&
          !Array.isArray(src[k])
        ) {
          out[k] = deepMerge(target?.[k] ?? {}, src[k]);
        } else {
          out[k] = src[k];
        }
      }
      return out;
    };

    setFormData((prev: any) => deepMerge(prev, partial));
  };

  const handleGenerate = () => {
    const yaml = generateYAML(formData);
    setYamlPreview(yaml);
  };

  const handleDownload = (format: "yaml" | "json") => {
    let content = "";
    let filename = "config";
    if (format === "yaml") {
      content = generateYAML(formData);
      filename += ".yaml";
    } else {
      content = JSON.stringify(formData, null, 2);
      filename += ".json";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const text = yamlPreview || generateYAML(formData);
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch (e) {
      alert("Failed to copy — please use manual selection");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let parsedData: any;

        if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          parsedData = yaml.load(content);
        } else if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(content);
        } else {
          alert("Please upload a .yaml, .yml, or .json file");
          return;
        }

        // Merge the loaded data with the current form data structure
        const mergedData = { ...buildDefault(exampleSchema), ...parsedData };
        setFormData(mergedData);
        setYamlPreview(generateYAML(mergedData));
        alert("Configuration loaded successfully!");
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error parsing file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleLoadFile = () => {
    fileInputRef.current?.click();
  };

  const handleAppize = () => {
    setShowBuildDialog(true);
  };

  const handleBuildConfirm = async (params: BuildParameters) => {
    setShowBuildDialog(false);
    setShowProgressModal(true);
    setIsAppizing(true);
    setBuildStatus(null);

    try {
      const yamlConfig = generateYAML(formData);
      
      const orchestrator = new AppBuildOrchestrator(
        params.githubToken,
        params.repository,
        (status) => setBuildStatus(status)
      );

      const result = await orchestrator.buildApp({
        platforms: params.platforms,
        dockerImage: params.dockerImage,
        yamlConfig,
        buildType: params.buildType,
        skipErrors: params.skipErrors,
      });

      setBuildStatus(result);
      setIsAppizing(false);
      
    } catch (error) {
      console.error("Build error:", error);
      setBuildStatus({
        status: 'error',
        message: `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 0,
        logs: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsAppizing(false);
    }
  };

  const handleDownloadArtifact = async (artifact: { platform: string; filename: string; downloadUrl: string }) => {
    try {
      // In a real implementation, this would download from the codespace
      // For now, we'll simulate the download
      const response = await fetch('/api/download-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artifact }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = artifact.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download ${artifact.filename}: ${error}`);
    }
  };

  const handleRetryBuild = () => {
    setShowProgressModal(false);
    setShowBuildDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Config Form — Next.js + TypeScript + MUI
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        This form is generated by a JSON schema. Edit fields and press
        "Generate" to build a YAML-style config (preview below). Use Download or
        Copy to export.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <SectionRenderer
          schema={schema}
          data={formData}
          onChange={(partial) => applyPartial(partial)}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="contained" onClick={handleGenerate}>
            Generate Preview
          </Button>
          <Tooltip title="Copy YAML to clipboard">
            <IconButton onClick={handleCopy}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload("yaml")}
          >
            Download .yaml
          </Button>
          <Button onClick={() => handleDownload("json")}>Download .json</Button>
          <Button
            startIcon={<UploadFileIcon />}
            onClick={handleLoadFile}
            variant="outlined"
          >
            Load Config
          </Button>
          <Button
            startIcon={isAppizing ? <CircularProgress size={16} /> : <RocketLaunchIcon />}
            onClick={handleAppize}
            variant="contained"
            color="success"
            disabled={isAppizing}
            sx={{ ml: 2 }}
          >
            {isAppizing ? "Building..." : "Appize"}
          </Button>
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".yaml,.yml,.json"
          style={{ display: "none" }}
        />

        {appizeStatus && (
          <Alert 
            severity={appizeStatus.startsWith("Error") ? "error" : "success"} 
            sx={{ mt: 2 }}
          >
            {appizeStatus}
          </Alert>
        )}

        <BuildParametersDialog
          open={showBuildDialog}
          onClose={() => setShowBuildDialog(false)}
          onConfirm={handleBuildConfirm}
        />

        <BuildProgressModal
          open={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          buildStatus={buildStatus}
          onRetry={handleRetryBuild}
          onDownload={handleDownloadArtifact}
        />
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 2, whiteSpace: "pre-wrap", fontFamily: "monospace" }}
      >
        <Typography variant="subtitle1">Preview</Typography>
        <Box component="pre" sx={{ mt: 1 }}>
          {yamlPreview || generateYAML(formData)}
        </Box>
      </Paper>
    </Box>
  );
}
