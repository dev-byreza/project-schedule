import { prisma } from '../lib/prisma';
import 'dotenv/config';

async function verify() {
  try {
    const users = await prisma.user.findMany({
      include: { posts: true },
    });
    console.log('Found users:', users.length);
    console.log('✅ Connected.');
  } catch (error) {
    console.error('❌ Connection error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
