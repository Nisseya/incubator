import type { Pool } from "pg";
import type { Tray, UUID } from "../domain/models";

type TrayRow = {
  id: string;
  incubator_id: string;
  capacity: number;
  floor: number;
  created_at: string;
};

function fromRow(r: TrayRow): Tray {
  return {
    id: r.id,
    incubatorId: r.incubator_id,
    capacity: r.capacity,
    floor: r.floor,
    createdAt: r.created_at,
  };
}

export function traysService(db: Pool) {
  return {
    async listByIncubator(incubatorId: UUID): Promise<Tray[]> {
      const q = `
        select *
        from trays
        where incubator_id = $1
        order by floor asc
      `;
      const res = await db.query<TrayRow>(q, [incubatorId]);
      return res.rows.map(fromRow);
    },

    async create(payload: { incubatorId: UUID; capacity: number; floor: number }): Promise<Tray> {
      const q = `
        insert into trays (incubator_id, capacity, floor)
        values ($1, $2, $3)
        returning *
      `;
      const res = await db.query<TrayRow>(q, [payload.incubatorId, payload.capacity, payload.floor]);
      return fromRow(res.rows[0]);
    },

    async update(trayId: UUID, patch: { capacity?: number; floor?: number }): Promise<Tray> {
      const q = `
        update trays
        set
          capacity = coalesce($2, capacity),
          floor = coalesce($3, floor)
        where id = $1
        returning *
      `;
      const res = await db.query<TrayRow>(q, [trayId, patch.capacity ?? null, patch.floor ?? null]);
      if (res.rowCount !== 1) throw new Error("Tray not found");
      return fromRow(res.rows[0]);
    },

    async remove(trayId: UUID): Promise<void> {
      const res = await db.query(`delete from trays where id = $1`, [trayId]);
      if (res.rowCount !== 1) throw new Error("Tray not found");
    },
  };
}
