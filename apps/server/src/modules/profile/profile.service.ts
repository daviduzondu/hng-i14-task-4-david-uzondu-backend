import { AppError } from "@/errors/app.error";
import {
  bulkInsertProfiles,
  createNewProfile,
  deleteProfileById,
  filterProfiles,
  findProfileById,
  findProfileByName,
  findProfilesByNames,
} from "@/modules/profile/profile.repository";
import { catchAndThrowError, parseSearchQuery } from "@/misc/utils";
import {
  csvRowSchema,
  exportProfilesSchema,
  profileQuerySchema,
  profileSearchSchema,
} from "@/schema/profile.schema";
import type {
  AgifyResponse,
  ErrorResponse,
  GenderizeResponse,
  NationalizeResponse,
  SuccessResponse,
} from "@/misc/types";
import type { AxiosResponse } from "axios";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import z, { type TypeOf } from "zod";
import { NoResultError, type ValueExpression } from "kysely";
import { json2csv } from "json-2-csv";
import type { AgeGroup, DB, profiles } from "@/db/generated/types";
import type { Request } from "express";
import { type Busboy } from "busboy";
import { parse } from "csv-parse";
import { countries } from "@/lookup/country-code.lookup.json";
import { Readable } from "node:stream";
import { create } from "node:domain";
import { db } from "@/db/db";

type StandardServiceResponse<S = SuccessResponse, E = ErrorResponse> = Promise<{
  statusCode: number;
  body?: S | E;
}>;

const totalPages = <T extends { total: string | unknown }[]>({
  result,
  limit,
}: {
  result: T;
  limit: number;
}) => Math.ceil(Number(result[0]?.total ? result[0]?.total : 0) / limit);

const links = <T extends { total: string | unknown }[]>({
  result,
  limit,
  page,
}: {
  result: T;
  page: number;
  limit: number;
}) => ({
  self: `/api/profiles?page=${page}&limit=${limit}`,
  next:
    totalPages({ result, limit }) > page
      ? `/api/profiles?page=${page + 1}&limit=${limit}`
      : null,
  prev: page === 1 ? null : `/api/profiles?page=${page - 1}&limit=${limit}`,
});
export async function createProfile(name: string): StandardServiceResponse {
  const [genderRes, agifyRes, nationalizeRes]: [
    AxiosResponse<GenderizeResponse>,
    AxiosResponse<AgifyResponse>,
    AxiosResponse<NationalizeResponse>,
  ] = await Promise.all([
    axios.get(`https://api.genderize.io/?name=${name}`),
    axios.get(`https://api.agify.io/?name=${name}`),
    axios.get(`https://api.nationalize.io/?name=${name}`),
  ]);

  if (
    genderRes.status !== 200 ||
    agifyRes.status !== 200 ||
    nationalizeRes.status !== 200
  )
    throw new AppError({
      message: `${genderRes.status !== 200 ? "Genderize" : agifyRes.status !== 200 ? "Agify" : nationalizeRes.status !== 200 ? "Nationalize" : "classification"} returned an invalide response`,
      code: 502,
    });

  const existingUser = await findProfileByName(name);
  delete existingUser?.updated_at;

  if (existingUser) {
    return {
      statusCode: StatusCodes.OK,
      body: {
        message: "Profle already exists",
        data: existingUser,
        status: "success",
      },
    };
  }

  if (
    genderRes.data.count === 0 ||
    genderRes.data.gender === null ||
    !agifyRes.data.age ||
    nationalizeRes.data.country.length === 0
  ) {
    return {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      body: {
        status: "error",
        message: "No prediction available for the provided name",
      },
    };
  }
  const newProfile = await createNewProfile({
    age: agifyRes.data.age,
    // count: agifyRes.data.count,
    country: nationalizeRes.data.country.reduce((a, b) =>
      a.probability > b.probability ? a : b,
    ).country_id,
    gender: genderRes.data.gender,
    name,
    gender_probability: genderRes.data.probability,
    country_probability: Math.max(
      ...nationalizeRes.data.country.map((c) => c.probability),
    ),
  });
  delete newProfile.updated_at;

  return {
    statusCode: StatusCodes.CREATED,
    body: {
      status: "success",
      data: newProfile,
    },
  };
}

