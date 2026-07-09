import { drizzle } from "drizzle-orm/node-postgres";
import pool from "./client";
import { exercises, users, workout_sessions } from "./schema";

const db = drizzle(pool, { logger: false });
const BATCH_SIZE = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseSessionsPerUser(): number {
  const arg = process.argv[2];
  const count = arg ? parseInt(arg, 10) : 10;
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error(`Invalid sessions-per-user count: ${arg}`);
  }
  return count;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWeight(): number {
  return randomInt(4, 40) * 5; // step-of-5 between 20 and 200
}

function randomRecentDate(): Date {
  return new Date(Date.now() - Math.random() * 180 * DAY_MS);
}

function generateSession(userId: number, exerciseIds: number[]) {
  return {
    user_id: userId,
    exercise_id: exerciseIds[randomInt(0, exerciseIds.length - 1)],
    sets: randomInt(3, 5),
    reps: randomInt(6, 15),
    weight: randomWeight(),
    created_at: randomRecentDate(),
  };
}

async function main() {
  const sessionsPerUser = parseSessionsPerUser();

  const userRows = await db.select({ id: users.id }).from(users);
  const exerciseRows = await db.select({ id: exercises.id }).from(exercises);
  const userIds = userRows.map((row) => row.id);
  const exerciseIds = exerciseRows.map((row) => row.id);

  if (exerciseIds.length === 0) {
    throw new Error("exercises table is empty - run db:seed-exercises first.");
  }

  const targetCount = userIds.length * sessionsPerUser;
  console.log(
    `${userIds.length} users, ${exerciseIds.length} exercises. Inserting ${sessionsPerUser} sessions/user - ${targetCount} rows total.`,
  );

  const startTime = Date.now();
  let done = 0;
  let batch: ReturnType<typeof generateSession>[] = [];

  for (const userId of userIds) {
    for (let i = 0; i < sessionsPerUser; i++) {
      batch.push(generateSession(userId, exerciseIds));

      if (batch.length === BATCH_SIZE) {
        await db.insert(workout_sessions).values(batch);
        done += batch.length;
        batch = [];

        if (done % 50_000 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          console.log(
            `${done}/${targetCount} rows - ${(done / elapsed).toFixed(0)} rows/sec, ${elapsed.toFixed(0)}s elapsed`,
          );
        }
      }
    }
  }

  if (batch.length > 0) {
    await db.insert(workout_sessions).values(batch);
    done += batch.length;
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`${done}/${targetCount} rows - ${(done / elapsed).toFixed(0)} rows/sec, ${elapsed.toFixed(0)}s elapsed`);
  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
