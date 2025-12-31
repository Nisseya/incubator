import type { Pool, PoolClient } from "pg";

export type Db = Pool | PoolClient;

function isPool(db: Db): db is Pool {
  // Pool a end(); PoolClient n'a pas end()
  return typeof (db as any).end === "function";
}

let spCounter = 0;

