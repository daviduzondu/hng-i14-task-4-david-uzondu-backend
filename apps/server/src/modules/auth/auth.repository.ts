import { db } from "@/db/db";
import type { users } from "@/db/generated/types";
import { sql, type Insertable } from "kysely";
import { hash } from "@/modules/auth/auth.service";
import { addMinutes } from "date-fns";
import { AppError } from "@/errors/app.error";
import { StatusCodes } from "http-status-codes";

export async function getUserDetails(userId: string) {
  const result = await db
    .selectFrom("users")
    .where("users.id", "=", userId)
    .selectAll()
    .executeTakeFirstOrThrow(() => {
      throw new AppError({
        message: "User not found",
        code: StatusCodes.NOT_FOUND,
      });
    });
  return result;
}

export async function createUser(data: Insertable<users>) {
  const result = await db
    .insertInto("users")
    .values({
      last_login_at: sql`now()`,
      avatar_url: data.avatar_url,
      email: data.email,
      github_id: data.github_id,
      is_active: true,
      username: data.username,
    })
    .onConflict((oc) => {
      return oc.column("github_id").doUpdateSet((eb) => ({
        username: eb.ref("users.username"),
        id: eb.ref("users.id"),
        role: eb.ref("users.role"),
      }));
    })
    .returning(["username", "role", "id"])
    .executeTakeFirst();

  return result;
}

export async function getUserActiveState(userId: string) {
  return await db
    .selectFrom("users")
    .where("users.id", "=", userId)
    .select(["is_active"])
    .executeTakeFirstOrThrow(() => {
      throw new AppError({
        message: "User does not exist",
        code: StatusCodes.NOT_FOUND,
      });
    });
}

export async function rotateToken({
  oldToken,
  newToken,
  userId,
}: {
  oldToken: string;
  newToken: string;
  userId: string;
}) {
  return await db.transaction().execute(async (trx) => {
    await trx
      .deleteFrom("refresh_tokens")
      .where("user_id", "=", userId)
      .where("token_hash", "=", hash(oldToken))
      .execute();

    const newRefreshToken = await trx
      .insertInto("refresh_tokens")
      .values({
        token_hash: hash(newToken),
        user_id: userId,
        expires_at: addMinutes(new Date(), 5),
      })
      .returning(["expires_at"])
      .executeTakeFirstOrThrow();

    return { expiresAt: newRefreshToken.expires_at };
  });
}

export async function revokeToken({
  userId,
  oldToken,
}: {
  userId: string;
  oldToken: string;
}) {
  await db
    .deleteFrom("refresh_tokens")
    .where("user_id", "=", userId)
    .where("token_hash", "=", hash(oldToken))
    .execute();
}

export async function findToken(data: { userId: string; token: string }) {
  return await db
    .selectFrom("refresh_tokens")
    .where("token_hash", "=", hash(data.token))
    .where("user_id", "=", data.userId)
    .where("expires_at", ">", new Date())
    .executeTakeFirst();
}

export async function saveToken(data: { userId: string; token: string }) {
  return await db
    .insertInto("refresh_tokens")
    .values({
      token_hash: hash(data.token),
      user_id: data.userId,
      expires_at: addMinutes(new Date(), 5),
    })
    .returning(["expires_at"])
    .executeTakeFirstOrThrow();
}
