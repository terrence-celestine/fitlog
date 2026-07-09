import { useEffect, useState } from "react";
import type { WorkoutSession } from "./HistoryItem";
import HistoryList from "./HistoryList";
import UserPicker from "./UserPicker";

const fieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const WorkoutHistory = () => {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<WorkoutSession[]>(
    [],
  );
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  useEffect(() => {
    if (selectedUser === null) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [sessionsRes, exercisesRes] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/sessions?page=${page}&limit=${limit}&user_id=${selectedUser}`,
          ),
          fetch(`${import.meta.env.VITE_API_URL}/exercises`),
        ]);

        if (!sessionsRes.ok) {
          throw new Error(
            `Failed to fetch sessions: ${sessionsRes.statusText}`,
          );
        }
        if (!exercisesRes.ok) {
          throw new Error(
            `Failed to fetch exercises: ${exercisesRes.statusText}`,
          );
        }

        const [sessionsData, exercisesData] = await Promise.all([
          sessionsRes.json(),
          exercisesRes.json(),
        ]);

        setSessions(sessionsData.sessions);
        setTotal(sessionsData.total);
        setLimit(sessionsData.limit);
        setFilteredSessions(sessionsData.sessions);
        setExercises(exercisesData);
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
  }, [page, limit, selectedUser]);
  useEffect(() => {
    let filtered = sessions;

    if (selectedUser) {
      filtered = filtered.filter((session) => session.user_id === selectedUser);
    }

    if (selectedExercise && selectedExercise !== "All exercises") {
      filtered = filtered.filter(
        (session) => session.exercise_id === parseInt(selectedExercise, 10),
      );
    }

    setFilteredSessions(filtered);
  }, [selectedUser, selectedExercise, sessions]);
  // The header + filters (including UserPicker) always render, regardless of
  // loading/error state. UserPicker owns picking the initial selectedUser via
  // its own mount-only fetch - if it were gated behind isLoading, it would
  // never mount, selectedUser would never be set, and isLoading would never
  // resolve (isLoading only clears once the sessions effect - which itself
  // requires selectedUser - finishes).
  return (
    <div className="space-y-8">
      {/* Page heading + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Workout History
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Every rep you&apos;ve put in the books.
          </p>
        </div>

        <div className="flex gap-2">
          <UserPicker selectedUserId={selectedUser} onSelect={setSelectedUser} />
          <select
            aria-label="Filter by exercise"
            className={fieldClass}
            value={selectedExercise}
            onChange={(event) => setSelectedExercise(event.target.value)}
          >
            <option className="bg-zinc-900">All exercises</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-zinc-800" />
                <div>
                  <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-800/70" />
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="h-8 w-8 animate-pulse rounded bg-zinc-800" />
                <div className="h-8 w-8 animate-pulse rounded bg-zinc-800" />
                <div className="h-8 w-8 animate-pulse rounded bg-zinc-800" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center"
        >
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-2xl">
            ⚠️
          </span>
          <h2 className="text-lg font-bold text-zinc-100">
            Couldn&apos;t load workout history
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
      )}

      {!isLoading && !error && (
        <>
          <HistoryList sessions={filteredSessions} />
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900/60"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-400">
                Page {page} of {Math.max(Math.ceil(total / limit), 1)}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900/60"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkoutHistory;
