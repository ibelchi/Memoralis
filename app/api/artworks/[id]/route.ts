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

// PATCH /api/artworks/[id] — actualitza tags (i en el futur, altres camps)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tags } = await request.json();

    const artwork = await prisma.artwork.update({
      where: { id: params.id },
      data: {
        tags: {
          set: [], // desconnecta tots els actuals
          connectOrCreate: (tags ?? []).map((name: string) => ({
            where: { name: name.trim().toLowerCase() },
            create: { name: name.trim().toLowerCase() },
          })),
        },
      },
      include: { tags: true },
    });

    return NextResponse.json(artwork);
  } catch (error) {
    console.error("Error updating artwork:", error);
    return NextResponse.json({ error: "Error updating artwork" }, { status: 500 });
  }
}
