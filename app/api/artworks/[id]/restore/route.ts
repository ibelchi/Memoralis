import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.artwork.update({
      where: { id: params.id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ message: 'Artwork restored successfully' });
  } catch (error) {
    console.error('Error restoring artwork:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to restore artwork' }, { status: 500 });
  }
}
