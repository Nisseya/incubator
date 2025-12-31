import "dotenv/config";
import { ensureSchema } from "./_db";

export default async function setup() {
  await ensureSchema();
}
