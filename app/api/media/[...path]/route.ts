import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MEDIA_PATH = process.env.MEDIA_PATH || './media';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
};

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    // Join the path segments from the catch-all parameter
    const relativePath = path.join(...params.path);
    const fullPath = path.resolve(MEDIA_PATH, relativePath);

    // Security check: ensure the resolved path is still inside MEDIA_PATH
    const resolvedMediaPath = path.resolve(MEDIA_PATH);
    if (!fullPath.startsWith(resolvedMediaPath)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const headers = new Headers();
      headers.set('Content-Type', contentType);

      // Add Cache-Control for images
      if (contentType.startsWith('image/')) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }

      return new Response(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error serving media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
