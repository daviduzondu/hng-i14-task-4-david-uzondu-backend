-- CreateIndex
CREATE INDEX "profiles_gender_idx" ON "profiles"("gender");

-- CreateIndex
CREATE INDEX "profiles_age_idx" ON "profiles"("age");

-- CreateIndex
CREATE INDEX "profiles_country_name_idx" ON "profiles"("country_name");

-- CreateIndex
CREATE INDEX "profiles_gender_age_country_name_idx" ON "profiles"("gender", "age", "country_name");
