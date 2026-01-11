import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting test user seeding...");

  const password = await bcrypt.hash("password", 12);

  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      passwordHash: password,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create Supervisor user
  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@test.com" },
    update: {},
    create: {
      email: "supervisor@test.com",
      passwordHash: password,
      firstName: "Supervisor",
      lastName: "User",
      role: "SUPERVISOR",
      isActive: true,
    },
  });
  console.log("✅ Supervisor created:", supervisor.email);

  // Create Credit Officer A (will be assigned to multiple unions)
  const officerA = await prisma.user.upsert({
    where: { email: "officer.a@test.com" },
    update: {},
    create: {
      email: "officer.a@test.com",
      passwordHash: password,
      firstName: "Officer",
      lastName: "A",
      role: "CREDIT_OFFICER",
      isActive: true,
      supervisorId: supervisor.id,
    },
  });
  console.log("✅ Credit Officer A created:", officerA.email);

  // Create Credit Officer B (will be assigned to single union)
  const officerB = await prisma.user.upsert({
    where: { email: "officer.b@test.com" },
    update: {},
    create: {
      email: "officer.b@test.com",
      passwordHash: password,
      firstName: "Officer",
      lastName: "B",
      role: "CREDIT_OFFICER",
      isActive: true,
      supervisorId: supervisor.id,
    },
  });
  console.log("✅ Credit Officer B created:", officerB.email);

  console.log("\n🎉 Test users created successfully!");
  console.log("\n🔑 Test credentials (all use password: 'password'):");
  console.log("   Admin: admin@test.com");
  console.log("   Supervisor: supervisor@test.com");
  console.log("   Credit Officer A: officer.a@test.com");
  console.log("   Credit Officer B: officer.b@test.com");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
