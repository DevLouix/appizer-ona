import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  Image,
  Key,
  Folder,
  InsertDriveFile,
  Delete,
} from '@mui/icons-material';
import { FileManager, ManagedFile } from '@/lib/file-manager';

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <Image color="primary" />;
    case 'keystore':
    case 'jks':
    case 'p12':
      return <Key color="secondary" />;
    case 'zip':
    case 'tar':
    case 'gz':
      return <Folder color="action" />;
    default:
      return <InsertDriveFile color="action" />;
  }
};

const getCategoryLabel = (category: ManagedFile['category']): string => {
  switch (category) {
    case 'web_assets': return 'Web Assets';
    case 'android_logo': return 'Android Logo';
    case 'android_splash': return 'Android Splash';
    case 'android_keystore': return 'Android Keystore';
    case 'ios_icon': return 'iOS Icon';
    case 'windows_icon': return 'Windows Icon';
    case 'linux_icon': return 'Linux Icon';
    case 'macos_icon': return 'macOS Icon';
    default: return category;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface FileUploadStatusProps {
  onFileRemove?: (fileId: string) => void;
}

export default function FileUploadStatus({ onFileRemove }: FileUploadStatusProps) {
  const fileManager = FileManager.getInstance();
  const allFiles = fileManager.getAllFiles();

  if (allFiles.length === 0) {
    return null;
  }

  // Group files by category
  const filesByCategory = allFiles.reduce((acc, file) => {
    if (!acc[file.category]) {
      acc[file.category] = [];
    }
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, ManagedFile[]>);

  const handleRemoveFile = (fileId: string) => {
    fileManager.removeFile(fileId);
    onFileRemove?.(fileId);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">
            Uploaded Files ({allFiles.length} files)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {Object.entries(filesByCategory).map(([category, files]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {getCategoryLabel(category as ManagedFile['category'])}
                <Chip 
                  label={files.length} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              </Typography>
              <List dense>
                {files.map((file) => (
                  <ListItem
                    key={file.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(file.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      {getFileIcon(file.file.name)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.file.name}
                      secondary={`${formatFileSize(file.file.size)} • ${file.path}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}