import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import readline from "readline";

// Initialize Prisma with adapter (required in this project for SQLite)
const createPrismaClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined in .env file");
  }

  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const dbPath = url.startsWith("file:") ? url.slice(5) : url;
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  
  const adapter = new PrismaBetterSqlite3({ url: absolutePath });
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();
const MEDIA_PATH = "./media";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log("--- Neteja de fitxers orfes ---");
  
  const absoluteMediaPath = path.join(process.cwd(), MEDIA_PATH);
  
  try {
    // 1. Obtenir fitxers de la BD
    const [images, audios] = await Promise.all([
      prisma.image.findMany({ select: { filePath: true } }),
      prisma.audio.findMany({ select: { filePath: true } }),
    ]);

    const dbFiles = new Set([
      ...images.map(img => img.filePath),
      ...audios.map(aud => aud.filePath)
    ]);

    // 2. Identificar orfes
    const orphans: { fullPath: string, relativePath: string, size: number }[] = [];
    const folders = ["images", "audios"];

    for (const folder of folders) {
      const folderPath = path.join(absoluteMediaPath, folder);
      if (!fs.existsSync(folderPath)) continue;

      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        if (file.startsWith('.')) continue;
        
        const relativePath = path.join(folder, file).replace(/\\/g, "/");
        if (!dbFiles.has(relativePath)) {
          const fullPath = path.join(folderPath, file);
          const stats = fs.statSync(fullPath);
          orphans.push({ 
            fullPath, 
            relativePath, 
            size: stats.size 
          });
        }
      }
    }

    if (orphans.length === 0) {
      console.log("✅ No hi ha fitxers orfes per esborrar.");
      rl.close();
      return;
    }

    console.log(`S'han trobat ${orphans.length} fitxers orfes.`);
    
    // 3. Demanar confirmació
    rl.question(`⚠️ Esborrar ${orphans.length} fitxers orfes? (s/n): `, (answer) => {
      if (answer.toLowerCase() === 's') {
        let deletedCount = 0;
        let totalSize = 0;

        for (const orphan of orphans) {
          try {
            fs.unlinkSync(orphan.fullPath);
            totalSize += orphan.size;
            deletedCount++;
            console.log(`Esborrat: ${orphan.relativePath}`);
          } catch (err) {
            console.error(`Error esborrant ${orphan.fullPath}:`, err);
          }
        }

        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`\n✅ Neteja completada: ${deletedCount} fitxers esborrats, ${sizeMB} MB alliberats.`);
      } else {
        console.log("❌ Operació cancel·lada.");
      }
      rl.close();
    });

  } catch (error) {
    console.error("Error durant la neteja:", error);
    rl.close();
  } finally {
    await prisma.$disconnect();
  }
}

main();
