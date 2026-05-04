/*
  Warnings:

  - You are about to drop the column `created_at` on the `rate_limit` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `rate_limit` table. All the data in the column will be lost.
  - Added the required column `expire` to the `rate_limit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rate_limit" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
DROP COLUMN "expire",
ADD COLUMN     "expire" BIGINT NOT NULL;
