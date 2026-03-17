import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a demo user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: hashedPassword,
    },
  });

  // Create a sample goal
  const goal = await prisma.goal.upsert({
    where: { id: 'demo-goal-1' },
    update: {},
    create: {
      id: 'demo-goal-1',
      userId: user.id,
      title: 'Learn a New Programming Language',
      description: 'Master TypeScript and build a full-stack application',
      status: 'active',
      targetDate: new Date('2026-06-01'),
      contributionDays: 0,
    },
  });

  // Create milestones
  const milestone1 = await prisma.milestone.upsert({
    where: { id: 'demo-milestone-1' },
    update: {},
    create: {
      id: 'demo-milestone-1',
      goalId: goal.id,
      title: 'Complete TypeScript Fundamentals',
    },
  });

  const milestone2 = await prisma.milestone.upsert({
    where: { id: 'demo-milestone-2' },
    update: {},
    create: {
      id: 'demo-milestone-2',
      goalId: goal.id,
      title: 'Build a Full-Stack App',
    },
  });

  // Create short goals
  await prisma.shortGoal.upsert({
    where: { id: 'demo-shortgoal-1' },
    update: {},
    create: {
      id: 'demo-shortgoal-1',
      milestoneId: milestone1.id,
      title: 'Complete TypeScript course on Udemy',
      completed: true,
      estimatedTime: 480, // 8 hours
      priority: 'high',
    },
  });

  await prisma.shortGoal.upsert({
    where: { id: 'demo-shortgoal-2' },
    update: {},
    create: {
      id: 'demo-shortgoal-2',
      milestoneId: milestone1.id,
      title: 'Practice with 10 coding exercises',
      completed: false,
      estimatedTime: 240, // 4 hours
      priority: 'medium',
    },
  });

  // Create some sample tasks
  await prisma.task.upsert({
    where: { id: 'demo-task-1' },
    update: {},
    create: {
      id: 'demo-task-1',
      userId: user.id,
      goalId: goal.id,
      title: 'Review TypeScript documentation',
      date: new Date(),
      completed: false,
      priority: 'medium',
      estimatedTime: 60, // 1 hour
    },
  });

  await prisma.task.upsert({
    where: { id: 'demo-task-2' },
    update: {},
    create: {
      id: 'demo-task-2',
      userId: user.id,
      title: 'Plan next week\'s learning schedule',
      date: new Date(),
      completed: true,
      priority: 'high',
      estimatedTime: 30, // 30 minutes
    },
  });

  // Create a sample daily record
  await prisma.dailyRecord.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
      },
    },
    update: {},
    create: {
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      productivityScore: 8,
      workNotes: 'Had a productive day working on TypeScript fundamentals. Completed the Udemy course and started on exercises.',
      topTasks: [
        { id: 'demo-task-1', title: 'Review TypeScript documentation', completed: false },
        { id: 'demo-task-2', title: 'Plan next week\'s learning schedule', completed: true },
      ],
      deepWorkHours: 6.5,
      healthDone: true,
      distractionFree: true,
      personalThoughts: 'Feeling motivated to continue learning',
      lessonsLearned: 'Consistent practice is key to mastering new technologies',
      goalContributions: 2,
    },
  });

  console.log('Seed data created successfully');
  console.log('Demo user: demo@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });