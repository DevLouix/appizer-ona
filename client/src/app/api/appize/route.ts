import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    // Get environment variables for external server configuration
    const EXTERNAL_SERVER_URL = process.env.EXTERNAL_SERVER_URL;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const CODESPACE_REPO = process.env.CODESPACE_REPO || 'https://github.com/DevLouix/appizer-ona.git';
    
    if (!EXTERNAL_SERVER_URL) {
      return NextResponse.json(
        { error: 'External server URL not configured' },
        { status: 500 }
      );
    }

    // Submit configuration to external server
    const response = await fetch(`${EXTERNAL_SERVER_URL}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GITHUB_TOKEN && { 'Authorization': `Bearer ${GITHUB_TOKEN}` }),
      },
      body: JSON.stringify({
        config,
        repository: CODESPACE_REPO,
        action: 'create_codespace_and_deploy'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External server error:', errorText);
      return NextResponse.json(
        { error: `External server error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      message: 'Configuration submitted successfully',
      codespace_url: result.codespace_url,
      deployment_id: result.deployment_id,
      status: result.status
    });

  } catch (error) {
    console.error('Appize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}