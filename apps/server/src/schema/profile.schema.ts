import { AgeGroup } from "@/db/generated/types";
import { z } from "zod";

// enum Gender {
//  female = "female",
//  male = "male",
// }

export const profileQuerySchema = z
  .object({
    gender: z
      .enum(["male", "female"], {
        error: "gender must be 'female' or 'male'",
      })
      .optional(),

    country_id: z
      .string({
        error: "country_id must be a string",
      })
      .optional(),

    age_group: z.enum(AgeGroup).optional(),

    min_age: z.coerce
      .number({
        error: "min_age must be a number",
      })
      .int({ error: "min_age must be an integer" })
      .min(0, { error: "min_age cannot be negative" })
      .optional(),

    max_age: z.coerce
      .number({
        error: "max_age must be a number",
      })
      .int({ error: "max_age must be an integer" })
      .min(0, { error: "max_age cannot be negative" })
      .optional(),

    min_gender_probability: z.coerce
      .number({
        error: "min_gender_probability must be a number",
      })
      .min(0, { error: "min_gender_probability must be >= 0" })
      .max(1, { error: "min_gender_probability must be <= 1" })
      .optional(),

    min_country_probability: z.coerce
      .number({
        error: "min_country_probability must be a number",
      })
      .min(0, { error: "min_country_probability must be >= 0" })
      .max(1, { error: "min_country_probability must be <= 1" })
      .optional(),

    sort_by: z
      .enum(["age", "created_at", "gender_probability"], {
        error: "sort_by must be one of: age, created_at, gender_probability",
      })
      .optional(),

    order: z
      .enum(["asc", "desc"], {
        error: "order must be either 'asc' or 'desc'",
      })
      .default("asc")
      .optional(),

    page: z.coerce
      .number({
        error: "page must be a number",
      })
      .int({ error: "page must be an integer" })
      .min(1, { error: "page must be >= 1" })
      .default(1)
      .optional(),

    limit: z.coerce
      .number({
        error: "limit must be a number",
      })
      .int({ error: "limit must be an integer" })
      .min(1, { error: "limit must be >= 1" })
      .max(50, { error: "limit cannot exceed 50" })
      .default(10)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.min_age !== undefined && data.max_age !== undefined) {
        return data.max_age >= data.min_age;
      }
      return true;
    },
    {
      message: "max_age cannot be lower than min_age",
      path: ["max_age"],
    },
  );

export const profileSearchSchema = z.object({
  q: z
    .string({ error: "Your search query must have at least 5 characters" })
    .min(5, { error: "Your search query must have at least 5 characters" }),
  page: z.coerce
    .number({
      error: "page must be a number",
    })
    .int({ error: "page must be an integer" })
    .min(1, { error: "page must be >= 1" })
    .default(1),

  limit: z.coerce
    .number({
      error: "limit must be a number",
    })
    .int({ error: "limit must be an integer" })
    .min(1, { error: "limit must be >= 1" })
    .max(50, { error: "limit cannot exceed 50" })
    .default(10),
});

export const exportProfilesSchema = profileQuerySchema.extend({
  format: z.enum(["csv"]),
});
