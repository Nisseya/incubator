import { beforeAll, describe, expect, it } from "vitest";
import { withTestClient } from "./_db";
import { incubatorsService } from "../src/lib/services/incubators.service";

const USER_ID = "11111111-1111-1111-1111-111111111111";

describe("incubatorsService", () => {


  it("createWithTrays creates incubator + trays in same tx", async () => {
    await withTestClient(async (db) => {
      const svc = incubatorsService(db as any);

      const created = await svc.createWithTrays(USER_ID, {
        model: "Model X",
        traysAmt: 3,
        capacityPerTray: 12,
        position: 1,
        floorBase: 1,
      });

      expect(created.id).toBeTruthy();
      expect(created.userId).toBe(USER_ID);
      expect(created.traysAmt).toBe(3);
      expect(created.trays).toHaveLength(3);
      expect(created.trays.map((t) => t.floor)).toEqual([1, 2, 3]);
      expect(created.trays.every((t) => t.capacity === 12)).toBe(true);

      const fetched = await svc.getWithTrays(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.trays).toHaveLength(3);
    });
  });

  it("remove deletes incubator and cascades trays", async () => {
    await withTestClient(async (db) => {
      const svc = incubatorsService(db as any);

      const created = await svc.createWithTrays(USER_ID, {
        model: null,
        traysAmt: 2,
        capacityPerTray: 6,
        floorBase: 0,
      });

      // confirm trays exist
      const traysBefore = await db.query(
        `select count(*)::int as c from trays where incubator_id = $1`,
        [created.id]
      );
      expect(traysBefore.rows[0].c).toBe(2);

      await svc.remove(created.id);

      const traysAfter = await db.query(
        `select count(*)::int as c from trays where incubator_id = $1`,
        [created.id]
      );
      expect(traysAfter.rows[0].c).toBe(0);
    });
  });
});
