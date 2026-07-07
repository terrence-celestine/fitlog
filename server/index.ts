import cors from "cors";
import { count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import express from "express";
import pool from "./db/client";
import { exercises, users, workout_sessions } from "./db/schema";
// setup the app start
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
); // allow CORS requests
app.use(express.json()); // parse JSON
const db = drizzle(pool, { logger: true });
// POST /users — create a user
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await db.insert(users).values({ name, email }).returning();
    res.status(201).json(user[0]);
  } catch (error) {
    console.error("There was an error creating the user", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// POST /exercises — create an exercise
app.post("/api/exercises", async (req, res) => {
  const { name, muscle_group } = req.body;
  try {
    const work_out = await db
      .insert(exercises)
      .values({ name, muscle_group })
      .returning();

    res.status(201).json(work_out);
  } catch (error) {
    console.error("There was an error creating the workout", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// POST /sessions — log a workout session
app.post("/api/sessions", async (req, res) => {
  const { user_id, exercise_id, sets, reps, weight, created_at } = req.body;
  try {
    const created_session = await db
      .insert(workout_sessions)
      .values({ user_id, exercise_id, sets, reps, weight, created_at })
      .returning();
    res.status(201).json(created_session[0]);
  } catch (error) {
    console.error("There was an error creating the workout session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET /sessions — get all sessions with optional filters
// Examples:
//   - GET /sessions?user_id=1
//   - GET /sessions?user_id=1&exercise=Bench+Press
app.get("/api/sessions", async (req, res) => {
  const { user_id, exercise, limit, page } = req.query;
  try {
    let queryText = `
        SELECT 
          ws.id, 
          ws.user_id,
          ws.exercise_id,
          e.name AS exercise, 
          e.muscle_group AS "muscleGroup", 
          ws.sets, 
          ws.reps, 
          ws.weight, 
          ws.created_at AS "createdAt"
        FROM workout_sessions ws
        JOIN exercises e ON e.id = ws.exercise_id
      `;
    const queryParams: any[] = [];
    const conditions: string[] = [];

    if (user_id) {
      queryParams.push(user_id);
      conditions.push(`ws.user_id = $${queryParams.length}`);
    }

    if (exercise) {
      queryParams.push(exercise);
      if (!isNaN(Number(exercise))) {
        conditions.push(`ws.exercise_id = $${queryParams.length}`);
      } else {
        conditions.push(`e.name = $${queryParams.length}`);
      }
    }

    if (conditions.length > 0) {
      queryText += " WHERE " + conditions.join(" AND ");
    }

    queryText += " ORDER BY ws.created_at DESC";
    if (page) {
      const offset = (Number(page) - 1) * Number(limit);
      queryParams.push(offset);
      queryText += ` OFFSET $${queryParams.length}`;
    }

    if (limit) {
      const limitNumber = Number(limit);
      queryParams.push(limitNumber);
      queryText += ` LIMIT $${queryParams.length}`;
    }

    const user_session = await pool.query(queryText, queryParams);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM workout_sessions ws
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE ws.user_id = $1`,
      [user_id],
    );

    const total = countResult.rows[0];
    res.status(200).json({
      sessions: user_session.rows,
      total: Number(total.count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("There was an error trying to find session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET /leaderboard — all users ranked by total sessions this week
app.get("/api/leaderboard", async (req, res) => {
  try {
    const all_users = await db
      .select({ name: users.name, total_sessions: count(workout_sessions.id) })
      .from(users)
      .leftJoin(workout_sessions, eq(users.id, workout_sessions.user_id))
      .groupBy(users.id)
      .orderBy(desc(count(workout_sessions.id)));
    res.status(200).json(all_users);
  } catch (error) {
    console.error("There was an error getting the leaderboard", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/users/last-workouts", async (req, res) => {
  try {
    const all_users = await pool.query("SELECT * FROM users");
    for (const user of all_users.rows) {
      const user_last_workout = await db
        .select()
        .from(workout_sessions)
        .where(eq(workout_sessions.user_id, user.id))
        .orderBy(desc(workout_sessions.created_at))
        .limit(1);

      console.log(
        `Query ${all_users.rows.indexOf(user) + 2}: fetched last workout for user ${user.id}`,
      );
      user.last_workout = user_last_workout[0];
    }
    res.status(200).json(all_users.rows);
  } catch (error) {
    console.error("There was an error getting the last workout", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
app.get("/api/users/last-workouts-fixed", async (req, res) => {
  try {
    const all_users = await pool.query(
      "SELECT DISTINCT ON (ws.user_id) u.id, u.name, u.email, ws.* FROM users u LEFT JOIN workout_sessions ws ON ws.user_id = u.id ORDER BY ws.user_id, ws.created_at DESC",
    );
    res.status(200).json(all_users.rows);
  } catch (error) {
    console.error("There was an error getting the last workout", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
// GET /users/:id/last-workout — write this with N+1 first, then fix it
app.get("/api/users/:id/last-workout", async (req, res) => {
  const { id } = req.params;
  try {
    const allWorkout = await db
      .select()
      .from(workout_sessions)
      .where(eq(workout_sessions.user_id, Number(id)))
      .orderBy(desc(workout_sessions.created_at))
      .limit(1);
    res.status(200).json(allWorkout[0]);
  } catch (error) {
    console.error("There was an error getting the last workout", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
app.get("/api/users", async (_, res) => {
  try {
    const all_users = await db.select().from(users);
    res.status(200).json(all_users);
  } catch (error) {
    console.error("There was an error getting the users", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
// GET all exercise by query
app.get("/api/search", async (req, res) => {
  const { q, type } = req.query;
  let queryText;
  if (type === "exercise") {
    queryText = `SELECT * FROM exercises WHERE to_tsvector('english', name) @@ to_tsquery('english', $1)`;
  } else if (type === "user") {
    queryText = `SELECT * FROM users WHERE to_tsvector('english', name) @@ to_tsquery('english', $1)`;
  } else if (type === "session") {
    queryText = `
    SELECT 
      ws.id, 
      ws.user_id,
      ws.exercise_id,
      e.name AS exercise, 
      e.muscle_group AS "muscleGroup", 
      ws.sets, 
      ws.reps, 
      ws.weight, 
      ws.created_at AS "createdAt"
    FROM workout_sessions ws
    JOIN exercises e ON e.id = ws.exercise_id
    WHERE to_tsvector('english', e.name) @@ to_tsquery('english', $1)
  `;
  } else {
    res.status(400).json({ error: "Invalid type" });
    return;
  }
  try {
    const all_exercise = await pool.query(queryText as string, [q]);
    res.status(200).json(all_exercise.rows);
  } catch (error) {
    console.error("There was an error getting the exercises", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
app.get("/api/exercises", async (_, res) => {
  try {
    const all_exercises = await db.select().from(exercises);
    res.status(200).json(all_exercises);
  } catch (error) {
    console.error("There was an error getting the exercises", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
app.get("/api/personal-records", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }
  try {
    const personal_records = await pool.query(
      `SELECT DISTINCT ON (exercise_id)
        ws.user_id,
        ws.exercise_id,
        e.name AS exercise,
        e.muscle_group,
        ws.weight AS personal_record,
        ws.sets,
        ws.reps,
        ws.created_at
      FROM workout_sessions ws
      JOIN exercises e ON e.id = ws.exercise_id
      WHERE ws.user_id = $1
      ORDER BY ws.exercise_id, ws.weight DESC`,
      [Number(user_id)],
    );
    res.status(200).json(personal_records.rows);
  } catch (error) {
    console.error("There was an error getting the personal records", error);
    res
      .status(500)
      .json({ error: "There was an internal error", details: error });
  }
});
// start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
