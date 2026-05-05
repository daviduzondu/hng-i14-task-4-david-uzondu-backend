-- DropIndex
DROP INDEX "profiles_country_name_idx";

-- DropIndex
DROP INDEX "profiles_gender_age_country_name_idx";

-- DropIndex
DROP INDEX "profiles_gender_idx";

-- CreateIndex
CREATE INDEX "profiles_name_idx" ON "profiles"("name");

-- CreateIndex
CREATE INDEX "profiles_country_name_gender_age_idx" ON "profiles"("country_name", "gender", "age");
