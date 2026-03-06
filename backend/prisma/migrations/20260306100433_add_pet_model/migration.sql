/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PetStatus" AS ENUM ('LOST', 'FOUND', 'ADOPTABLE', 'ADOPTED', 'REUNITED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PetGender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- CreateTable
CREATE TABLE "Pet" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "type" VARCHAR(100) NOT NULL,
    "breed" VARCHAR(255),
    "color" VARCHAR(100),
    "gender" "PetGender" NOT NULL DEFAULT 'UNKNOWN',
    "age" INTEGER,
    "wellness" VARCHAR(255),
    "birthmark" TEXT,
    "imageUrl" VARCHAR(500),
    "imagePublicId" VARCHAR(255),
    "status" "PetStatus" NOT NULL DEFAULT 'LOST',
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "state" VARCHAR(255) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "village" VARCHAR(255),
    "addressLine" VARCHAR(500),
    "pincode" VARCHAR(20),
    "googleMapsLink" VARCHAR(500),
    "incidentDate" TIMESTAMP(3),
    "dateReported" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "adoptedById" INTEGER,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_adoptedById_fkey" FOREIGN KEY ("adoptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
