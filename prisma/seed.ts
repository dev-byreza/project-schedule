import { prisma } from '../lib/prisma';
import 'dotenv/config';

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: [
          { title: 'Hello Prisma Postgres', content: 'First post in the database!', published: true },
          { title: 'Drafting new ideas', content: 'Work in progress...' },
        ],
      },
    },
  });
  console.log('Seeded user:', user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

