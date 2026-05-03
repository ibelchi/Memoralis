import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Buscar la imatge per obtenir el path del fitxer
    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Imatge no trobada" },
        { status: 404 }
      );
    }

    // Esborrar la imatge de la base de dades
    await prisma.image.delete({
      where: { id },
    });

    // Esborrar el fitxer del sistema d'arxius
    const mediaPath = process.env.MEDIA_PATH || "./media";
    const fullPath = path.join(process.cwd(), mediaPath, image.filePath);
    try {
      await fs.unlink(fullPath);
    } catch (e) {
      // Si el fitxer ja no existeix, continua igualment
      console.warn("Fitxer no trobat al disc:", fullPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminant imatge:", error);
    return NextResponse.json(
      { error: "Error en eliminar la imatge" },
      { status: 500 }
    );
  }
}
