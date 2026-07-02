import { useEffect, useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400";

const LogWorkout = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [usersRes, exercisesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/users`),
          fetch(`${import.meta.env.VITE_API_URL}/exercises`),
        ]);

        if (!usersRes.ok) {
          throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
        }
        if (!exercisesRes.ok) {
          throw new Error(
            `Failed to fetch exercises: ${exercisesRes.statusText}`,
          );
        }

        const [usersData, exercisesData] = await Promise.all([
          usersRes.json(),
          exercisesRes.json(),
        ]);

        setUsers(usersData);
        setExercises(exercisesData);

        if (usersData.length > 0) {
          setSelectedUser(usersData[0].id.toString());
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load initial data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUser(event.target.value);
  };

  const handleWorkoutSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const formData = new FormData(form);
    const userId = formData.get("user") as string;
    const exerciseId = formData.get("exercise") as string;
    const setsStr = formData.get("sets") as string;
    const repsStr = formData.get("reps") as string;
    const weightStr = formData.get("weight") as string;
    const dateStr = formData.get("date") as string;

    // Validation
    if (!userId || !exerciseId || !setsStr || !repsStr || !weightStr) {
      setSubmitError("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    const sets = parseInt(setsStr, 10);
    const reps = parseInt(repsStr, 10);
    const weight = parseInt(weightStr, 10);

    if (isNaN(sets) || sets <= 0) {
      setSubmitError("Sets must be a positive number.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(reps) || reps <= 0) {
      setSubmitError("Reps must be a positive number.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(weight) || weight < 0) {
      setSubmitError("Weight must be a non-negative number.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        user_id: parseInt(userId, 10),
        exercise_id: parseInt(exerciseId, 10),
        sets,
        reps,
        weight,
        created_at: dateStr
          ? new Date(dateStr).toISOString()
          : new Date().toISOString(),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to log session: ${response.statusText}`,
        );
      }

      setSubmitSuccess(true);
      // Reset form but keep the user selected (very common UX in gym tracking)
      form.reset();
    } catch (err) {
      console.error("Error logging workout session:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to log workout session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

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
        onSubmit={handleWorkoutSubmit}
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
              value={selectedUser}
              onChange={handleUserChange}
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
              min={1}
              required
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
              min={1}
              required
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
              required
              placeholder="135"
              className={fieldClass}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className={labelClass}>
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={todayStr}
              className={fieldClass}
            />
          </div>
        </div>

        {/* Submit Error Message */}
        {submitError && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {submitError}
          </div>
        )}

        {/* Submit Success Message */}
        {submitSuccess && (
          <div className="mt-5 rounded-xl border border-lime-500/30 bg-lime-500/5 px-4 py-3 text-sm text-lime-400">
            Workout session logged successfully! Keep up the great work! 💪
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="reset"
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-lime-400 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging..." : "Log Workout"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogWorkout;
