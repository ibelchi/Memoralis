import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags — llista tots els tags amb recompte d'obres
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { artworks: true } },
      },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Error fetching tags" }, { status: 500 });
  }
}

// POST /api/tags — crea un tag nou
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const tagName = name.trim().toLowerCase();
    
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        color: color ?? "#6366f1",
      },
    });
    
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Error creating tag" }, { status: 500 });
  }
}
