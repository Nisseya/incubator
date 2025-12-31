import "dotenv/config";
import { Pool, type PoolClient } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");

export const testPool = new Pool({
  connectionString: url,
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 2000,
  max: 4,
});

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await testPool.query("select 1");

  // IMPORTANT: pas de CREATE EXTENSION en tests si tu peux l’éviter
  // => utilise gen_random_uuid seulement si pgcrypto déjà là en prod.
  // Sinon, on laisse mais sans concurrence (setup global).
  await testPool.query(`
    create extension if not exists pgcrypto;

    create table if not exists incubators (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      model text,
      trays_amt int,
      position int not null default 0,
      created_at timestamptz not null default now()
    );

    create table if not exists trays (
      id uuid primary key default gen_random_uuid(),
      incubator_id uuid not null references incubators(id) on delete cascade,
      capacity int not null,
      floor int not null,
      created_at timestamptz not null default now(),
      unique (incubator_id, floor)
    );

    create table if not exists species (
      id text primary key,
      name text not null,
      incubation_days int not null,
      temp_min numeric(6,2) not null,
      temp_max numeric(6,2) not null,
      humidity_min numeric(6,2) not null,
      humidity_max numeric(6,2) not null
    );

    create table if not exists batches (
      id uuid primary key default gen_random_uuid(),
      tray_id uuid not null references trays(id) on delete restrict,
      species_id text not null references species(id),
      eggs_qty int not null,
      start_at date not null,
      expected_hatch_at date not null,
      status text not null default 'incubating',
      notes text,
      created_at timestamptz not null default now()
    );

    create table if not exists scheduled_notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      batch_id uuid references batches(id) on delete cascade,
      scheduled_at timestamptz not null,
      title text not null,
      body text not null,
      status text not null default 'scheduled',
      attempts int not null default 0,
      last_error text,
      sent_at timestamptz,
      created_at timestamptz not null default now()
    );
  `);

  schemaReady = true;
}

/**
 * Fournit un PoolClient en transaction; rollback à la fin => DB propre.
 */
export async function withTestClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await testPool.connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("rollback");
    return out;
  } finally {
    c.release();
  }
}