export async function searchProfiles(
  payload: z.infer<typeof profileSearchSchema>,
): StandardServiceResponse {
  const parsedPayload = z.parse(profileSearchSchema, payload);
  const query = parseSearchQuery(parsedPayload.q);
  const offset = (parsedPayload.page - 1) * Number(parsedPayload.limit);

  if (Object.values(query).every((entry) => entry === null))
    return {
      body: {
        status: "error",
        message: "Unable to interpret query",
      },
      statusCode: StatusCodes.BAD_REQUEST,
    };

  const result = await filterProfiles({
    ...query,
    limit: parsedPayload.limit,
    page: parsedPayload.page,
    offset: offset,
  });

  return {
    body: {
      // count: result.length,
      page: parsedPayload.page,
      limit: parsedPayload.limit,
      total: Number(result[0]?.total ? result[0]?.total : 0),
      total_pages: totalPages({ result, limit: parsedPayload.limit }),
      links: links({
        result,
        limit: parsedPayload.limit,
        page: parsedPayload.page,
      }),
      data: result.map((r) => ({
        age: r.age,
        age_group: r.age_group,
        country_id: r.country_id,
        id: r.id,
        name: r.name,
        gender: r.gender,
        created_at: r.created_at,
        gender_probability: r.gender_probability,
        country_probability: r.country_probability,
        country_name: r.country_name,
      })),
      status: "success",
    },
    statusCode: StatusCodes.OK,
  };
}

export async function getProfileById(id: string): StandardServiceResponse {
  const result = await catchAndThrowError(() => findProfileById(id), {
    noResult: {
      errorClass: NoResultError,
      code: StatusCodes.NOT_FOUND,
      message: "Failed to get profile",
    },
  });
  delete result.updated_at;

  return {
    body: {
      data: result,
      status: "success",
    },
    statusCode: StatusCodes.OK,
  };
}

export async function getProfiles(
  query: z.infer<typeof profileQuerySchema>,
): StandardServiceResponse {
  const parsedQuery = z.parse(profileQuerySchema, query);
  const offset = (parsedQuery.page - 1) * parsedQuery.limit;

  const result = await filterProfiles({
    ...query,
    offset,
    page: parsedQuery.page,
  });

  return {
    body: {
      page: parsedQuery.page,
      limit: parsedQuery.limit,
      total_pages: totalPages({ result, limit: parsedQuery.limit }),
      links: links({
        result,
        limit: parsedQuery.limit,
        page: parsedQuery.page,
      }),
      data: result.map(
        (r) =>
          ({ ...r, updated_at: undefined, total: undefined }) as Partial<
            typeof r
          >,
      ),
      total: Number(result[0]?.total ? result[0]?.total : 0),
      // total: Number(result[0]?.total ?? 0) ?? 0,
      status: "success",
    },
    statusCode: StatusCodes.OK,
  };
}

export async function deleteProfile(id: string): StandardServiceResponse {
  await catchAndThrowError(() => deleteProfileById(id), {
    noResultError: {
      errorClass: NoResultError,
      code: StatusCodes.NOT_FOUND,
      message: "Failed to delete profile with ID",
    },
  });
  return {
    statusCode: StatusCodes.NO_CONTENT,
  };
}

export async function exportProfile(
  payload: z.infer<typeof exportProfilesSchema>,
): StandardServiceResponse<{
  status: "success";
  message: string;
  data: { csv: string };
}> {
  const results = await filterProfiles({ ...payload });

  const preferredHeaders = [
    "id",
    "name",
    "gender",
    "gender_probability",
    "age",
    "age_group",
    "country_id",
    "country_name",
    "country_probability",
    "created_at",
  ] as (keyof profiles)[];

  return {
    statusCode: StatusCodes.OK,
    body: {
      message: "CSV",
      data: {
        csv: json2csv(
          results.map((result) =>
            Object.fromEntries(
              preferredHeaders.map((header) => [header, result[header]]),
            ),
          ),
        ),
      },
      status: "success",
    },
  };
}

