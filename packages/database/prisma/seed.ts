import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mediumpublisher.com' },
    update: {},
    create: {
      email: 'admin@mediumpublisher.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);

  // Seed sample topics
  const topics = await Promise.all([
    prisma.topic.upsert({
      where: { id: 'topic_1' },
      update: {},
      create: {
        id: 'topic_1',
        title: 'Building Multi-Agent AI Systems with LangGraph',
        source: 'MANUAL',
        popularityScore: 92,
        category: 'Artificial Intelligence',
        keywordDifficulty: 45,
        engagementScore: 88,
        keywords: ['LangGraph', 'AI agents', 'multi-agent', 'LangChain'],
        status: 'APPROVED',
        userId: admin.id,
      },
    }),
    prisma.topic.upsert({
      where: { id: 'topic_2' },
      update: {},
      create: {
        id: 'topic_2',
        title: 'Node.js Microservices: From Monolith to Production',
        source: 'MANUAL',
        popularityScore: 85,
        category: 'Backend Development',
        keywordDifficulty: 38,
        engagementScore: 82,
        keywords: ['Node.js', 'microservices', 'Docker', 'Kubernetes'],
        status: 'APPROVED',
        userId: admin.id,
      },
    }),
    prisma.topic.upsert({
      where: { id: 'topic_3' },
      update: {},
      create: {
        id: 'topic_3',
        title: 'Remote Sensing with Python: A Practical Guide',
        source: 'MANUAL',
        popularityScore: 78,
        category: 'Data Science',
        keywordDifficulty: 32,
        engagementScore: 75,
        keywords: ['remote sensing', 'Python', 'GIS', 'satellite imagery'],
        status: 'PENDING',
        userId: admin.id,
      },
    }),
  ]);

  console.log(`✅ Created ${topics.length} sample topics`);

  // Seed a sample playlist
  const playlist = await prisma.playlist.upsert({
    where: { id: 'playlist_1' },
    update: {},
    create: {
      id: 'playlist_1',
      title: 'Node.js Microservices Playbook',
      description: 'A complete guide from monolith to production-ready microservices',
      category: 'Backend Development',
      userId: admin.id,
    },
  });

  console.log(`✅ Created sample playlist: ${playlist.title}`);
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
