import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from "fs/promises";
import path from "path";

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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Buscar l'àudio per obtenir el path del fitxer
    const audio = await prisma.audio.findUnique({
      where: { id },
    });

    if (!audio) {
      return NextResponse.json(
        { error: "Àudio no trobat" },
        { status: 404 }
      );
    }

    // Esborrar el fitxer del sistema d'arxius
    try {
      const filePath = path.join(process.cwd(), "public", audio.filePath);
      await unlink(filePath);
    } catch (err) {
      console.error("Error en esborrar el fitxer físic de l'àudio:", err);
      // Continuem per esborrar l'entrada a la base de dades encara que falli l'esborrat físic
    }

    // Esborrar l'àudio de la base de dades
    await prisma.audio.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminant àudio:", error);
    return NextResponse.json(
      { error: "Error en eliminar l'àudio" },
      { status: 500 }
    );
  }
}
