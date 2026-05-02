import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const authorName = formData.get('authorName') as string;

    if (!file || !authorName) {
      return NextResponse.json({ error: 'File and authorName are required' }, { status: 400 });
    }

    const relativePath = await saveFile(file, 'avatars');

    const updatedAuthor = await prisma.author.update({
      where: { name: authorName },
      data: { avatarPath: relativePath },
    });

    return NextResponse.json(updatedAuthor, { status: 200 });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Error uploading avatar' }, { status: 500 });
  }
}
