import { config } from 'dotenv';
config();
import { prisma } from './lib/prisma';

async function main() {
  await prisma.author.upsert({
    where: { name: 'Gala' },
    update: {},
    create: { name: 'Gala' },
  });
  
  await prisma.author.upsert({
    where: { name: 'Júlia' },
    update: {},
    create: { name: 'Júlia' },
  });
  
  console.log('Seeded authors: Gala, Júlia');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
