-- Custom SQL migration file, put your code below! --
-- schema.ts has declared exercises.name as unique() since migration 0000, and the
-- drizzle-kit snapshot has tracked it as such the whole time, but the live database
-- never actually had the constraint (confirmed via pg_constraint - only goals' and
-- users.email's unique constraints from 0000 made it to the live DB). Zero duplicate
-- names exist currently, so this is safe to add for real.
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_name_unique" UNIQUE ("name");