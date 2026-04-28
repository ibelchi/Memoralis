import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/tags/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tag.delete({ 
      where: { id: params.id } 
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Error deleting tag" }, { status: 500 });
  }
}
