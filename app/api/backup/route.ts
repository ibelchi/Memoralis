import { NextResponse } from "next/server";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), "dev.db");
    const mediaPath = path.join(process.cwd(), process.env.MEDIA_PATH || "media");

    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `memoralis-backup-${dateStr}.zip`;

    const archive = archiver("zip", {
      zlib: { level: 5 }, // Moderate compression
    });

    const passThrough = new PassThrough();
    
    // Convert Node.js stream to Web API ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk)));
        passThrough.on("end", () => controller.close());
        passThrough.on("error", (err) => controller.error(err));
      },
      cancel() {
        passThrough.destroy();
      }
    });

    // Pipe archive data to our PassThrough stream
    archive.pipe(passThrough);

    // Add db if exists
    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: "memoralis-backup/dev.db" });
    } else {
      console.warn("Database file not found for backup at:", dbPath);
    }

    // Add media if exists
    if (fs.existsSync(mediaPath)) {
      archive.directory(mediaPath, "memoralis-backup/media");
    } else {
      console.warn("Media directory not found for backup at:", mediaPath);
    }

    // Finalize the archive
    archive.finalize().catch((err) => {
      console.error("Archive finalization error:", err);
    });

    return new NextResponse(readableStream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
