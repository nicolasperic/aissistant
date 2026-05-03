import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create yearly goal
  const yearlyGoal = await prisma.goal.create({
    data: {
      title: "Earn All 4 Adobe Commerce Certifications",
      description: "Complete all four Adobe Commerce certification exams by end of year",
      type: "YEARLY",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      category: "certification",
      progress: 0,
    },
  });

  // Create quarterly goals
  const q1Goal = await prisma.goal.create({
    data: {
      title: "Pass Adobe Commerce Business Practitioner",
      description: "Study and pass the AD0-E708 exam",
      type: "QUARTERLY",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
      category: "certification",
      parentId: yearlyGoal.id,
      progress: 0,
    },
  });

  const q2Goal = await prisma.goal.create({
    data: {
      title: "Pass Adobe Commerce Developer Professional",
      description: "Study and pass the AD0-E724 exam",
      type: "QUARTERLY",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-06-30"),
      category: "certification",
      parentId: yearlyGoal.id,
      progress: 0,
    },
  });

  const q3Goal = await prisma.goal.create({
    data: {
      title: "Pass Adobe Commerce Front-End Developer",
      description: "Study and pass the AD0-E726 exam",
      type: "QUARTERLY",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-09-30"),
      category: "certification",
      parentId: yearlyGoal.id,
      progress: 0,
    },
  });

  const q4Goal = await prisma.goal.create({
    data: {
      title: "Pass Adobe Commerce Architect Master",
      description: "Study and pass the AD0-E722 exam",
      type: "QUARTERLY",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-12-31"),
      category: "certification",
      parentId: yearlyGoal.id,
      progress: 0,
    },
  });

  // Create monthly goal for current month
  const monthlyGoal = await prisma.goal.create({
    data: {
      title: "Complete Adobe Commerce Business Practitioner Study Guide",
      description: "Work through all modules of the official study guide",
      type: "MONTHLY",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-02-28"),
      category: "certification",
      parentId: q1Goal.id,
      progress: 0,
    },
  });

  // Create a weekly goal
  const weeklyGoal = await prisma.goal.create({
    data: {
      title: "Complete Module 1-3 of Study Guide",
      description: "Cover commerce fundamentals and catalog management",
      type: "WEEKLY",
      startDate: new Date("2026-02-09"),
      endDate: new Date("2026-02-15"),
      category: "certification",
      parentId: monthlyGoal.id,
      progress: 0,
    },
  });

  // Create some sample tasks
  const tasks = [
    {
      title: "Read Module 1: Commerce Fundamentals",
      description: "Cover architecture overview and deployment",
      priority: "HIGH" as const,
      scheduledDate: new Date("2026-02-10"),
      estimatedMinutes: 90,
      goalId: weeklyGoal.id,
    },
    {
      title: "Practice Module 1 Quiz Questions",
      priority: "MEDIUM" as const,
      scheduledDate: new Date("2026-02-10"),
      estimatedMinutes: 30,
      goalId: weeklyGoal.id,
    },
    {
      title: "Read Module 2: Catalog Management",
      description: "Product types, attributes, and categories",
      priority: "HIGH" as const,
      scheduledDate: new Date("2026-02-11"),
      estimatedMinutes: 90,
      goalId: weeklyGoal.id,
    },
    {
      title: "Read Module 3: Merchandising & Pricing",
      priority: "HIGH" as const,
      scheduledDate: new Date("2026-02-12"),
      estimatedMinutes: 90,
      goalId: weeklyGoal.id,
    },
    {
      title: "Review & make flashcards for modules 1-3",
      priority: "MEDIUM" as const,
      scheduledDate: new Date("2026-02-13"),
      estimatedMinutes: 45,
      goalId: weeklyGoal.id,
    },
    {
      title: "Take practice exam for covered topics",
      priority: "HIGH" as const,
      scheduledDate: new Date("2026-02-14"),
      estimatedMinutes: 60,
      goalId: weeklyGoal.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  // Create certification exam events
  const certEvents = [
    {
      title: "Adobe Commerce Business Practitioner Exam (AD0-E708)",
      description: "First certification exam - business practitioner level",
      eventDate: new Date("2026-03-20"),
      category: "certification",
    },
    {
      title: "Adobe Commerce Developer Professional Exam (AD0-E724)",
      description: "Developer professional certification",
      eventDate: new Date("2026-06-15"),
      category: "certification",
    },
    {
      title: "Adobe Commerce Front-End Developer Exam (AD0-E726)",
      description: "Front-end developer specialization",
      eventDate: new Date("2026-09-10"),
      category: "certification",
    },
    {
      title: "Adobe Commerce Architect Master Exam (AD0-E722)",
      description: "Master-level architecture certification",
      eventDate: new Date("2026-12-05"),
      category: "certification",
    },
  ];

  for (const event of certEvents) {
    await prisma.event.create({ data: event });
  }

  // Initialize user stats
  await prisma.userStats.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
  });

  console.log("Seed data created successfully!");
  console.log(`- 1 yearly certification goal with 4 quarterly sub-goals`);
  console.log(`- 1 monthly and 1 weekly goal`);
  console.log(`- ${tasks.length} sample tasks`);
  console.log(`- ${certEvents.length} certification exam events`);
  console.log(`- User stats initialized`);
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
