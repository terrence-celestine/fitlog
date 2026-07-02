import express from "express";
import cors from "cors";
import pool from "./db/client";

// setup the app start
const app = express();
app.use(cors()); // allow cors requests
app.use(express.json()); // parse JSON

// POST /users — create a user
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email],
    );
    res.status(201).json(user.rows[0]);
  } catch (error) {
    console.error("There was an error creating the user", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// POST /exercises — create an exercise
app.post("/api/exercises", async (req, res) => {
  const { name, muscle_group } = req.body;
  try {
    const work_out = await pool.query(
      "INSERT INTO exercises (name, muscle_group) VALUES ($1, $2) RETURNING *",
      [name, muscle_group],
    );
    res.status(201).json(work_out.rows[0]);
  } catch (error) {
    console.error("There was an error creating the workout", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// POST /sessions — log a workout session
app.post("/api/sessions", async (req, res) => {
  const { user_id, exercise_id, sets, reps, weight, created_at } = req.body;
  try {
    const created_session = await pool.query(
      "INSERT INTO workout_sessions (user_id, exercise_id, sets, reps, weight, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [user_id, exercise_id, sets, reps, weight, created_at],
    );
    res.status(201).json(created_session.rows[0]);
  } catch (error) {
    console.error("There was an error creating the workout session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET /sessions?user_id=1 — get all sessions for a user
// GET /sessions?user_id=1&exercise=Bench+Press — filter by exercise
app.get(`/api/sessions`, async (req, res) => {
  const { user_id, exercise } = req.query;
  let user_session;
  try {
    if (exercise) {
      user_session = await pool.query(
        "SELECT ws.* FROM workout_sessions ws JOIN exercises e ON e.id = ws.exercise_id WHERE ws.user_id = $1 AND e.name = $2",
        [user_id, exercise],
      );
    } else {
      user_session = await pool.query(
        "SELECT * FROM workout_sessions WHERE user_id = $1",
        [user_id],
      );
    }
    res.status(200).json(user_session.rows);
  } catch (error) {
    console.error("There was an error trying to find session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET /leaderboard — all users ranked by total sessions this week
app.get("/api/leaderboard", async (req, res) => {
  try {
    const all_users = await pool.query(
      "SELECT u.name, COUNT(ws.id) as total_sessions FROM users u LEFT JOIN workout_sessions ws ON ws.user_id = u.id GROUP BY u.name ORDER BY total_sessions DESC",
    );
    res.status(200).json(all_users.rows);
  } catch (error) {
    console.error("There was an error getting the leaderboard", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/users/last-workouts", async (req, res) => {
  try {
    const all_users = await pool.query("SELECT * FROM users");
    console.log("Query 1: fetched all users");
    for (const user of all_users.rows) {
      const user_last_workout = await pool.query(
        "SELECT ws.* FROM workout_sessions ws WHERE ws.user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [user.id],
      );
      console.log(
        `Query ${all_users.rows.indexOf(user) + 2}: fetched last workout for user ${user.id}`,
      );

      user.last_workout = user_last_workout.rows[0];
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
    const allWorkout = await pool.query(
      "SELECT * FROM workout_sessions ws WHERE ws.user_id = $1 ORDER BY ws.created_at DESC LIMIT 1",
      [id],
    );
    res.status(200).json(allWorkout.rows[0]);
  } catch (error) {
    console.error("There was an error getting the last workout", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
app.get("/api/users", async (req, res) => {
  try {
    const all_users = await pool.query("SELECT * FROM users");
    res.status(200).json(all_users.rows);
  } catch (error) {
    console.error("There was an error getting the users", error);
    res.status(500).json({ error: "There was an internal error" });
  }
});
// start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
