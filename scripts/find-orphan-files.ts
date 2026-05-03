import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

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

async function main() {
  console.log("--- Diagnòstic de fitxers orfes ---");
  
  const absoluteMediaPath = path.join(process.cwd(), MEDIA_PATH);
  
  // 1. Obtenir tots els filePath de la BD (Image i Audio)
  try {
    const [images, audios] = await Promise.all([
      prisma.image.findMany({ select: { filePath: true } }),
      prisma.audio.findMany({ select: { filePath: true } }),
    ]);

    const dbFiles = new Set([
      ...images.map(img => img.filePath),
      ...audios.map(aud => aud.filePath)
    ]);

    console.log(`Fitxers registrats a la base de dades: ${dbFiles.size}`);

    // 2. Escanejar el disc
    const orphans: string[] = [];
    const folders = ["images", "audios"];

    for (const folder of folders) {
      const folderPath = path.join(absoluteMediaPath, folder);
      if (!fs.existsSync(folderPath)) {
        console.log(`La carpeta ${folderPath} no existeix.`);
        continue;
      }

      const files = fs.readdirSync(folderPath);
      let folderCount = 0;
      
      for (const file of files) {
        // Ignorem fitxers ocults (com .DS_Store)
        if (file.startsWith('.')) continue;

        // Construïm el path tal com es guarda a la BD: "images/nom.jpg" o "audios/nom.mp3"
        const relativePath = path.join(folder, file).replace(/\\/g, "/");
        
        if (!dbFiles.has(relativePath)) {
          orphans.push(path.join(folder, file));
        }
        folderCount++;
      }
      console.log(`Escanejats ${folderCount} fitxers a /${folder}`);
    }

    // 3. Informar
    console.log("\n-----------------------------------");
    if (orphans.length === 0) {
      console.log("✅ No s'han trobat fitxers orfes.");
    } else {
      console.log(`❌ S'han trobat ${orphans.length} fitxers orfes:`);
      orphans.forEach(p => console.log(` - ${p}`));
      console.log("\nExecuta 'npx ts-node scripts/clean-orphan-files.ts' per esborrar-los.");
    }
    console.log("-----------------------------------\n");

  } catch (error) {
    console.error("Error durant el diagnòstic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
