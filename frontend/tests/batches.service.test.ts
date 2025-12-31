import { beforeAll, describe, expect, it } from "vitest";
import { ensureSchema, withTestClient } from "./_db";
import { incubatorsService } from "../src/lib/services/incubators.service";
import { speciesService } from "../src/lib/services/species.service";
import { batchesService } from "../src/lib/services/batches.services";

const USER_ID = "33333333-3333-3333-3333-333333333333";

describe("batchesService", () => {

  it("create + listByTray works", async () => {
    await withTestClient(async (db) => {
      const inc = incubatorsService(db as any);
      const sp = speciesService(db as any);
      const batches = batchesService(db as any);

      await sp.upsert({
        id: "chicken",
        name: "Chicken",
        incubationDays: 21,
        tempMin: 37.5,
        tempMax: 37.8,
        humidityMin: 45,
        humidityMax: 55,
      });

      const createdInc = await inc.createWithTrays(USER_ID, {
        traysAmt: 1,
        capacityPerTray: 12,
        floorBase: 1,
      });

      const trayId = createdInc.trays[0].id;

      const b = await batches.create({
        trayId,
        speciesId: "chicken",
        eggsQty: 8,
        startAt: "2025-12-31",
        expectedHatchAt: "2026-01-21",
      });

      expect(b.id).toBeTruthy();
      expect(b.trayId).toBe(trayId);
      expect(b.speciesId).toBe("chicken");
      expect(b.status).toBe("incubating");

      const list = await batches.listByTray(trayId);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(b.id);
    });
  });
});
