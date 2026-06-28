-- Database — raw SQL with pg

-- users — id, name, email, created_at
-- exercises — id, name, muscle_group
-- workout_sessions — id, user_id, exercise_id, sets, reps, weight, created_at
-- sets — optional, add if you want more granularity

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    muscle_group VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    exercise_id INT NOT NULL REFERENCES exercises(id),
    sets INT NOT NULL,
    reps INT NOT NULL,
    weight INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);