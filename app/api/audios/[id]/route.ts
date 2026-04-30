import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { description } = await request.json();

    const data: any = {};
    if (description !== undefined) data.description = description;

    const audio = await prisma.audio.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(audio);
  } catch (error) {
    console.error("Error updating audio:", error);
    return NextResponse.json({ error: "Error updating audio" }, { status: 500 });
  }
}
