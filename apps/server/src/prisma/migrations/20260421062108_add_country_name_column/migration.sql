/*
  Warnings:

  - Added the required column `country_name` to the `profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "country_name" TEXT NOT NULL;
