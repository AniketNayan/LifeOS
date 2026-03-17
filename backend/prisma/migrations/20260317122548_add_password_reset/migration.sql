-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordTokenHash" TEXT;
