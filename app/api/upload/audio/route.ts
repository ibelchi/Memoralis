import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const artworkId = formData.get('artworkId') as string;

    if (!file || !artworkId) {
      return NextResponse.json({ error: 'Missing file or artworkId' }, { status: 400 });
    }

    const description = formData.get('description') as string;

    // Validation: audio/mpeg, audio/mp4, audio/wav, audio/m4a
    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/m4a'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only MP3, MP4, WAV and M4A are allowed.' }, { status: 400 });
    }

    // Save to local storage
    const filePath = await saveFile(file, 'audios');

    // Create database record
    const audio = await prisma.audio.create({
      data: {
        filePath,
        artworkId,
        description: description || null,
      },
    });

    return NextResponse.json(audio);
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
  }
}
