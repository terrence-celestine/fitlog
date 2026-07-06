import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  muscle_group: varchar("muscle_group", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const workout_sessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  exercise_id: integer("exercide_id")
    .notNull()
    .references(() => exercises.id),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: integer("weight").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
