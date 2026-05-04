-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('female', 'male');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('child', 'teenager', 'adult', 'senior');

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "gender_probability" DOUBLE PRECISION NOT NULL,
    "sample_size" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "age_group" "AgeGroup" NOT NULL,
    "country_id" TEXT NOT NULL,
    "country_probability" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);
