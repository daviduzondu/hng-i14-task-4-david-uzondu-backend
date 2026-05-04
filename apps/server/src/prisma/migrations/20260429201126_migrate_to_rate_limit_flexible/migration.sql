/*
  Warnings:

  - The primary key for the `rate_limit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `event_time` on the `rate_limit` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `rate_limit` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `rate_limit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `rate_limit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expire` to the `rate_limit` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "rate_limit_id_key";

-- AlterTable
ALTER TABLE "rate_limit" DROP CONSTRAINT "rate_limit_pkey",
DROP COLUMN "event_time",
DROP COLUMN "id",
DROP COLUMN "session_id",
ADD COLUMN     "expire" BIGINT NOT NULL,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("key");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");
