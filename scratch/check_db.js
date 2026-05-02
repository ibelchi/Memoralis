const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

async function main() {
  const dbPath = path.join(process.cwd(), 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  const prisma = new PrismaClient({ adapter });

  const all = await prisma.artwork.findMany();
  console.log('Total artworks in DB:', all.length);
  console.log('Sample data:', all.map(a => ({ id: a.id, title: a.title, deletedAt: a.deletedAt })));
  
  const notDeleted = await prisma.artwork.findMany({ where: { deletedAt: null } });
  console.log('Artworks with deletedAt: null:', notDeleted.length);
  
  await prisma.$disconnect();
}

main().catch(console.error);
