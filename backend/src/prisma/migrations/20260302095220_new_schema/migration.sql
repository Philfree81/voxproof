/*
  Warnings:

  - The values [TRIALING] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `plan` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `proofs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `voice_records` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('RECORDING', 'PROCESSING', 'ANCHORED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE');
ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "proofs" DROP CONSTRAINT "proofs_recordId_fkey";

-- DropForeignKey
ALTER TABLE "voice_records" DROP CONSTRAINT "voice_records_userId_fkey";

-- DropIndex
DROP INDEX "subscriptions_stripeCustomerId_key";

-- DropIndex
DROP INDEX "subscriptions_userId_key";

-- DropIndex
DROP INDEX "users_walletAddress_key";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "plan",
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "walletAddress";

-- DropTable
DROP TABLE "proofs";

-- DropTable
DROP TABLE "voice_records";

-- DropEnum
DROP TYPE "SubscriptionPlan";

-- CreateTable
CREATE TABLE "voice_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "textSetIndex" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'RECORDING',
    "acousticHash" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "anchoredAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionId" TEXT,

    CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_sessions_acousticHash_key" ON "voice_sessions"("acousticHash");

-- CreateIndex
CREATE UNIQUE INDEX "voice_sessions_txHash_key" ON "voice_sessions"("txHash");

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
