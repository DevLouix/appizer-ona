import * as yaml from 'js-yaml';
import { FileManager } from '@/lib/file-manager';

// ---------- YAML generator using js-yaml ----------
export function generateYAML(obj: any): string {
  try {
    // Process the object to handle file references
    const processedObj = processFileReferences(obj);
    
    return yaml.dump(processedObj, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  } catch (error) {
    console.error('Error generating YAML:', error);
    return '# Error generating YAML configuration';
  }
}

// Process file references in the configuration object
function processFileReferences(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => processFileReferences(item));
  }

  if (typeof obj === 'object') {
    const processed: any = {};
    const fileManager = FileManager.getInstance();

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('file_')) {
        // This is a file ID, convert to file path
        const managedFile = fileManager.getFile(value);
        if (managedFile) {
          processed[key] = managedFile.path;
        } else {
          processed[key] = ''; // File not found, use empty string
        }
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('file_')) {
        // Array of file IDs
        processed[key] = value.map(fileId => {
          const managedFile = fileManager.getFile(fileId);
          return managedFile ? managedFile.path : '';
        }).filter(path => path !== ''); // Remove empty paths
      } else {
        processed[key] = processFileReferences(value);
      }
    }

    return processed;
  }

  return obj;
}

// Generate build configuration with file manifest
export function generateBuildConfig(formData: any): {
  yaml: string;
  fileManifest: Record<string, any>;
  hasLocalAssets: boolean;
} {
  const fileManager = FileManager.getInstance();
  const fileManifest = fileManager.getFileManifest();
  
  // Check if we have web assets and no URL specified
  const hasWebAssets = fileManifest.web_assets && fileManifest.web_assets.length > 0;
  const hasUrl = formData.url && formData.url.trim() !== '';
  const hasLocalAssets = hasWebAssets && !hasUrl;

  // If we have local assets but no URL, set URL to local assets path
  const processedFormData = { ...formData };
  if (hasLocalAssets) {
    processedFormData.url = 'file:///android_asset/index.html'; // Default for Android
  }

  const yaml = generateYAML(processedFormData);

  return {
    yaml,
    fileManifest,
    hasLocalAssets
  };
}

// Legacy function for backward compatibility
export function quoteIfString(x: any) {
  if (typeof x === "string") {
    return `"${x.replace(/"/g, '\\"')}"`;
  }
  if (typeof x === "boolean") return x ? "true" : "false";
  return x;
}