import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        audios: true,
        tags: true,
      },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return NextResponse.json({ error: 'Failed to fetch artwork' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.artwork.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    // Handle case where artwork might not exist
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 });
  }
}

// PATCH /api/artworks/[id] — actualitza dades de l'obra
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description, author, artDate, tags, isFavorite } = await request.json();

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (author !== undefined) data.author = author;
    if (artDate !== undefined) data.artDate = artDate ? new Date(artDate) : undefined;
    if (isFavorite !== undefined) data.isFavorite = isFavorite;

    if (tags !== undefined) {
      data.tags = {
        set: [], // desconnecta tots els actuals
        connectOrCreate: (tags ?? []).map((name: string) => ({
          where: { name: name.trim().toLowerCase() },
          create: { name: name.trim().toLowerCase() },
        })),
      };
    }

    const artwork = await prisma.artwork.update({
      where: { id: params.id },
      data,
      include: { 
        images: true, 
        audios: true, 
        tags: true 
      },
    });

    return NextResponse.json(artwork);
  } catch (error) {
    console.error("Error updating artwork:", error);
    return NextResponse.json({ error: "Error updating artwork" }, { status: 500 });
  }
}

