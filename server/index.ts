import cors from "cors";
import { and, count, desc, eq, isNull } from "drizzle-orm";
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
const db = drizzle(pool, { logger: false });
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
      .values({
        user_id,
        exercise_id,
        sets,
        reps,
        weight,
        created_at: created_at ? new Date(created_at) : undefined,
      })
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
app.delete("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db
      .update(workout_sessions)
      .set({ deleted_at: new Date() })
      .where(eq(workout_sessions.id, Number(id)));
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("There was an error trying to delete session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// PATCH /sessions/:id — update a session's exercise/sets/reps/weight/date
app.patch("/api/sessions/:id", async (req, res) => {
  const { id } = req.params;
  const { exercise_id, sets, reps, weight, created_at } = req.body;
  try {
    const updated_session = await db
      .update(workout_sessions)
      .set({
        exercise_id,
        sets,
        reps,
        weight,
        created_at: created_at ? new Date(created_at) : undefined,
      })
      .where(eq(workout_sessions.id, Number(id)))
      .returning();
    res.status(200).json(updated_session[0]);
  } catch (error) {
    console.error("There was an error trying to update session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// PATCH /sessions/:id/restore — update a session so it comes back
app.patch("/api/sessions/:id/restore", async (req, res) => {
  const { id } = req.params;
  try {
    await db
      .update(workout_sessions)
      .set({ deleted_at: null })
      .where(eq(workout_sessions.id, Number(id)));
    res.status(200).json({ message: "Session updated successfully" });
  } catch (error) {
    console.error("There was an error trying to update session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
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

    conditions.push(`e.deleted_at IS NULL`);
    conditions.push(`ws.deleted_at IS NULL`);

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
       WHERE ws.deleted_at IS NULL AND e.deleted_at IS NULL AND ws.user_id = $1`,
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
// GET /leaderboard — top 20 users ranked by total sessions this week
app.get("/api/leaderboard", async (req, res) => {
  try {
    const all_users = await db
      .select({
        id: users.id,
        name: users.name,
        total_sessions: count(workout_sessions.id),
      })
      .from(users)
      .leftJoin(workout_sessions, eq(users.id, workout_sessions.user_id))
      .where(isNull(workout_sessions.deleted_at))
      .groupBy(users.id)
      .orderBy(desc(count(workout_sessions.id)))
      .limit(20);
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
        .where(
          and(
            eq(workout_sessions.user_id, user.id),
            isNull(workout_sessions.deleted_at),
          ),
        )
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
      "SELECT DISTINCT ON (ws.user_id) u.id, u.name, u.email, ws.* FROM users u LEFT JOIN workout_sessions ws ON ws.user_id = u.id AND ws.deleted_at IS NULL ORDER BY ws.user_id, ws.created_at DESC",
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
      .where(
        and(
          eq(workout_sessions.user_id, Number(id)),
          isNull(workout_sessions.deleted_at),
        ),
      )
      .orderBy(desc(workout_sessions.created_at))
      .limit(1);
    res.status(200).json(allWorkout[0]);
  } catch (error) {
    console.error("There was an error getting the last workout", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
app.get("/api/users", async (req, res) => {
  const { q, limit } = req.query;
  const MAX_LIMIT = 20;
  const DEFAULT_LIMIT = 8;

  try {
    let queryText = `SELECT id, name, email FROM users`;
    const queryParams: any[] = [];

    if (q) {
      queryParams.push(`${q}%`);
      queryText += ` WHERE name ILIKE $${queryParams.length}`;
    }

    queryText += " ORDER BY name ASC";

    const requestedLimit = Number(limit);
    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;
    queryParams.push(safeLimit);
    queryText += ` LIMIT $${queryParams.length}`;

    const result = await pool.query(queryText, queryParams);
    res.status(200).json(result.rows);
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
    queryText = `SELECT * FROM exercises WHERE to_tsvector('english', name) @@ to_tsquery('english', $1) AND deleted_at IS NULL`;
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
    WHERE to_tsvector('english', e.name) @@ to_tsquery('english', $1) AND ws.deleted_at IS NULL AND e.deleted_at IS NULL
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
    const all_exercises = await db
      .select()
      .from(exercises)
      .where(isNull(exercises.deleted_at));
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
      AND ws.deleted_at IS NULL
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
app.get("/api/progress", async (req, res) => {
  const { user_id, exercise_id } = req.query;
  if (!user_id || !exercise_id) {
    res.status(400).json({ error: "user_id and exercise_id are required" });
    return;
  }
  try {
    const progress = await pool.query(
      `SELECT
         ws.id,
         ws.created_at,
         ws.weight,
         ws.sets,
         ws.reps,
         (ws.sets * ws.reps * ws.weight) AS volume,
         MAX(ws.weight) OVER (
           ORDER BY ws.created_at ASC
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
         ) AS running_max_weight,
         e.name AS exercise,
         e.muscle_group
       FROM workout_sessions ws
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE ws.user_id = $1 AND ws.exercise_id = $2 AND ws.deleted_at IS NULL
       ORDER BY ws.created_at ASC`,
      [Number(user_id), Number(exercise_id)],
    );
    res.status(200).json(progress.rows);
  } catch (error) {
    console.error("There was an error getting progress data", error);
    res
      .status(500)
      .json({ error: "There was an internal error", details: error });
  }
});
app.post("/api/goals", async (req, res) => {
  const { user_id, exercise_id, target_weight } = req.body;
  if (!user_id || !exercise_id || !target_weight) {
    res
      .status(400)
      .json({ error: "user_id, exercise_id, and target_weight are required" });
    return;
  }
  if (Number(target_weight) <= 0) {
    res.status(400).json({ error: "target_weight must be a positive number" });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, exercise_id, target_weight)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, exercise_id)
       DO UPDATE SET target_weight = EXCLUDED.target_weight
       RETURNING *`,
      [Number(user_id), Number(exercise_id), Number(target_weight)],
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("There was an error setting the goal", error);
    res
      .status(500)
      .json({ error: "There was an internal error", details: error });
  }
});
app.get("/api/goals", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT
         g.id,
         g.user_id,
         g.exercise_id,
         e.name AS exercise,
         e.muscle_group,
         g.target_weight,
         COALESCE(best.current_best_weight, 0) AS current_best_weight,
         g.created_at
       FROM goals g
       JOIN exercises e ON e.id = g.exercise_id
       LEFT JOIN (
         SELECT DISTINCT ON (exercise_id)
           exercise_id, weight AS current_best_weight
         FROM workout_sessions
         WHERE user_id = $1
         AND deleted_at IS NULL
         ORDER BY exercise_id, weight DESC
       ) best ON best.exercise_id = g.exercise_id
       WHERE g.user_id = $1
       ORDER BY g.created_at DESC`,
      [Number(user_id)],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("There was an error getting the goals", error);
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
