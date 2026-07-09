import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pool from "./client";
import { users } from "./schema";

const db = drizzle(pool, { logger: false });
const BATCH_SIZE = 1000;

function parseTargetCount(): number {
  const arg = process.argv[2];
  const count = arg ? parseInt(arg, 10) : 1_000_000;
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error(`Invalid row count: ${arg}`);
  }
  return count;
}

// email is the only column with a uniqueness constraint - the index guarantees
// no collision within this run or with rows inserted by prior runs.
function generateUser(index: number) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}.${index}@${faker.internet.domainName()}`.toLowerCase(),
  };
}

async function main() {
  faker.seed(42);
  const targetCount = parseTargetCount();

  const [{ count: currentCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  console.log(
    `users table currently has ${currentCount} rows. Inserting ${targetCount} more (append mode)...`,
  );

  const startTime = Date.now();
  for (let batchStart = 0; batchStart < targetCount; batchStart += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, targetCount - batchStart);
    const rows = Array.from({ length: size }, (_, i) =>
      generateUser(currentCount + batchStart + i),
    );
    await db.insert(users).values(rows);

    const done = batchStart + size;
    if (done % 50_000 === 0 || done === targetCount) {
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(
        `${done}/${targetCount} rows - ${(done / elapsed).toFixed(0)} rows/sec, ${elapsed.toFixed(0)}s elapsed`,
      );
    }
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
