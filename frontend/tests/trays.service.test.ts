import { beforeAll, describe, expect, it } from "vitest";
import { withTestClient } from "./_db";
import { incubatorsService } from "../src/lib/services/incubators.service";
import { traysService } from "../src/lib/services/trays.service";

const USER_ID = "22222222-2222-2222-2222-222222222222";

describe("traysService", () => {

  it("listByIncubator returns trays ordered by floor", async () => {
    await withTestClient(async (db) => {
      const inc = incubatorsService(db as any);
      const trays = traysService(db as any);

      const created = await inc.createWithTrays(USER_ID, {
        traysAmt: 3,
        capacityPerTray: 10,
        floorBase: 1,
      });

      const list = await trays.listByIncubator(created.id);
      expect(list.map((t) => t.floor)).toEqual([1, 2, 3]);
    });
  });
});
