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
      const stats = await fs.stat(fullPath);
      const fileSize = stats.size;
      const range = request.headers.get('range');
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Accept-Ranges', 'bytes');

      // Add Cache-Control for images
      if (contentType.startsWith('image/')) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        // Handle invalid ranges
        if (start >= fileSize || end >= fileSize) {
          headers.set('Content-Range', `bytes */${fileSize}`);
          return new Response(null, { status: 416, headers });
        }

        const file = await fs.open(fullPath, 'r');
        const buffer = Buffer.alloc(chunksize);
        await file.read(buffer, 0, chunksize, start);
        await file.close();

        headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        headers.set('Content-Length', chunksize.toString());

        return new Response(buffer, {
          status: 206,
          headers,
        });
      } else {
        const fileBuffer = await fs.readFile(fullPath);
        headers.set('Content-Length', fileSize.toString());
        return new Response(fileBuffer, {
          status: 200,
          headers,
        });
      }
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
