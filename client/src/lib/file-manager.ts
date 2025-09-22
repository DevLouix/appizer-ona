export interface ManagedFile {
  id: string;
  file: File;
  path: string;
  category: 'web_assets' | 'android_logo' | 'android_splash' | 'android_keystore' | 'ios_icon' | 'windows_icon' | 'linux_icon' | 'macos_icon';
  uploadedAt: Date;
}

export class FileManager {
  private files: Map<string, ManagedFile> = new Map();
  private static instance: FileManager;

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  addFile(file: File, category: ManagedFile['category'], customPath?: string): string {
    try {
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object provided');
      }

      const id = this.generateId();
      const path = customPath || this.generatePath(file, category);
      
      const managedFile: ManagedFile = {
        id,
        file,
        path,
        category,
        uploadedAt: new Date(),
      };

      this.files.set(id, managedFile);
      return id;
    } catch (error) {
      console.error('Error adding file to manager:', error);
      throw error;
    }
  }

  addFiles(files: File[], category: ManagedFile['category']): string[] {
    return files.map(file => this.addFile(file, category));
  }

  getFile(id: string): ManagedFile | undefined {
    return this.files.get(id);
  }

  getFilesByCategory(category: ManagedFile['category']): ManagedFile[] {
    return Array.from(this.files.values()).filter(f => f.category === category);
  }

  removeFile(id: string): boolean {
    return this.files.delete(id);
  }

  getAllFiles(): ManagedFile[] {
    return Array.from(this.files.values());
  }

  clear(): void {
    this.files.clear();
  }

  async createFileBlob(id: string): Promise<Blob | null> {
    const managedFile = this.getFile(id);
    if (!managedFile) return null;
    return managedFile.file;
  }

  async createZipArchive(category?: ManagedFile['category']): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const filesToZip = category 
      ? this.getFilesByCategory(category)
      : this.getAllFiles();

    for (const managedFile of filesToZip) {
      zip.file(managedFile.path, managedFile.file);
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  getFileManifest(): Record<string, any> {
    const manifest: Record<string, any> = {};
    
    for (const [id, managedFile] of this.files) {
      const categoryKey = managedFile.category;
      if (!manifest[categoryKey]) {
        manifest[categoryKey] = [];
      }
      
      manifest[categoryKey].push({
        id,
        filename: managedFile.file.name,
        path: managedFile.path,
        size: managedFile.file.size,
        type: managedFile.file.type,
        uploadedAt: managedFile.uploadedAt.toISOString(),
      });
    }

    return manifest;
  }

  private generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePath(file: File, category: ManagedFile['category']): string {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (category) {
      case 'web_assets':
        return `assets/${sanitizedName}`;
      case 'android_logo':
        return `android/logo/${sanitizedName}`;
      case 'android_splash':
        return `android/splash/${sanitizedName}`;
      case 'android_keystore':
        return `android/keystore/${sanitizedName}`;
      case 'ios_icon':
        return `ios/icon/${sanitizedName}`;
      case 'windows_icon':
        return `windows/icon/${sanitizedName}`;
      case 'linux_icon':
        return `linux/icon/${sanitizedName}`;
      case 'macos_icon':
        return `macos/icon/${sanitizedName}`;
      default:
        return `misc/${sanitizedName}`;
    }
  }
}

// Helper functions for form integration
export const handleFileUpload = (
  files: File | File[] | null,
  category: ManagedFile['category']
): string[] => {
  try {
    const fileManager = FileManager.getInstance();
    
    if (!files) return [];
    
    const fileArray = Array.isArray(files) ? files : [files];
    const validFiles = fileArray.filter(file => file instanceof File);
    
    if (validFiles.length === 0) return [];
    
    return fileManager.addFiles(validFiles, category);
  } catch (error) {
    console.error('Error handling file upload:', error);
    return [];
  }
};

export const getUploadedFiles = (category: ManagedFile['category']): ManagedFile[] => {
  const fileManager = FileManager.getInstance();
  return fileManager.getFilesByCategory(category);
};

export const removeUploadedFile = (id: string): boolean => {
  const fileManager = FileManager.getInstance();
  return fileManager.removeFile(id);
};