import type { Pool, PoolClient } from "pg";
import type { Incubator, IncubatorWithTrays, Tray, UUID } from "../domain/models";
import { withTx } from "../db/tx";

type IncubatorRow = {
  id: string;
  user_id: string;
  model: string | null;
  trays_amt: number | null;
  position: number;
  created_at: string;
};

type TrayRow = {
  id: string;
  incubator_id: string;
  capacity: number;
  floor: number;
  created_at: string;
};

function incubatorFromRow(r: IncubatorRow): Incubator {
  return {
    id: r.id,
    userId: r.user_id,
    model: r.model,
    traysAmt: r.trays_amt,
    position: r.position,
    createdAt: r.created_at,
  };
}

function trayFromRow(r: TrayRow): Tray {
  return {
    id: r.id,
    incubatorId: r.incubator_id,
    capacity: r.capacity,
    floor: r.floor,
    createdAt: r.created_at,
  };
}

async function insertTrays(
  c: PoolClient,
  incubatorId: UUID,
  traysAmt: number,
  capacityPerTray: number,
  floorBase: 0 | 1
): Promise<Tray[]> {
  const floors = Array.from({ length: traysAmt }, (_, i) => i + floorBase);

  // insert en bulk pour éviter N queries
  const q = `
    insert into trays (incubator_id, capacity, floor)
    select $1::uuid, $2::int, x::int
    from unnest($3::int[]) as x
    returning *
  `;
  const res = await c.query<TrayRow>(q, [incubatorId, capacityPerTray, floors]);
  return res.rows.map(trayFromRow).sort((a, b) => a.floor - b.floor);
}

export function incubatorsService(db: Pool) {
  return {
    async listByUser(userId: UUID): Promise<Incubator[]> {
      const q = `
        select *
        from incubators
        where user_id = $1
        order by position asc, created_at desc
      `;
      const res = await db.query<IncubatorRow>(q, [userId]);
      return res.rows.map(incubatorFromRow);
    },

    async getWithTrays(incubatorId: UUID): Promise<IncubatorWithTrays | null> {
      const inc = await db.query<IncubatorRow>(`select * from incubators where id = $1`, [incubatorId]);
      if (inc.rowCount === 0) return null;

      const trays = await db.query<TrayRow>(
        `select * from trays where incubator_id = $1 order by floor asc`,
        [incubatorId]
      );

      return {
        ...incubatorFromRow(inc.rows[0]),
        trays: trays.rows.map(trayFromRow),
      };
    },

    /**
     * Crée un incubateur + crée ses plateaux dans la même transaction.
     */
    async createWithTrays(userId: UUID, payload: {
      model?: string | null;
      traysAmt: number;            // obligatoire ici
      capacityPerTray: number;     // capacité par plateau
      position?: number;
      floorBase?: 0 | 1;           // 1 par défaut (floor 1..N)
    }): Promise<IncubatorWithTrays> {
      if (!Number.isInteger(payload.traysAmt) || payload.traysAmt <= 0) {
        throw new Error("traysAmt must be a positive integer");
      }
      if (!Number.isInteger(payload.capacityPerTray) || payload.capacityPerTray < 0) {
        throw new Error("capacityPerTray must be an integer >= 0");
      }

      return withTx(db, async (c) => {
        const floorBase = payload.floorBase ?? 1;

        const qInc = `
          insert into incubators (user_id, model, trays_amt, position)
          values ($1, $2, $3, $4)
          returning *
        `;
        const incRes = await c.query<IncubatorRow>(qInc, [
          userId,
          payload.model ?? null,
          payload.traysAmt,
          payload.position ?? 0,
        ]);

        const incubator = incubatorFromRow(incRes.rows[0]);

        const trays = await insertTrays(
          c,
          incubator.id,
          payload.traysAmt,
          payload.capacityPerTray,
          floorBase
        );

        return { ...incubator, trays };
      });
    },

    /**
     * Si tu veux aussi permettre un update "traysAmt" (rare), il faut décider:
     * - autoriser seulement si pas de batches
     * - ou ajouter/supprimer des trays automatiquement
     */
    async update(incubatorId: UUID, patch: { model?: string | null; position?: number }): Promise<Incubator> {
      const q = `
        update incubators
        set
          model = coalesce($2, model),
          position = coalesce($3, position)
        where id = $1
        returning *
      `;
      const res = await db.query<IncubatorRow>(q, [incubatorId, patch.model ?? null, patch.position ?? null]);
      if (res.rowCount !== 1) throw new Error("Incubator not found");
      return incubatorFromRow(res.rows[0]);
    },

    async remove(incubatorId: UUID): Promise<void> {
      const res = await db.query(`delete from incubators where id = $1`, [incubatorId]);
      if (res.rowCount !== 1) throw new Error("Incubator not found");
    },
  };
}
