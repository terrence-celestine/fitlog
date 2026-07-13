import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_name_fts_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.name})`,
    ),
  ],
);

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  muscle_group: varchar("muscle_group", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const workout_sessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  exercise_id: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: integer("weight").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id),
    exercise_id: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    target_weight: integer("target_weight").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    deleted_at: timestamp("deleted_at"),
  },
  (table) => [unique().on(table.user_id, table.exercise_id)],
);
