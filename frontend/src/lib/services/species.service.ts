import type { Pool } from "pg";
import type { Species } from "../domain/models";

type SpeciesRow = {
  id: string;
  name: string;
  incubation_days: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
};

function fromRow(r: SpeciesRow): Species {
  return {
    id: r.id,
    name: r.name,
    incubationDays: r.incubation_days,
    tempMin: Number(r.temp_min),
    tempMax: Number(r.temp_max),
    humidityMin: Number(r.humidity_min),
    humidityMax: Number(r.humidity_max),
  };
}

export function speciesService(db: Pool) {
  return {
    async list(): Promise<Species[]> {
      const res = await db.query<SpeciesRow>(`select * from species order by name asc`);
      return res.rows.map(fromRow);
    },

    async get(id: string): Promise<Species | null> {
      const res = await db.query<SpeciesRow>(`select * from species where id = $1`, [id]);
      if (res.rowCount === 0) return null;
      return fromRow(res.rows[0]);
    },

    async upsert(s: Species): Promise<Species> {
      const q = `
        insert into species (id, name, incubation_days, temp_min, temp_max, humidity_min, humidity_max)
        values ($1,$2,$3,$4,$5,$6,$7)
        on conflict (id) do update set
          name = excluded.name,
          incubation_days = excluded.incubation_days,
          temp_min = excluded.temp_min,
          temp_max = excluded.temp_max,
          humidity_min = excluded.humidity_min,
          humidity_max = excluded.humidity_max
        returning *
      `;
      const res = await db.query<SpeciesRow>(q, [
        s.id,
        s.name,
        s.incubationDays,
        s.tempMin,
        s.tempMax,
        s.humidityMin,
        s.humidityMax,
      ]);
      return fromRow(res.rows[0]);
    },
  };
}
