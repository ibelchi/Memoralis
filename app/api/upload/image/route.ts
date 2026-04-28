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

    // Validation: image/jpeg, image/png, image/webp
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG and WEBP are allowed.' }, { status: 400 });
    }

    // Save to local storage
    const filePath = await saveFile(file, 'images');

    // Create database record
    const image = await prisma.image.create({
      data: {
        filePath,
        artworkId,
        type: 'drawing', // default type
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
