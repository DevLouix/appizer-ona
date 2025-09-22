import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string;
    const buildId = formData.get('buildId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!category || !buildId) {
      return NextResponse.json(
        { error: 'Category and buildId are required' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', buildId, category);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = join(uploadDir, sanitizedName);

      await writeFile(filePath, buffer);
      
      uploadedFiles.push({
        filename: sanitizedName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        relativePath: join(buildId, category, sanitizedName),
      });
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      uploadDir,
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const buildId = searchParams.get('buildId');
  
  if (!buildId) {
    return NextResponse.json(
      { error: 'buildId is required' },
      { status: 400 }
    );
  }

  try {
    const uploadDir = join(process.cwd(), 'uploads', buildId);
    
    // In a real implementation, you would list the files in the directory
    // For now, return a simple response
    return NextResponse.json({
      buildId,
      uploadDir,
      message: 'Build files directory ready'
    });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Failed to get files' },
      { status: 500 }
    );
  }
}