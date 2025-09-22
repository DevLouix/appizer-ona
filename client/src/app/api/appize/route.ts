import { NextRequest, NextResponse } from 'next/server';
import { AppBuildOrchestrator } from '@/lib/codespace-automation';

export async function POST(request: NextRequest) {
  try {
    const { config, buildParams, fileManifest, hasLocalAssets } = await request.json();
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    // Generate unique build ID
    const buildId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const CODESPACE_REPO = process.env.CODESPACE_REPO || 'https://github.com/DevLouix/appizer-ona.git';
    const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'devlouix/appizer:latest';
    
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Create build configuration with file handling
    const buildConfig = {
      platforms: buildParams?.platforms || ['android'],
      dockerImage: buildParams?.dockerImage || DOCKER_IMAGE,
      yamlConfig: config,
      buildType: buildParams?.buildType || 'release',
      skipErrors: buildParams?.skipErrors || false,
      fileManifest: fileManifest || {},
      hasLocalAssets: hasLocalAssets || false,
      buildId,
    };

    // Use the orchestrator for the build process
    const orchestrator = new AppBuildOrchestrator(GITHUB_TOKEN, CODESPACE_REPO);
    
    const result = await orchestrator.buildApp(buildConfig);
    
    return NextResponse.json({
      message: 'Build process completed',
      buildId,
      status: result.status,
      progress: result.progress,
      artifacts: result.artifacts,
      logs: result.logs,
      hasLocalAssets,
      fileManifest
    });

  } catch (error) {
    console.error('Appize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}