import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        avatarPath: true,
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json({ error: "Error fetching authors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newAuthor = await prisma.author.create({
      data: {
        name,
        color: color || '#6366f1',
      },
    });

    return NextResponse.json(newAuthor);
  } catch (error) {
    console.error('Error creating author:', error);
    return NextResponse.json({ error: 'Failed to create author' }, { status: 500 });
  }
}
