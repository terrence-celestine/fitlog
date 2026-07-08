import { useEffect, useState } from "react";

type Goal = {
  id: number;
  user_id: number;
  exercise_id: number;
  exercise: string;
  muscle_group: string;
  target_weight: number;
  current_best_weight: number;
  created_at: string;
};

type User = { id: number; name: string };
type Exercise = { id: number; name: string; muscle_group: string };

const fieldClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400";

const Goals = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);

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
          setSelectedUser(usersData[0].id);
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

  const fetchGoals = async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/goals?user_id=${selectedUser}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to fetch goals");
      }
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setGoalsError(err instanceof Error ? err.message : "Failed to fetch goals");
    } finally {
      setGoalsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedUser) return;
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUser(Number(event.target.value));
  };

  const handleGoalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const formData = new FormData(form);
    const exerciseId = formData.get("exercise") as string;
    const targetWeightStr = formData.get("target_weight") as string;

    if (!exerciseId || !targetWeightStr) {
      setSubmitError("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    const targetWeight = parseInt(targetWeightStr, 10);
    if (isNaN(targetWeight) || targetWeight <= 0) {
      setSubmitError("Target weight must be a positive number.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        user_id: selectedUser,
        exercise_id: parseInt(exerciseId, 10),
        target_weight: targetWeight,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to save goal: ${response.statusText}`,
        );
      }

      setSubmitSuccess(true);
      form.reset();
      await fetchGoals();
    } catch (err) {
      console.error("Error setting goal:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-800/70" />
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20 sm:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={i < 2 ? "sm:col-span-2" : ""}>
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-zinc-800" />
              </div>
            ))}
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
          Couldn&apos;t load goal data
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Goals
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Set a target weight and track your progress toward it.
        </p>
      </div>

      <form
        onSubmit={handleGoalSubmit}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

          <div className="sm:col-span-2">
            <label htmlFor="target_weight" className={labelClass}>
              Target Weight (lbs)
            </label>
            <input
              id="target_weight"
              name="target_weight"
              type="number"
              min={1}
              required
              placeholder="225"
              className={fieldClass}
            />
          </div>
        </div>

        {submitError && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mt-5 rounded-xl border border-lime-500/30 bg-lime-500/5 px-4 py-3 text-sm text-lime-400">
            Goal saved! Keep chasing it. 🎯
          </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-lime-400 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Set Goal"}
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-bold text-zinc-100">Your Goals</h2>

        {goalsLoading ? (
          <div className="mt-3 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-zinc-900/40"
              />
            ))}
          </div>
        ) : goalsError ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
          >
            {goalsError}
          </div>
        ) : goals.length === 0 ? (
          <div className="mt-3 grid place-items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
              🎯
            </span>
            <p className="font-semibold text-zinc-200">
              No goals set for this athlete yet
            </p>
            <p className="mt-1 max-w-xs text-sm text-zinc-500">
              Set a target weight above to start tracking progress toward a
              new PR.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {goals.map((goal) => {
              const percent = Math.min(
                100,
                Math.round(
                  (goal.current_best_weight / goal.target_weight) * 100,
                ),
              );
              const achieved = goal.current_best_weight >= goal.target_weight;
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {goal.exercise}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {goal.muscle_group}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-lime-400">
                      {goal.target_weight} lbs target
                    </p>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-lime-400 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      {goal.current_best_weight} / {goal.target_weight} lbs (
                      {percent}%)
                    </span>
                    {achieved && (
                      <span className="font-semibold text-lime-400">
                        Goal reached! 🎉
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
