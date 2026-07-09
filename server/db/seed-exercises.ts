import { drizzle } from "drizzle-orm/node-postgres";
import pool from "./client";
import { exercises } from "./schema";

const db = drizzle(pool, { logger: false });

// Curated real exercises, deliberately excluding the 5 already in db/seed.sql
// (Bench Press, Squat, Deadlift, Incline Bench Press, Overhead Press).
const exerciseList: { name: string; muscle_group: string }[] = [
  // Chest
  { name: "Decline Bench Press", muscle_group: "Chest" },
  { name: "Incline Dumbbell Press", muscle_group: "Chest" },
  { name: "Flat Dumbbell Press", muscle_group: "Chest" },
  { name: "Dumbbell Fly", muscle_group: "Chest" },
  { name: "Cable Crossover", muscle_group: "Chest" },
  { name: "Push-Up", muscle_group: "Chest" },
  { name: "Chest Dip", muscle_group: "Chest" },

  // Back
  { name: "Pull-Up", muscle_group: "Back" },
  { name: "Chin-Up", muscle_group: "Back" },
  { name: "Lat Pulldown", muscle_group: "Back" },
  { name: "Bent-Over Row", muscle_group: "Back" },
  { name: "Barbell Row", muscle_group: "Back" },
  { name: "Seated Cable Row", muscle_group: "Back" },
  { name: "T-Bar Row", muscle_group: "Back" },
  { name: "Face Pull", muscle_group: "Back" },
  { name: "Single-Arm Dumbbell Row", muscle_group: "Back" },

  // Legs
  { name: "Leg Press", muscle_group: "Legs" },
  { name: "Front Squat", muscle_group: "Legs" },
  { name: "Hack Squat", muscle_group: "Legs" },
  { name: "Bulgarian Split Squat", muscle_group: "Legs" },
  { name: "Walking Lunge", muscle_group: "Legs" },
  { name: "Leg Extension", muscle_group: "Legs" },
  { name: "Leg Curl", muscle_group: "Legs" },
  { name: "Romanian Deadlift", muscle_group: "Legs" },
  { name: "Goblet Squat", muscle_group: "Legs" },

  // Shoulders
  { name: "Lateral Raise", muscle_group: "Shoulders" },
  { name: "Front Raise", muscle_group: "Shoulders" },
  { name: "Arnold Press", muscle_group: "Shoulders" },
  { name: "Upright Row", muscle_group: "Shoulders" },
  { name: "Barbell Shrug", muscle_group: "Shoulders" },
  { name: "Rear Delt Fly", muscle_group: "Shoulders" },
  { name: "Dumbbell Shoulder Press", muscle_group: "Shoulders" },

  // Biceps
  { name: "Barbell Curl", muscle_group: "Biceps" },
  { name: "Dumbbell Curl", muscle_group: "Biceps" },
  { name: "Hammer Curl", muscle_group: "Biceps" },
  { name: "Preacher Curl", muscle_group: "Biceps" },
  { name: "Concentration Curl", muscle_group: "Biceps" },

  // Triceps
  { name: "Tricep Pushdown", muscle_group: "Triceps" },
  { name: "Skull Crusher", muscle_group: "Triceps" },
  { name: "Overhead Tricep Extension", muscle_group: "Triceps" },
  { name: "Close-Grip Bench Press", muscle_group: "Triceps" },
  { name: "Tricep Dip", muscle_group: "Triceps" },

  // Core
  { name: "Plank", muscle_group: "Core" },
  { name: "Sit-Up", muscle_group: "Core" },
  { name: "Crunch", muscle_group: "Core" },
  { name: "Russian Twist", muscle_group: "Core" },
  { name: "Hanging Leg Raise", muscle_group: "Core" },
  { name: "Cable Woodchopper", muscle_group: "Core" },
  { name: "Ab Wheel Rollout", muscle_group: "Core" },

  // Glutes
  { name: "Hip Thrust", muscle_group: "Glutes" },
  { name: "Glute Bridge", muscle_group: "Glutes" },
  { name: "Cable Glute Kickback", muscle_group: "Glutes" },

  // Calves
  { name: "Standing Calf Raise", muscle_group: "Calves" },
  { name: "Seated Calf Raise", muscle_group: "Calves" },

  // Full Body
  { name: "Burpee", muscle_group: "Full Body" },
  { name: "Kettlebell Swing", muscle_group: "Full Body" },
  { name: "Clean and Jerk", muscle_group: "Full Body" },
  { name: "Snatch", muscle_group: "Full Body" },
  { name: "Farmer's Carry", muscle_group: "Full Body" },
  { name: "Box Jump", muscle_group: "Full Body" },
  { name: "Rowing Machine", muscle_group: "Full Body" },
  { name: "Battle Ropes", muscle_group: "Full Body" },
];

async function main() {
  // The live exercises.name column has no unique constraint to lean on for
  // ON CONFLICT DO NOTHING (schema.ts declares .unique() but it was never applied
  // to this database), so dedupe against existing names in application code instead.
  const existing = await db.select({ name: exercises.name }).from(exercises);
  const existingNames = new Set(existing.map((row) => row.name));

  const toInsert = exerciseList.filter((exercise) => !existingNames.has(exercise.name));

  console.log(
    `exercises table currently has ${existing.length} rows. ${toInsert.length} of ${exerciseList.length} curated exercises are new.`,
  );

  if (toInsert.length > 0) {
    await db.insert(exercises).values(toInsert);
  }

  console.log(`Inserted ${toInsert.length} new rows. exercises table now has ${existing.length + toInsert.length} rows.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