const VALID_COUNTRY_CODES = new Set(countries.map((c) => c.code));

export async function processUpload(bb: Busboy): Promise<{
  total_rows: number;
  inserted: number;
  skipped: number;
  reasons: {
    duplicate_name: number;
    invalid_age: number;
    missing_fields: number;
  };
}> {
  const stats = {
    total_rows: 0,
    inserted: 0,
    skipped: 0,
    reasons: {
      duplicate_name: 0,
      invalid_age: 0,
      missing_fields: 0,
    },
  };

  const chunk: z.infer<typeof csvRowSchema>[] = [];
  const CHUNK_SIZE = 2000;

  return await catchAndThrowError(
    async () => {
      await new Promise<void>((resolve, reject) => {
        bb.on("file", (name, stream, info) => {
          stream
            .pipe(parse({ columns: true }))
            .on("data", async (row: z.infer<typeof csvRowSchema>) => {
              chunk.push(row);
              stats.total_rows++;
              if (chunk.length >= CHUNK_SIZE) {
                stream.pause();
                try {
                  await processChunk();
                } catch (error) {
                  reject(error);
                }
                await new Promise((r) => setImmediate(r));
                stream.resume();
              }
            })
            .on("end", async () => {
              try {
                if (chunk.length > 0) await processChunk();
                resolve();
              } catch (err) {
                reject(err);
              }
            })
            .on("error", (err) => {
              reject(
                new AppError({
                  code: StatusCodes.INTERNAL_SERVER_ERROR,
                  message: "Processing failed",
                }),
              );
            });

          async function processChunk() {
            const batch = chunk.splice(0, CHUNK_SIZE);
            if (batch.length === 0) return;

            // called ONCE per chunk, not once per row
            // const existingNamesSet = await findProfilesByNames(
            //   batch.map((b) => b.name),
            // );

            const cleanBatch = batch.filter((b) => {
              // if (existingNamesSet.has(b.name.toLowerCase().trim())) {
              //   stats.skipped++;
              //   stats.reasons.duplicate_name++;
              //   return false;
              // }
              if (csvRowSchema.shape.age.safeParse(b.age).error) {
                stats.skipped++;
                stats.reasons.invalid_age++;
                return false;
              }
              if (Object.keys(b).length < 6) {
                stats.skipped++;
                stats.reasons.missing_fields++;
                return false;
              }
              if (csvRowSchema.safeParse(b).error) {
                stats.skipped++;
                return false;
              }
              if (!countries.find((c) => c.code === b.country_id)?.name) {
                stats.skipped++;
                return false;
              }
              return true;
            });

            if (cleanBatch.length === 0) return;
            await db
              .insertInto("profiles")
              .values(
                cleanBatch.map((b) => ({
                  name: b.name,
                  age: Number(b.age),
                  age_group: ((
                    age: number,
                  ): ValueExpression<DB, "profiles", AgeGroup> => {
                    if (age <= 12) return "child";
                    if (age <= 19) return "teenager";
                    if (age <= 59) return "adult";
                    return "senior";
                  })(b.age),
                  country_id: b.country_id.toUpperCase(),
                  country_name: countries.find((c) => c.code === b.country_id)!
                    .name,
                  gender: b.gender,
                  gender_probability: b.gender_probability ?? 1,
                  country_probability: b.country_probability ?? 1,
                })),
              )
              .onConflict((oc) =>
                oc.doUpdateSet((eb) => ({
                  name: eb.ref("excluded.name"),
                })),
              )
              .returning(['name'])
              .execute();
            // const freshStream = Readable.from([csv]);
            // await bulkInsertProfiles(freshStream, keys);

            stats.inserted += cleanBatch.length;
          }
          console.log(stats);
        });

        bb.on("error", reject);
      });

      return stats;
    },
    {
      internalServerError: {
        errorClass: Error,
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Processing failed",
      },
    },
  );
}
