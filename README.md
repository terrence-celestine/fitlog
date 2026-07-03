# FitLog

A personal workout logging app built to learn raw SQL, indexes, and query optimization from the ground up. No ORM until the comparison section — every query is written by hand with node-postgres.

**Live:** [fitlog.theteecee.dev](https://fitlog.theteecee.dev)

---

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Backend  | Node.js + Express 5                      |
| Database | Neon Postgres (node-postgres / pg)       |
| ORM      | Drizzle (comparison only — see below)    |
| Deploy   | Vercel (frontend) + Railway (backend)    |

---

## Features

- Log workout sessions (exercise, sets, reps, weight)
- View session history filtered by user or exercise
- Leaderboard ranked by total sessions this week
- N+1 demonstration endpoint with query count logging
- N+1 fixed endpoint using a single JOIN query
- Raw SQL vs Drizzle ORM comparison

---

## Schema

```
users
  id          SERIAL PRIMARY KEY
  name        VARCHAR(255) NOT NULL
  email       VARCHAR(255) NOT NULL UNIQUE
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP

exercises
  id            SERIAL PRIMARY KEY
  name          VARCHAR(255) NOT NULL
  muscle_group  VARCHAR(255) NOT NULL
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP

workout_sessions
  id           SERIAL PRIMARY KEY
  user_id      INT NOT NULL REFERENCES users(id)
  exercise_id  INT NOT NULL REFERENCES exercises(id)
  sets         INT NOT NULL
  reps         INT NOT NULL
  weight       INT NOT NULL
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Design decisions:**

- `workout_sessions` uses foreign keys to `users` and `exercises` — enforces referential integrity at the DB level
- `exercise_id` instead of storing exercise name as a string — avoids data duplication and enables GROUP BY across exercises
- `created_at` on sessions enables time-based leaderboard filtering without a separate date table

---

## API Endpoints

| Method | Endpoint                                       | Description                                  |
| ------ | ---------------------------------------------- | -------------------------------------------- |
| POST   | `/api/users`                                   | Create a user                                |
| POST   | `/api/exercises`                               | Create an exercise                           |
| POST   | `/api/sessions`                                | Log a workout session                        |
| GET    | `/api/sessions?user_id=1`                      | Get all sessions for a user                  |
| GET    | `/api/sessions?user_id=1&exercise=Bench+Press` | Filter by user and exercise                  |
| GET    | `/api/leaderboard`                             | All users ranked by total sessions this week |
| GET    | `/api/users/last-workouts`                     | All users + last workout (N+1 version)       |
| GET    | `/api/users/last-workouts-fixed`               | All users + last workout (single JOIN)       |
| GET    | `/api/users/:id/last-workout`                  | Single user's last workout                   |

---

## Key Learnings

### N+1 Problem

**The bug:** Fetching all users then querying each user's last workout individually inside a loop.

```
Query 1: fetched all users
Query 2: fetched last workout for user 1
Query 3: fetched last workout for user 2
Query 4: fetched last workout for user 3
```

With 3 users that's 4 queries. With 1,000 users that's 1,001 queries — each a separate network round trip between Express and Postgres.

**The fix:** A single query using `DISTINCT ON` to get the most recent workout per user in one round trip.

See: `GET /api/users/last-workouts` vs `GET /api/users/last-workouts-fixed`

---

### EXPLAIN ANALYZE

Running `EXPLAIN ANALYZE` on the leaderboard query before and after adding an index on `workout_sessions.user_id`:

**Before index:**

```
Seq Scan on workout_sessions
  cost=0.00..2145.00 rows=1 width=48
  actual time=0.043..18.721 ms
```

**After index:**

```
Index Scan using idx_sessions_user_id on workout_sessions
  cost=0.00..8.28 rows=1 width=48
  actual time=0.021..0.089 ms
```

Postgres was scanning every row to find sessions for a given user. The index lets it jump directly to the matching rows.

**Composite index** added on `(user_id, created_at)` for queries that filter by user and sort by date — equality column first, range column second.

---

### Raw SQL vs Drizzle ORM

Three queries were rewritten using Drizzle to compare output.

**Raw SQL — leaderboard:**

```sql
SELECT u.name, COUNT(ws.id) as total_sessions
FROM users u
LEFT JOIN workout_sessions ws ON ws.user_id = u.id
GROUP BY u.name
ORDER BY total_sessions DESC
```

**Drizzle equivalent generates:**

```sql
select "users"."name", count("workout_sessions"."id") as "total_sessions"
from "users"
left join "workout_sessions" on "workout_sessions"."user_id" = "users"."id"
group by "users"."name"
order by "total_sessions" desc
```

Functionally identical — Drizzle wraps identifiers in quotes and aliases columns consistently. The ORM is trustworthy for standard queries but raw SQL is still preferable when you need `DISTINCT ON`, window functions, or complex CTEs that Drizzle can't express cleanly.

---

## Local Setup

```bash
# Clone the repo
git clone https://github.com/terrence-celestine/fitlog
cd fitlog

# Install server dependencies
cd server
npm install

# Set up environment variables
cp .env.example .env
# Add your DATABASE_URL from Neon and FRONTEND_URL

# Run the server
npm run dev

# In a separate terminal — install and run the client
cd ../client
npm install
npm run dev
```

**Environment variables (server):**

```
DATABASE_URL=your_neon_connection_string
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Environment variables (client):**

```
VITE_API_URL=http://localhost:3000
```

---

## Deployment

- **Frontend:** Vercel — root directory set to `client`
- **Backend:** Railway — root directory set to `server`, build command `npm install && npm run build`, start command `npm start`
- **Database:** Neon Postgres — connection string added to Railway environment variables
