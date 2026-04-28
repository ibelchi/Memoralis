import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const artworks = await prisma.artwork.findMany({
      orderBy: {
        artDate: 'desc',
      },
      include: {
        images: true,
        audios: true,
        tags: true,
      },
    });
    return NextResponse.json(artworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, author, artDate } = body;

    if (!title || !author || !artDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const artwork = await prisma.artwork.create({
      data: {
        title,
        description,
        author,
        artDate: new Date(artDate),
      },
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch (error) {
    console.error('Error creating artwork:', error);
    return NextResponse.json({ error: 'Failed to create artwork' }, { status: 500 });
  }
}
