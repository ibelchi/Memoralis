import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json({ error: "Error fetching authors" }, { status: 500 });
  }
}
