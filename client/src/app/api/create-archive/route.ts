import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const { fileManifest, buildId } = await request.json();
    
    if (!fileManifest || !buildId) {
      return NextResponse.json(
        { error: 'File manifest and buildId are required' },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    
    // Add configuration file
    zip.file('build-config.json', JSON.stringify({
      buildId,
      timestamp: new Date().toISOString(),
      fileManifest
    }, null, 2));

    // Create a manifest of files that would be included
    const manifestContent = Object.entries(fileManifest)
      .map(([category, files]: [string, any]) => {
        return `${category.toUpperCase()}:\n${files.map((f: any) => `  - ${f.filename} (${f.size} bytes)`).join('\n')}`;
      })
      .join('\n\n');

    zip.file('file-manifest.txt', manifestContent);

    // In a real implementation, you would add the actual files here
    // For now, we'll create placeholder files
    for (const [category, files] of Object.entries(fileManifest)) {
      const categoryFiles = files as any[];
      for (const file of categoryFiles) {
        const placeholderContent = `# Placeholder for ${file.filename}\n# Category: ${category}\n# Size: ${file.size} bytes\n# Type: ${file.type}\n# Path: ${file.path}`;
        zip.file(`${category}/${file.filename}`, placeholderContent);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
    
    return new NextResponse(Buffer.from(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="build-${buildId}.zip"`,
      },
    });

  } catch (error) {
    console.error('Create archive error:', error);
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    );
  }
}