// ---------- Example schema derived from your YAML-style config ----------

import type { FieldSchema } from "@/types/main";

// This schema will drive form rendering. You can replace or extend it at runtime.
export const exampleSchema: FieldSchema[] = [
  { key: "app_name", label: "App Name", type: "string", default: "DL-Aewc" },
  {
    key: "package_name",
    label: "Package Name",
    type: "string",
    default: "com.frodo.webviewapp",
  },
  { key: "author", label: "Author", type: "string", default: "Fredo" },
  {
    key: "url",
    label: "URL",
    type: "string",
    default: "https://www.google.com",
    hint: "Web URL to load, or leave empty to use local web assets",
  },
  {
    key: "web_assets",
    label: "Web Assets",
    type: "files",
    accept: ".html,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.ico,.json,.xml,.txt",
    hint: "Upload your web application files (HTML, CSS, JS, images, etc.). Only needed if URL is not specified.",
  },
  {
    key: "platform_config",
    label: "Platform Config",
    type: "object",
    fields: [
      {
        key: "android",
        label: "Android",
        type: "object",
        fields: [
          {
            key: "logo",
            label: "App Logo/Icon",
            type: "file",
            accept: ".png,.jpg,.jpeg,.svg",
            hint: "Upload app icon/logo image. Will be resized for different screen densities.",
          },
          {
            key: "splash",
            label: "Splash",
            type: "object",
            fields: [
              {
                key: "type",
                label: "Type",
                type: "select",
                options: ["color", "image"],
                default: "color",
              },
              {
                key: "content",
                label: "Splash Image",
                type: "file",
                accept: ".png,.jpg,.jpeg",
                hint: "Upload splash screen image (optional)",
              },
              {
                key: "duration",
                label: "Duration (ms)",
                type: "number",
                default: 1500,
              },
              {
                key: "background_color",
                label: "Background Color",
                type: "color",
                default: "#FFFFFF",
              },
              {
                key: "text_color",
                label: "Text Color",
                type: "color",
                default: "#000000",
              },
            ],
          },

          {
            key: "built_in_zoom_controls",
            label: "Built-in Zoom Controls",
            type: "boolean",
            default: false,
          },
          {
            key: "support_zoom",
            label: "Support Zoom",
            type: "boolean",
            default: false,
          },
        ],
      },
      {
        key: "build",
        label: "Build",
        type: "object",
        fields: [
          {
            key: "build_type",
            label: "Build Type",
            type: "select",
            options: ["debug", "release"],
            default: "release",
          },
          {
            key: "min_sdk_version",
            label: "Min SDK Version",
            type: "number",
            default: 21,
          },
          {
            key: "compile_sdk_version",
            label: "Compile SDK Version",
            type: "number",
            default: 34,
          },
          {
            key: "target_sdk_version",
            label: "Target SDK Version",
            type: "number",
            default: 34,
          },
          {
            key: "build_tools_version",
            label: "Build Tools Version",
            type: "string",
            default: "34.0.0",
          },
          {
            key: "version_code",
            label: "Version Code",
            type: "number",
            default: 1,
          },
          {
            key: "version_name",
            label: "Version Name",
            type: "string",
            default: "1.0.0",
          },
        ],
      },
      {
        key: "signing",
        label: "Signing",
        type: "object",
        fields: [
          {
            key: "keystore_file",
            label: "Keystore File",
            type: "file",
            accept: ".keystore,.jks,.p12",
            hint: "Upload Android keystore file for app signing",
          },
          {
            key: "keystore_password",
            label: "Keystore Password",
            type: "string",
            default: "YOUR_KEYSTORE_PASSWORD",
          },
          {
            key: "key_alias",
            label: "Key Alias",
            type: "string",
            default: "your_key_alias",
          },
          {
            key: "key_password",
            label: "Key Password",
            type: "string",
            default: "YOUR_KEYSTORE_PASSWORD",
          },
        ],
      },
    ],
  },

  // iOS
  {
    key: "ios",
    label: "iOS",
    type: "object",
    fields: [
      {
        key: "build",
        label: "Build",
        type: "object",
        fields: [
          {
            key: "target_os_version",
            label: "Target OS Version",
            type: "string",
            default: "14.0",
          },
          {
            key: "build_scheme",
            label: "Build Scheme",
            type: "string",
            default: "DefaultiOSApp",
          },
          {
            key: "bundle_identifier",
            label: "Bundle Identifier",
            type: "string",
            default: "com.default.iosapp",
          },
          {
            key: "version_string",
            label: "Version String",
            type: "string",
            default: "1.0.0",
          },
          {
            key: "build_number",
            label: "Build Number",
            type: "number",
            default: 1,
          },
        ],
      },
      {
        key: "logo",
        label: "App Icon",
        type: "file",
        accept: ".png,.jpg,.jpeg,.icns",
        hint: "Upload app icon for iOS",
      },
      {
        key: "splash",
        label: "Splash",
        type: "object",
        fields: [
          {
            key: "type",
            label: "Type",
            type: "select",
            options: ["color", "image"],
            default: "color",
          },
          {
            key: "content",
            label: "Splash Image",
            type: "file",
            accept: ".png,.jpg,.jpeg",
            hint: "Upload splash screen image for iOS",
          },
          {
            key: "duration",
            label: "Duration (ms)",
            type: "number",
            default: 1500,
          },
          {
            key: "background_color",
            label: "Background Color",
            type: "color",
            default: "#FFFFFF",
          },
        ],
      },
    ],
  }, // Linux (trimmed)
  {
    key: "linux",
    label: "Linux",
    type: "object",
    fields: [
      {
        key: "build",
        label: "Build",
        type: "object",
        fields: [
          {
            key: "architecture",
            label: "Architecture",
            type: "select",
            options: ["x64", "arm64"],
            default: "x64",
          },
          {
            key: "version",
            label: "Version",
            type: "string",
            default: "1.0.0",
          },
          {
            key: "app_id",
            label: "App ID",
            type: "string",
            default: "com.default.linuxapp",
          },
          {
            key: "product_name",
            label: "Product Name",
            type: "string",
            default: "Default Linux App",
          },
          {
            key: "package_format",
            label: "Package Format",
            type: "select",
            options: ["deb", "rpm"],
            default: "deb",
          },
        ],
      },
      {
        key: "icon",
        label: "App Icon",
        type: "file",
        accept: ".png,.jpg,.jpeg,.ico",
        hint: "Upload app icon for Linux desktop",
      },
    ],
  }, // Windows (trimmed)
  {
    key: "windows",
    label: "Windows",
    type: "object",
    fields: [
      {
        key: "build",
        label: "Build",
        type: "object",
        fields: [
          {
            key: "architecture",
            label: "Architecture",
            type: "select",
            options: ["x64", "x86"],
            default: "x64",
          },
          {
            key: "version",
            label: "Version",
            type: "string",
            default: "0.1.0",
          },
          {
            key: "app_id",
            label: "App ID",
            type: "string",
            default: "com.default.windowswebview",
          },
          {
            key: "product_name",
            label: "Product Name",
            type: "string",
            default: "Default Windows App",
          },
          {
            key: "output_format",
            label: "Output Format",
            type: "select",
            options: ["msi", "exe"],
            default: "msi",
          },
        ],
      },
      {
        key: "icon",
        label: "App Icon",
        type: "file",
        accept: ".png,.jpg,.jpeg,.ico",
        hint: "Upload app icon for Windows desktop",
      },
    ],
  }, // macOS (trimmed)
  {
    key: "macos",
    label: "macOS",
    type: "object",
    fields: [
      {
        key: "build",
        label: "Build",
        type: "object",
        fields: [
          {
            key: "architecture",
            label: "Architecture",
            type: "select",
            options: ["x64", "arm64"],
            default: "x64",
          },
          {
            key: "version",
            label: "Version",
            type: "string",
            default: "1.0.0",
          },
          {
            key: "app_id",
            label: "App ID",
            type: "string",
            default: "com.default.macosapp",
          },
          {
            key: "product_name",
            label: "Product Name",
            type: "string",
            default: "Default macOS App",
          },
          {
            key: "output_format",
            label: "Output Format",
            type: "select",
            options: ["dmg", "pkg"],
            default: "dmg",
          },
        ],
      },
      {
        key: "icon",
        label: "App Icon",
        type: "file",
        accept: ".png,.jpg,.jpeg,.icns",
        hint: "Upload app icon for macOS",
      },
    ],
  },
];
