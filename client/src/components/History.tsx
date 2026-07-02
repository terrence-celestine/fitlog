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
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
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
