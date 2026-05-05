import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtenim la data actual en format MM-DD
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const monthDay = `${month}-${day}`;
    const currentYear = today.getFullYear();

    // Query per trobar obres del mateix dia i mes d'anys anteriors
    // SQLite: strftime('%m-%d', artDate) funciona si artDate es guarda com a ISO string o timestamp.
    // Prisma a SQLite sol guardar ISO strings per defecte.
    const artworksResult: any[] = await prisma.$queryRaw`
      SELECT id FROM Artwork 
      WHERE strftime('%m-%d', artDate) = ${monthDay}
      AND strftime('%Y', artDate) < ${currentYear.toString()}
      AND deletedAt IS NULL
    `;

    const ids = artworksResult.map(a => a.id);
    
    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const artworks = await prisma.artwork.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        images: true,
        audios: true,
        tags: true,
      },
      orderBy: {
        artDate: 'desc'
      }
    });

    return NextResponse.json(artworks);
  } catch (error) {
    console.error('Error fetching on-this-day artworks:', error);
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}
