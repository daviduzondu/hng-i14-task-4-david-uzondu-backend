import { db } from "@/db/db";
import type { AgeGroup, DB, Gender } from "@/db/generated/types";
import type { profileQuerySchema } from "@/schema/profile.schema";
// import type {
//   AgifyResponse,
//   GenderizeResponse,
//   NationalizeResponse,
// } from "@/misc/types";
import { sql, type ValueExpression } from "kysely";
import type z from "zod";
import { countries } from "@/lookup/country-code.lookup.json";

export const findProfileById = async (id: string) =>
  await db
    .selectFrom("profiles")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow();

export const deleteProfileById = async (id: string) =>
  await db
    .deleteFrom("profiles")
    .where("id", "=", id)
    .returning(["id"])
    .executeTakeFirstOrThrow();

export const findProfileByName = async (name: string) =>
  await db
    .selectFrom("profiles")
    .where((eb) => eb(sql`LOWER(TRIM(name))`, "=", name.toLowerCase().trim()))
    .selectAll()
    .executeTakeFirst();

export const createNewProfile = async ({
  age,
  name,
  country,
  gender,
  gender_probability,
  country_probability,
}: {
  age: number;
  name: string;
  country: string;
  gender: Gender;
  gender_probability?: number;
  country_probability?: number;
}) =>
  await db
    .insertInto("profiles")
    .values({
      age: age,
      age_group: ((age: number): ValueExpression<DB, "profiles", AgeGroup> => {
        if (age <= 12) return "child";
        if (age <= 19) return "teenager";
        if (age <= 59) return "adult";
        return "senior";
      })(age),
      country_id: country.toUpperCase(),
      country_name: (() => {
        const name = countries.find((c) => c.code === country).name;
        if (name) return name;
        else throw new Error("Could not match country with given ID");
      })(),
      country_probability: country_probability ?? 1,
      gender: gender,
      gender_probability: gender_probability ?? 1,
      name: name,
    })
    .returningAll()
    .executeTakeFirst();

export const filterProfiles = async (
  query: z.infer<typeof profileQuerySchema> & { offset?: number },
) =>
  await db
    .selectFrom("profiles")
    .$if(!!query.gender, (qb) =>
      qb.where((eb) =>
        eb(sql`LOWER(gender::text)`, "=", query.gender.toLowerCase().trim()),
      ),
    )
    .$if(!!query.country_id, (qb) =>
      qb.where((eb) =>
        eb(
          sql`LOWER(country_id::text)`,
          "=",
          query.country_id.toLowerCase().trim(),
        ),
      ),
    )
    .$if(!!query.age_group, (qb) =>
      qb.where((eb) =>
        eb(
          sql`LOWER(age_group::text)`,
          "=",
          query.age_group.toLowerCase().trim(),
        ),
      ),
    )
    .$if(!!query.min_age, (qb) => qb.where("age", ">=", query.min_age))
    .$if(!!query.max_age, (qb) => qb.where("age", "<=", query.max_age))
    .$if(!!query.min_country_probability, (qb) =>
      qb.where("country_probability", ">=", query.min_country_probability),
    )
    .$if(!!query.min_gender_probability, (qb) =>
      qb.where("gender_probability", ">=", query.min_gender_probability),
    )
    .$if(!!query.sort_by, (qb) =>
      qb.orderBy(query.sort_by, query.order ?? "asc"),
    )
    .$if(!!query.page, (qb) => qb.offset(query.offset).limit(query.limit))
    .$if(!!query.limit, (qb) => qb.limit(query.limit))
    .selectAll()
    .select(({ eb }) => [eb.fn.count("id").over().as("total")])
    .execute();
