import HistoryList from "./HistoryList";
import type { WorkoutSession } from "./HistoryItem";
import { useEffect, useState } from "react";

const fieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const WorkoutHistory = () => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<WorkoutSession[]>(
    [],
  );
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [usersRes, sessionsRes, exercisesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/users`),
          fetch(`${import.meta.env.VITE_API_URL}/sessions`),
          fetch(`${import.meta.env.VITE_API_URL}/exercises`),
        ]);

        if (!usersRes.ok) {
          throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
        }
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

        const [usersData, sessionsData, exercisesData] = await Promise.all([
          usersRes.json(),
          sessionsRes.json(),
          exercisesRes.json(),
        ]);

        setUsers(usersData);
        setSessions(sessionsData);
        setFilteredSessions(sessionsData);
        setExercises(exercisesData);
        console.log(usersData);
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
  useEffect(() => {
    let filtered = sessions;

    if (selectedUser) {
      filtered = filtered.filter(
        (session) => session.user_id === parseInt(selectedUser, 10),
      );
    }

    if (selectedExercise && selectedExercise !== "All exercises") {
      filtered = filtered.filter(
        (session) => session.exercise_id === parseInt(selectedExercise, 10),
      );
    }

    setFilteredSessions(filtered);
  }, [selectedUser, selectedExercise, sessions]);
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Heading + filters placeholder */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-8 w-52 animate-pulse rounded-lg bg-zinc-800" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-800/70" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-800" />
            <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        </div>

        {/* Session row skeletons */}
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
    );
  }

  if (!selectedUser) return <div>Please select a user</div>;
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
          <select
            aria-label="Filter by user"
            className={fieldClass}
            value={selectedUser}
            onChange={(event) => setSelectedUser(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
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

      <HistoryList sessions={filteredSessions} />
    </div>
  );
};

export default WorkoutHistory;
