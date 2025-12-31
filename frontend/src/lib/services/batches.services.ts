import type { Pool, PoolClient } from "pg";
import type { Batch, UUID, ISODate } from "../domain/models";
import { withTx } from "../db/tx";

type BatchRow = {
  id: string;
  tray_id: string;
  species_id: string;
  eggs_qty: number;
  start_at: string;
  expected_hatch_at: string;
  status: Batch["status"];
  notes: string | null;
  created_at: string;
};

function fromRow(r: BatchRow): Batch {
  return {
    id: r.id,
    trayId: r.tray_id,
    speciesId: r.species_id,
    eggsQty: r.eggs_qty,
    startAt: r.start_at,
    expectedHatchAt: r.expected_hatch_at,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export function batchesService(db: Pool) {
  async function listByTrayWithClient(c: PoolClient, trayId: UUID): Promise<Batch[]> {
    const res = await c.query<BatchRow>(
      `select * from batches where tray_id = $1 order by created_at desc`,
      [trayId]
    );
    return res.rows.map(fromRow);
  }

  return {
    async listByTray(trayId: UUID): Promise<Batch[]> {
      const res = await db.query<BatchRow>(
        `select * from batches where tray_id = $1 order by created_at desc`,
        [trayId]
      );
      return res.rows.map(fromRow);
    },

    async get(batchId: UUID): Promise<Batch | null> {
      const res = await db.query<BatchRow>(`select * from batches where id = $1`, [batchId]);
      if (res.rowCount === 0) return null;
      return fromRow(res.rows[0]);
    },

    async create(payload: {
      trayId: UUID;
      speciesId: string;
      eggsQty: number;
      startAt: ISODate;
      expectedHatchAt: ISODate;
      notes?: string | null;
    }): Promise<Batch> {
      const q = `
        insert into batches (tray_id, species_id, eggs_qty, start_at, expected_hatch_at, status, notes)
        values ($1,$2,$3,$4,$5,'incubating',$6)
        returning *
      `;
      const res = await db.query<BatchRow>(q, [
        payload.trayId,
        payload.speciesId,
        payload.eggsQty,
        payload.startAt,
        payload.expectedHatchAt,
        payload.notes ?? null,
      ]);
      return fromRow(res.rows[0]);
    },

    async setStatus(batchId: UUID, status: Batch["status"]): Promise<Batch> {
      const res = await db.query<BatchRow>(
        `update batches set status = $2 where id = $1 returning *`,
        [batchId, status]
      );
      if (res.rowCount !== 1) throw new Error("Batch not found");
      return fromRow(res.rows[0]);
    },

    async remove(batchId: UUID): Promise<void> {
      const res = await db.query(`delete from batches where id = $1`, [batchId]);
      if (res.rowCount !== 1) throw new Error("Batch not found");
    },

    // utile si tu veux supprimer un tray et tout récupérer proprement avant
    async listByTrayTx(trayId: UUID): Promise<Batch[]> {
      return withTx(db, (c) => listByTrayWithClient(c, trayId));
    },
  };
}
