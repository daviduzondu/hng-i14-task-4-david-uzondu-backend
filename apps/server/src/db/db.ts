import type { DB as Database } from '@/db/generated/types' // this is the Database interface we defined earlier
import { Kysely, PostgresDialect } from 'kysely'
import { AutoUpdatedAtDefaultPlugin } from '@/db/plugins/updated-at.plugin.js'
import { pool } from '@/db/pool';


// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
export const db = new Kysely<Database>({
 dialect: new PostgresDialect({
  pool
 }),
 plugins: [new AutoUpdatedAtDefaultPlugin()]
});