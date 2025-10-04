/**
 * Backend Client for Docker Build Server
 * Handles communication with your actual lib backend
 */

import type {
  BackendConfig,
  DockerBuildRequest,
  DockerBuildResponse,
  DockerBuildStatus,
} from "../types/backend-config";

class BackendClient {
  private baseUrl: string;
  private timeout: number;
  private debugMode: boolean;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
    this.timeout = parseInt(
      process.env.NEXT_PUBLIC_BUILD_TIMEOUT || "300000",
      10,
    );
    this.debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";
  }

  /**
   * Start a build with your Docker backend
   */
  async startBuild(
    config: BackendConfig,
    platform: string,
    webappAssets?: File[],
  ): Promise<DockerBuildResponse> {
    try {
      if (this.debugMode) {
        console.log("Starting build with config:", config);
        console.log("Platform:", platform);
        console.log("Backend URL:", this.baseUrl);
      }

      const buildRequest: DockerBuildRequest = {
        config,
        platform: platform as any,
        skip_errors: false,
        webapp_assets: webappAssets,
      };

      // If webapp assets are provided, use FormData
      let body: string | FormData;
      const headers: Record<string, string> = {};

      if (webappAssets && webappAssets.length > 0) {
        const formData = new FormData();
        formData.append("config", JSON.stringify(config));
        formData.append("platform", platform);
        formData.append("skip_errors", "false");

        webappAssets.forEach((file, index) => {
          formData.append(`webapp_assets_${index}`, file);
        });

        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(buildRequest);
      }

      const response = await fetch(`${this.baseUrl}/build`, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error (${response.status}): ${errorText}`);
      }

      const result: DockerBuildResponse = await response.json();

      if (this.debugMode) {
        console.log("Build response:", result);
      }

      return result;
    } catch (error) {
      console.error("Build request failed:", error);
      throw error;
    }
  }

  /**
   * Get build status from your Docker backend
   */
  async getBuildStatus(buildId: string): Promise<DockerBuildStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/build/${buildId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Status check failed (${response.status}): ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Status check failed:", error);
      throw error;
    }
  }

  /**
   * Download build artifact
   */
  async downloadArtifact(buildId: string, platform: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseUrl}/build/${buildId}/download/${platform}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed (${response.status}): ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }

  /**
   * Upload webapp assets to backend
   */
  async uploadWebappAssets(
    files: File[],
  ): Promise<{ success: boolean; sessionId: string }> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  }

  /**
   * Get backend health status
   */
  async getHealth(): Promise<{
    status: string;
    version?: string;
    docker_available?: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }

  /**
   * Generate YAML config for debugging
   */
  generateYamlConfig(config: BackendConfig): string {
    // Convert the config to YAML format that your backend expects
    const yamlLines: string[] = [];

    yamlLines.push(`# Generated configuration for Docker backend`);
    yamlLines.push(`app_name: "${config.app_name}"`);
    yamlLines.push(`package_name: "${config.package_name}"`);
    yamlLines.push(`author: "${config.author}"`);
    yamlLines.push(`url: "${config.url}"`);
    yamlLines.push("");
    yamlLines.push("platform_config:");

    Object.entries(config.platform_config).forEach(
      ([platform, platformConfig]) => {
        if (platformConfig) {
          yamlLines.push(`  ${platform}:`);

          // Convert platform config to YAML
          const configStr = JSON.stringify(platformConfig, null, 4);
          const configLines = configStr.split("\n");
          configLines.forEach((line) => {
            if (line.trim()) {
              yamlLines.push(
                `    ${line.replace(/"/g, "").replace(/,$/g, "")}`,
              );
            }
          });
        }
      },
    );

    return yamlLines.join("\n");
  }

  /**
   * Test connection to backend
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (_error) {
      return false;
    }
  }
}

// Export singleton instance
export const backendClient = new BackendClient();
export default backendClient;
