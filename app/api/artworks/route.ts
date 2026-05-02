import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const author = searchParams.get('author');
    const tag = searchParams.get('tag');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = { deletedAt: null, AND: [] };

    if (q) {
      where.AND.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { tags: { some: { name: { contains: q } } } },
        ],
      });
    }

    if (author) {
      where.AND.push({ author: { equals: author } });
    }

    if (tag) {
      where.AND.push({ tags: { some: { name: { equals: tag } } } });
    }

    if (dateFrom || dateTo) {
      where.AND.push({
        artDate: {
          gte: dateFrom ? new Date(dateFrom) : undefined,
          lte: dateTo ? new Date(dateTo) : undefined,
        },
      });
    }

    // Si no hi ha filtres, el array AND estarà buit, però mantenim deletedAt
    const finalWhere = where.AND.length > 0 ? where : { deletedAt: null };

    const artworks = await prisma.artwork.findMany({
      where: finalWhere,
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
    // Si veus un error aquí després d'una migració, reinicia el servidor 'npm run dev'
    console.error('Error fetching artworks:', error);
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const { title, description, author, artDate, tags } = await request.json();

    if (!author || !artDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const artwork = await prisma.artwork.create({
      data: {
        title: title || null,
        description,
        author,
        artDate: new Date(artDate),
        tags: {
          connectOrCreate: (tags ?? []).map((name: string) => ({
            where: { name: name.trim().toLowerCase() },
            create: { name: name.trim().toLowerCase() },
          })),
        },
      },
      include: { images: true, audios: true, tags: true },
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch (error) {
    console.error("Error creating artwork:", error);
    return NextResponse.json({ error: "Error creating artwork" }, { status: 500 });
  }
}
