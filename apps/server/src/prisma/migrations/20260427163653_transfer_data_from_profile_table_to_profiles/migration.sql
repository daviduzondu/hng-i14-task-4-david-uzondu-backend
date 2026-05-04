INSERT INTO profiles (
  id,
  name,
  gender,
  gender_probability,
  age,
  age_group,
  country_id,
  country_probability,
  country_name,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  gender,
  gender_probability,
  age,
  age_group,
  country_id,
  country_probability,
  country_name,
  created_at,
  updated_at
FROM profile;