/*
  Warnings:

  - The `expire` column on the `rate_limit` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "rate_limit" DROP COLUMN "expire",
ADD COLUMN     "expire" TIMESTAMP(3);
