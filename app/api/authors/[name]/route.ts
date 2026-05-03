import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> | { name: string } }) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);
    const body = await request.json();
    const { color, newName } = body;

    if (newName && newName !== name) {
      // Check if the newName already exists
      const existingAuthor = await prisma.author.findUnique({
        where: { name: newName },
      });
      if (existingAuthor) {
        return NextResponse.json({ error: 'Aquest nom ja està en ús' }, { status: 409 });
      }

      const updateData: any = { name: newName };
      if (color) updateData.color = color;

      const [updatedAuthor] = await prisma.$transaction([
        prisma.author.update({ where: { name }, data: updateData }),
        prisma.artwork.updateMany({ where: { author: name }, data: { author: newName } })
      ]);

      return NextResponse.json(updatedAuthor);
    }

    if (color) {
      const updatedAuthor = await prisma.author.update({
        where: { name },
        data: { color },
      });
      return NextResponse.json(updatedAuthor);
    }

    return NextResponse.json({ error: 'No data provided to update' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating author:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Aquest nom ja està en ús' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
  }
}
