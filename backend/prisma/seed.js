import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await prisma.drillAttendance.deleteMany({});
    await prisma.maintenanceTask.deleteMany({});
    await prisma.safetyDrill.deleteMany({});
    await prisma.ship.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create users
    const hashedPassword = await bcryptjs.hash('password123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@maritime.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    const crew1 = await prisma.user.create({
      data: {
        email: 'crew1@maritime.com',
        password: hashedPassword,
        role: 'CREW'
      }
    });

    const crew2 = await prisma.user.create({
      data: {
        email: 'crew2@maritime.com',
        password: hashedPassword,
        role: 'CREW'
      }
    });

    const crew3 = await prisma.user.create({
      data: {
        email: 'crew3@maritime.com',
        password: hashedPassword,
        role: 'CREW'
      }
    });

    console.log('✅ Created 4 users');

    // Create ships
    const ship1 = await prisma.ship.create({
      data: { name: 'MS Pacific Explorer' }
    });

    const ship2 = await prisma.ship.create({
      data: { name: 'SS Atlantic Navigator' }
    });

    const ship3 = await prisma.ship.create({
      data: { name: 'MV Indian Ocean' }
    });

    console.log('✅ Created 3 ships');

    // Create maintenance tasks
    const maintenance1 = await prisma.maintenanceTask.create({
      data: {
        shipId: ship1.id,
        title: 'Engine Oil Change',
        description: 'Regular engine oil replacement',
        status: 'COMPLETED',
        dueDate: new Date('2026-05-20'),
        completedDate: new Date('2026-05-15'),
        createdBy: admin.id
      }
    });

    const maintenance2 = await prisma.maintenanceTask.create({
      data: {
        shipId: ship1.id,
        title: 'Hull Inspection',
        description: 'Inspect hull for corrosion',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-06-01'),
        createdBy: admin.id
      }
    });

    const maintenance3 = await prisma.maintenanceTask.create({
      data: {
        shipId: ship2.id,
        title: 'Propeller Check',
        description: 'Check propeller alignment',
        status: 'PENDING',
        dueDate: new Date('2026-06-15'),
        createdBy: admin.id
      }
    });

    const maintenance4 = await prisma.maintenanceTask.create({
      data: {
        shipId: ship2.id,
        title: 'Radar System Test',
        description: 'Test navigation radar',
        status: 'COMPLETED',
        dueDate: new Date('2026-05-10'),
        completedDate: new Date('2026-05-10'),
        createdBy: admin.id
      }
    });

    console.log('✅ Created 4 maintenance tasks');

    // Create safety drills
    const drill1 = await prisma.safetyDrill.create({
      data: {
        shipId: ship1.id,
        title: 'Fire Drill',
        description: 'Emergency evacuation fire drill',
        scheduledDate: new Date('2026-05-25'),
        status: 'COMPLETED',
        createdBy: admin.id
      }
    });

    const drill2 = await prisma.safetyDrill.create({
      data: {
        shipId: ship1.id,
        title: 'Life Jacket Drill',
        description: 'Life jacket deployment and safety',
        scheduledDate: new Date('2026-06-10'),
        status: 'SCHEDULED',
        createdBy: admin.id
      }
    });

    const drill3 = await prisma.safetyDrill.create({
      data: {
        shipId: ship2.id,
        title: 'Man Overboard Drill',
        description: 'Man overboard recovery procedures',
        scheduledDate: new Date('2026-05-30'),
        status: 'COMPLETED',
        createdBy: admin.id
      }
    });

    console.log('✅ Created 3 safety drills');

    // Create drill attendance
    await prisma.drillAttendance.create({
      data: {
        drillId: drill1.id,
        crewId: crew1.id,
        attended: true
      }
    });

    await prisma.drillAttendance.create({
      data: {
        drillId: drill1.id,
        crewId: crew2.id,
        attended: true
      }
    });

    await prisma.drillAttendance.create({
      data: {
        drillId: drill1.id,
        crewId: crew3.id,
        attended: false
      }
    });

    await prisma.drillAttendance.create({
      data: {
        drillId: drill2.id,
        crewId: crew1.id,
        attended: true
      }
    });

    await prisma.drillAttendance.create({
      data: {
        drillId: drill3.id,
        crewId: crew1.id,
        attended: true
      }
    });

    await prisma.drillAttendance.create({
      data: {
        drillId: drill3.id,
        crewId: crew2.id,
        attended: true
      }
    });

    await prisma.drillAttendance.create({
      data: {
        drillId: drill3.id,
        crewId: crew3.id,
        attended: true
      }
    });

    console.log('✅ Created drill attendance records');

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Test Credentials:');
    console.log('- Admin: admin@maritime.com / password123');
    console.log('- Crew 1: crew1@maritime.com / password123');
    console.log('- Crew 2: crew2@maritime.com / password123');
    console.log('- Crew 3: crew3@maritime.com / password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
