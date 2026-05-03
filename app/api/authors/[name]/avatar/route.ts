import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> | { name: string } }) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const nameSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

    const publicAvatarsDir = path.join(process.cwd(), 'public', 'avatars');
    
    if (!existsSync(publicAvatarsDir)) {
      await mkdir(publicAvatarsDir, { recursive: true });
    }

    const fileName = `${nameSlug}.jpg`;
    const filePath = path.join(publicAvatarsDir, fileName);

    await writeFile(filePath, buffer);

    const avatarPath = `/avatars/${fileName}`;

    const updatedAuthor = await prisma.author.update({
      where: { name },
      data: { avatarPath },
    });

    return NextResponse.json({ avatarPath });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
