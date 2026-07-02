// TODO: wire up state + data fetching
//   - fetch users        -> GET  /users
//   - fetch exercises    -> GET  /exercises   (add endpoint)
//   - selectedUser       -> useState
//   - handleUserChange   -> update selectedUser
//   - handleWorkoutSubmit-> POST /sessions { user_id, exercise_id, sets, reps, weight }
//   - loading / error / success states

import { useEffect, useState } from "react";

// TODO: replace with data from GET /exercises
const exercises: { id: number; name: string; muscle_group: string }[] = [
  { id: 1, name: "Bench Press", muscle_group: "Chest" },
];

const fieldClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400";

const LogWorkout = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load users",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Heading placeholder */}
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-800/70" />
        </div>

        {/* Form skeleton */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20 sm:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={i < 2 ? "sm:col-span-2" : ""}>
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <div className="h-10 w-20 animate-pulse rounded-xl bg-zinc-800/70" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center"
      >
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-2xl">
          ⚠️
        </span>
        <h2 className="text-lg font-bold text-zinc-100">
          Couldn&apos;t load workout data
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
        >
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Log a Workout
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Record your sets, reps, and weight to keep your streak alive.
        </p>
      </div>

      <form
        /* TODO: onSubmit={handleWorkoutSubmit} */
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Who */}
          <div className="sm:col-span-2">
            <label htmlFor="user" className={labelClass}>
              Athlete
            </label>
            <select
              id="user"
              name="user"
              /* TODO: value + onChange={handleUserChange} */
              className={fieldClass}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-zinc-900">
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise */}
          <div className="sm:col-span-2">
            <label htmlFor="exercise" className={labelClass}>
              Exercise
            </label>
            <select id="exercise" name="exercise" className={fieldClass}>
              {exercises.map((exercise) => (
                <option
                  key={exercise.id}
                  value={exercise.id}
                  className="bg-zinc-900"
                >
                  {exercise.name} — {exercise.muscle_group}
                </option>
              ))}
            </select>
          </div>

          {/* Sets */}
          <div>
            <label htmlFor="sets" className={labelClass}>
              Sets
            </label>
            <input
              id="sets"
              name="sets"
              type="number"
              min={0}
              placeholder="3"
              className={fieldClass}
            />
          </div>

          {/* Reps */}
          <div>
            <label htmlFor="reps" className={labelClass}>
              Reps
            </label>
            <input
              id="reps"
              name="reps"
              type="number"
              min={0}
              placeholder="10"
              className={fieldClass}
            />
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className={labelClass}>
              Weight (lbs)
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              min={0}
              placeholder="135"
              className={fieldClass}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className={labelClass}>
              Date
            </label>
            <input id="date" name="date" type="date" className={fieldClass} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="reset"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100"
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded-xl bg-lime-400 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
          >
            Log Workout
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogWorkout;
