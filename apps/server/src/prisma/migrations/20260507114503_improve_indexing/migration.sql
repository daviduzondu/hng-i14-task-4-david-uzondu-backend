-- DropIndex
DROP INDEX "profiles_country_name_gender_age_idx";

-- CreateIndex
CREATE INDEX "profiles_country_id_idx" ON "profiles"("country_id");

-- CreateIndex
CREATE INDEX "profiles_gender_idx" ON "profiles"("gender");

-- CreateIndex
CREATE INDEX "profiles_country_id_gender_age_idx" ON "profiles"("country_id", "gender", "age");
