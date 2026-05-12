-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CREW');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DrillStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CREW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ships" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_tasks" (
    "id" SERIAL NOT NULL,
    "shipId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_drills" (
    "id" SERIAL NOT NULL,
    "shipId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "DrillStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_drills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drill_attendance" (
    "id" SERIAL NOT NULL,
    "drillId" INTEGER NOT NULL,
    "crewId" INTEGER NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drill_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "maintenance_tasks_shipId_idx" ON "maintenance_tasks"("shipId");

-- CreateIndex
CREATE INDEX "maintenance_tasks_createdBy_idx" ON "maintenance_tasks"("createdBy");

-- CreateIndex
CREATE INDEX "safety_drills_shipId_idx" ON "safety_drills"("shipId");

-- CreateIndex
CREATE INDEX "safety_drills_createdBy_idx" ON "safety_drills"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "drill_attendance_drillId_crewId_key" ON "drill_attendance"("drillId", "crewId");

-- CreateIndex
CREATE INDEX "drill_attendance_drillId_idx" ON "drill_attendance"("drillId");

-- CreateIndex
CREATE INDEX "drill_attendance_crewId_idx" ON "drill_attendance"("crewId");

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_drills" ADD CONSTRAINT "safety_drills_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_drills" ADD CONSTRAINT "safety_drills_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drill_attendance" ADD CONSTRAINT "drill_attendance_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "safety_drills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drill_attendance" ADD CONSTRAINT "drill_attendance_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
