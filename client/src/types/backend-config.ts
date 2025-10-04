/**
 * Backend Configuration Types
 * Based on the actual lib/generator/default_config.yaml structure
 */

export interface BackendConfig {
  // Core Application Settings (Common to all platforms)
  app_name: string;
  package_name: string;
  author: string;
  url: string;

  // Platform-Specific Configurations
  platform_config: {
    android?: AndroidConfig;
    ios?: IOSConfig;
    linux?: LinuxConfig;
    windows?: WindowsConfig;
    macos?: MacOSConfig;
  };
}

export interface AndroidConfig {
  logo?: string;
  splash: {
    type: "color" | "image";
    content?: string;
    duration: number;
    background_color: string;
    text_color?: string;
  };
  webapp: {
    enable_javascript: boolean;
    allow_file_access: boolean;
    orientation: "portrait" | "landscape" | "auto";
    fullscreen: boolean;
    theme_color: string;
    user_agent?: string;
    built_in_zoom_controls: boolean;
    support_zoom: boolean;
  };
  build: {
    build_type: "debug" | "release";
    min_sdk_version: number;
    compile_sdk_version: number;
    target_sdk_version: number;
    build_tools_version: string;
    version_code: number;
    version_name: string;
    gradle_custom_configs?: Record<string, any>;
  };
  signing?: {
    keystore_file_in_container: string;
    keystore_password: string;
    key_alias: string;
    key_password: string;
  };
}

export interface IOSConfig {
  build: {
    target_os_version: string;
    build_scheme: string;
    bundle_identifier: string;
    version_string: string;
    build_number: number;
  };
  webapp: {
    enable_javascript: boolean;
    fullscreen: boolean;
    theme_color: string;
    user_agent?: string;
  };
  logo?: string;
  splash: {
    type: "color" | "image";
    content?: string;
    duration: number;
    background_color: string;
  };
}

export interface LinuxConfig {
  build: {
    architecture: "x64" | "x86" | "arm64";
    version: string;
    app_id: string;
    product_name: string;
    package_format: "deb" | "rpm" | "appimage" | "tar.gz";
  };
  webapp: {
    width: number;
    height: number;
    resizable: boolean;
    frameless: boolean;
    background_color: string;
    user_agent?: string;
  };
  icon?: string;
}

export interface WindowsConfig {
  build: {
    architecture: "x64" | "x86" | "arm64";
    version: string;
    app_id: string;
    product_name: string;
    output_format: "msi" | "exe" | "zip";
  };
  webapp: {
    width: number;
    height: number;
    resizable: boolean;
    frameless: boolean;
    background_color: string;
    user_agent?: string;
  };
  icon?: string;
}

export interface MacOSConfig {
  build: {
    architecture: "x64" | "arm64" | "universal";
    version: string;
    app_id: string;
    product_name: string;
    output_format: "dmg" | "pkg" | "zip";
  };
  webapp: {
    width: number;
    height: number;
    resizable: boolean;
    frameless: boolean;
    background_color: string;
    user_agent?: string;
  };
  icon?: string;
}

// Docker build request interface
export interface DockerBuildRequest {
  config: BackendConfig;
  platform: "all" | "android" | "ios" | "linux" | "windows" | "macos";
  skip_errors?: boolean;
  webapp_assets?: File[]; // For file uploads
}

// Docker build response interface
export interface DockerBuildResponse {
  success: boolean;
  message: string;
  build_id?: string;
  error?: string;
}

// Build status interface
export interface DockerBuildStatus {
  build_id: string;
  status: "queued" | "building" | "completed" | "failed";
  platform: string;
  logs: string[];
  artifacts?: {
    platform: string;
    filename: string;
    download_url: string;
    size: number;
  }[];
}
