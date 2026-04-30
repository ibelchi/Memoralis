import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { unlink } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

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

    // Esborrar el fitxer del sistema d'arxius
    try {
      const filePath = path.join(process.cwd(), "public", image.filePath);
      await unlink(filePath);
    } catch (err) {
      console.error("Error en esborrar el fitxer físic de la imatge:", err);
      // Continuem per esborrar l'entrada a la base de dades encara que falli l'esborrat físic
    }

    // Esborrar la imatge de la base de dades
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminant imatge:", error);
    return NextResponse.json(
      { error: "Error en eliminar la imatge" },
      { status: 500 }
    );
  }
}
