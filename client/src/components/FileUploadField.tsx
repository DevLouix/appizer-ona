import {
  CloudUpload,
  Delete,
  Folder,
  Image,
  InsertDriveFile,
  Key,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import type React from "react";
import { useRef, useState } from "react";

interface FileUploadFieldProps {
  label: string;
  value: File[] | File | string | string[] | null;
  onChange: (files: File[] | File | null) => void;
  accept?: string;
  multiple?: boolean;
  hint?: string;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return <Image color="primary" />;
    case "keystore":
    case "jks":
    case "p12":
      return <Key color="secondary" />;
    case "zip":
    case "tar":
    case "gz":
      return <Folder color="action" />;
    default:
      return <InsertDriveFile color="action" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

export default function FileUploadField({
  label,
  value,
  onChange,
  accept = "*/*",
  multiple = false,
  hint,
}: FileUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle both File objects and file IDs (strings)
  const files = multiple
    ? Array.isArray(value)
      ? (value.filter((v) => v instanceof File) as File[])
      : value instanceof File
        ? [value]
        : []
    : value instanceof File
      ? [value]
      : [];

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    setError(null);

    // Validate file types if accept is specified
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(",").map((type) => type.trim());
      const invalidFiles = fileArray.filter((file) => {
        const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const mimeType = file.type;
        return !acceptedTypes.some(
          (acceptType) =>
            acceptType === extension ||
            acceptType === mimeType ||
            (acceptType.endsWith("/*") &&
              mimeType.startsWith(acceptType.replace("/*", ""))),
        );
      });

      if (invalidFiles.length > 0) {
        setError(
          `Invalid file type(s): ${invalidFiles.map((f) => f.name).join(", ")}`,
        );
        return;
      }
    }

    if (multiple) {
      const existingFiles = Array.isArray(value)
        ? (value.filter((v) => v instanceof File) as File[])
        : [];
      const newFiles = [...existingFiles, ...fileArray];
      onChange(newFiles);
    } else {
      onChange(fileArray[0] || null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    if (multiple) {
      const newFiles = files.filter((_, i) => i !== index);
      onChange(newFiles.length > 0 ? newFiles : null);
    } else {
      onChange(null);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>

      {/* File Upload Area */}
      <Box
        sx={{
          border: 2,
          borderColor: dragOver ? "primary.main" : "grey.300",
          borderStyle: "dashed",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          backgroundColor: dragOver ? "action.hover" : "background.paper",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "action.hover",
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CloudUpload sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          {multiple
            ? "Drop files here or click to select"
            : "Drop file here or click to select"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {accept !== "*/*" && `Accepted formats: ${accept}`}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          sx={{ mt: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
        >
          Choose {multiple ? "Files" : "File"}
        </Button>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Hint */}
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          {hint}
        </Typography>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected {multiple ? "Files" : "File"}:
          </Typography>
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                  {getFileIcon(file.name)}
                </Box>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.type || "Unknown type"}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(index)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
