import { useCallback, useEffect, useRef, useState } from "react";
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
  const [deletedSession, setDeletedSession] = useState<WorkoutSession | null>(
    null,
  );
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (selectedUser === null) return;

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
        throw new Error(`Failed to fetch sessions: ${sessionsRes.statusText}`);
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
  }, [page, limit, selectedUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const handleSessionDeleted = (session: WorkoutSession) => {
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    setFilteredSessions((prev) => prev.filter((s) => s.id !== session.id));
    setDeletedSession(session);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setDeletedSession(null), 6000);
  };

  const handleUndo = async () => {
    if (!deletedSession) return;
    const session = deletedSession;
    setDeletedSession(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/${session.id}/restore`,
        { method: "PATCH" },
      );
      if (!response.ok) {
        throw new Error(`Failed to restore session: ${response.statusText}`);
      }
      await fetchData();
    } catch (err) {
      console.error("Error restoring session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to restore session",
      );
    }
  };
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

      {deletedSession && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-lime-500/30 bg-lime-500/5 px-4 py-3 text-sm text-lime-400">
          <span>
            Deleted <span className="font-semibold">{deletedSession.exercise}</span>{" "}
            session.
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="shrink-0 rounded-lg border border-lime-400/40 px-3 py-1.5 text-xs font-bold text-lime-300 transition hover:bg-lime-400/10"
          >
            Undo
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <HistoryList
            sessions={filteredSessions}
            exercises={exercises}
            onSessionDeleted={handleSessionDeleted}
            onSessionUpdated={fetchData}
          />
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
