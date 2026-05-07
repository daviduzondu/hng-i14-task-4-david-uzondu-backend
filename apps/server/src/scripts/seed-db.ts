import { profiles } from "@/../seed_profiles.json";
import { db } from "@/db/db";

await db
  .insertInto("profiles")
  .values(profiles)
  .onConflict((oc) => oc.doNothing())
  .executeTakeFirst();

console.log("SEED successful!");
