# FitLog

A personal workout logging app built to learn raw SQL, indexes, and query optimization from the ground up. Drizzle ORM handles straightforward CRUD (users, exercises, sessions, leaderboard); raw SQL is kept deliberately for the queries where it earns its keep — window functions, `DISTINCT ON`, full-text search, and the N+1 comparison.

**Live:** [fitlog.theteecee.dev](https://fitlog.theteecee.dev)

---

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Backend  | Node.js + Express 5                      |
| Database | Neon Postgres (node-postgres / pg)       |
| ORM      | Drizzle (CRUD) + raw SQL (complex queries) |
| Deploy   | Vercel (frontend) + Railway (backend)    |

---

## Features

- Log workout sessions (exercise, sets, reps, weight)
- View session history filtered by user or exercise
- Edit or soft delete/restore workout sessions from history
- Paginated session history with total count
- Leaderboard ranked by total sessions
- Personal records per exercise per user
- Per-user aggregate stats — total volume, heaviest lift, most-trained muscle group, favorite exercise
- Goal tracking per exercise with progress toward target weight
- Progress charts over time (Recharts)
- Typeahead user search, reused as a shared picker across pages
- Full-text search across exercises, users, and sessions
- N+1 demonstration and fix endpoints
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
  name          VARCHAR(255) NOT NULL UNIQUE
  muscle_group  VARCHAR(255) NOT NULL
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  deleted_at    TIMESTAMP

workout_sessions
  id           SERIAL PRIMARY KEY
  user_id      INT NOT NULL REFERENCES users(id)
  exercise_id  INT NOT NULL REFERENCES exercises(id)
  sets         INT NOT NULL
  reps         INT NOT NULL
  weight       INT NOT NULL
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  deleted_at   TIMESTAMP

goals
  id             SERIAL PRIMARY KEY
  user_id        INT NOT NULL REFERENCES users(id)
  exercise_id    INT NOT NULL REFERENCES exercises(id)
  target_weight  INT NOT NULL
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  deleted_at     TIMESTAMP
  UNIQUE(user_id, exercise_id)
```

**Design decisions:**

- `workout_sessions` uses foreign keys to `users` and `exercises` — enforces referential integrity at the DB level
- `exercise_id` instead of storing exercise name as a string — avoids data duplication and enables GROUP BY across exercises
- `created_at` on sessions enables time-based leaderboard filtering without a separate date table
- `deleted_at` on sessions and exercises enables soft deletes — rows are never permanently removed

---

## API Endpoints

| Method | Endpoint                                       | Description                                                    |
| ------ | ---------------------------------------------- | -------------------------------------------------------------- |
| POST   | `/api/users`                                   | Create a user                                                  |
| GET    | `/api/users?q=ben&limit=8`                     | Typeahead user search (limit capped at 20, default 8)          |
| GET    | `/api/users/aggregate/:id`                     | Per-user aggregate stats — total volume, heaviest lift, most-trained muscle group, favorite exercise |
| POST   | `/api/exercises`                               | Create an exercise                                             |
| POST   | `/api/sessions`                                | Log a workout session                                          |
| PATCH  | `/api/sessions/:id`                            | Edit a session's exercise, sets, reps, weight, or date          |
| GET    | `/api/sessions?user_id=1`                      | Get all sessions for a user                                    |
| GET    | `/api/sessions?user_id=1&exercise=Bench+Press` | Filter by user and exercise                                    |
| GET    | `/api/sessions?user_id=1&page=1&limit=10`      | Paginated sessions with total count                            |
| DELETE | `/api/sessions/:id`                            | Soft delete a session — sets `deleted_at` to current timestamp |
| PATCH  | `/api/sessions/:id/restore`                    | Restore a soft deleted session — sets `deleted_at` to NULL     |
| GET    | `/api/leaderboard`                             | All users ranked by total sessions                             |
| GET    | `/api/personal-records?user_id=1`              | Heaviest lift per exercise per user                            |
| GET    | `/api/search?q=bench&type=exercise`            | Full-text search (type: exercise, user, session)               |
| GET    | `/api/progress?user_id=1&exercise_id=1`        | Weight progress over time with running max                     |
| GET    | `/api/goals?user_id=1`                         | User goals with current best weight                            |
| POST   | `/api/goals`                                   | Set or update a goal                                           |
| GET    | `/api/users/last-workouts`                     | All users + last workout (N+1 version)                         |
| GET    | `/api/users/last-workouts-fixed`               | All users + last workout (single JOIN)                         |
| GET    | `/api/users/:id/last-workout`                  | Single user's last workout                                     |
| GET    | `/api/pool-stats`                              | pg connection pool diagnostics (total/idle/waiting)             |

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

### EXPLAIN ANALYZE & Indexes

**Indexes created:**

```sql
CREATE INDEX idx_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_sessions_user_created ON workout_sessions(user_id, created_at);
```

**What we found:**

With only 18 rows, Postgres ignored both indexes and chose a seq scan — correctly. A seq scan on a small table is faster than the overhead of an index lookup.

Forced the index with `SET enable_seqscan = off` to verify behavior:

- Seq scan execution time: **0.134ms**
- Index scan execution time: **0.091ms**

At scale the difference compounds. With millions of rows Postgres would choose the index automatically.

**Composite index column order matters** — `user_id` first (equality filter), `created_at` second (sort/range). Flipping the order makes the index far less useful for queries that filter by user and order by date.

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
group by "users"."id"
order by count("workout_sessions"."id") desc
```

Key differences:

- Drizzle quotes every identifier
- Drizzle selects specific columns, never `SELECT *`
- `GROUP BY` uses `users.id` instead of `users.name`

**When to go around the ORM:**

- `DISTINCT ON` queries — Drizzle cannot express this
- Window functions — `MAX() OVER (PARTITION BY ...)`
- Complex CTEs
- Any query requiring Postgres-specific syntax

---

### Full-Text Search

Uses Postgres `tsvector` and `tsquery` for language-aware search.

```sql
SELECT * FROM exercises
WHERE to_tsvector('english', name) @@ to_tsquery('english', $1)
AND deleted_at IS NULL
```

The `'english'` dictionary handles stemming — "squats" matches "squat", "benching" matches "bench press".

Supports three search types via `?type=exercise|user|session`.

---

### Pagination

`GET /api/sessions?user_id=1&page=2&limit=10`

Offset calculated in JavaScript before the query:

```ts
const offset = (Number(page) - 1) * Number(limit);
```

Response includes `total` from a separate COUNT query so the frontend knows the total number of pages.

---

### Window Functions & Personal Records

`DISTINCT ON (exercise_id)` with `ORDER BY weight DESC` returns the heaviest lift per exercise per user in a single query — no subqueries, no application-level grouping.

```sql
SELECT DISTINCT ON (exercise_id)
  ws.exercise_id,
  e.name AS exercise,
  ws.weight AS personal_record
FROM workout_sessions ws
JOIN exercises e ON e.id = ws.exercise_id
WHERE ws.user_id = $1 AND ws.deleted_at IS NULL
ORDER BY ws.exercise_id, ws.weight DESC
```

---

### Soft Deletes

Instead of permanently removing rows, sessions are soft deleted by setting a `deleted_at` timestamp. This preserves data for recovery, audit trails, and undo functionality.

**How it works:**

- Every `SELECT` query filters `WHERE deleted_at IS NULL` — deleted rows are invisible to the app
- `DELETE /api/sessions/:id` sets `deleted_at = NOW()` — row stays in the database
- `PATCH /api/sessions/:id/restore` sets `deleted_at = NULL` — row reappears

**Why production apps use this:**

- Account recovery — "reactivate within 30 days" only works if the data still exists
- Audit trails — financial and healthcare apps legally cannot hard delete records
- Support tickets — "I accidentally deleted my data" is recoverable
- Analytics — deleted users still contribute to churn analysis

**The trade-off:** Every query must include `WHERE deleted_at IS NULL`. Miss it once and deleted records show up in your UI.

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
# Create a .env file in server/ with DATABASE_URL (from Neon), FRONTEND_URL, and PORT — see below

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
VITE_API_URL=http://localhost:3000/api
```

---

## Deployment

- **Frontend:** Vercel — root directory set to `client`
- **Backend:** Railway — root directory set to `server`, build command `npm install && npm run build`, start command `npm start`
- **Database:** Neon Postgres — connection string added to Railway environment variables
