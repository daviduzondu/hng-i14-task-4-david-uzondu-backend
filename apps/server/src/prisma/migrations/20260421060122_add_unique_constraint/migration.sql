/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `profile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "profile_id_key" ON "profile"("id");
