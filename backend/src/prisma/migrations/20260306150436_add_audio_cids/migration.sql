-- AlterTable
ALTER TABLE "voice_sessions" ADD COLUMN     "audioCids" TEXT[],
ADD COLUMN     "audioUnpinAt" TIMESTAMP(3);
