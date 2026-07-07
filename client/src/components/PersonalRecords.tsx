import { useEffect, useState } from "react";

type PersonalRecord = {
  user_id: number;
  exercise_id: number;
  exercise: string;
  muscle_group: string;
  personal_record: number;
  sets: number;
  reps: number;
  created_at: string;
};

type User = { id: number; name: string };

const fieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const PersonalRecords = () => {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`);
      const data = await response.json();
      setUsers(data);
      if (data.length > 0) {
        setSelectedUser(data[0].id);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchPersonalRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/personal-records?user_id=${selectedUser}`,
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error ?? "Failed to fetch personal records");
        }
        const data = await response.json();
        setPersonalRecords(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch personal records",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPersonalRecords();
  }, [selectedUser]);

  const muscleGroups = [
    ...new Set(personalRecords.map((record) => record.muscle_group)),
  ];

  const filteredRecords = selectedMuscleGroup
    ? personalRecords.filter(
        (record) => record.muscle_group === selectedMuscleGroup,
      )
    : personalRecords;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-52 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-800/70" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-zinc-900/40"
            />
          ))}
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
          Couldn&apos;t load personal records
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Personal Records
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Your best lift for every exercise.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            aria-label="Filter by user"
            className={fieldClass}
            value={selectedUser}
            onChange={(event) => setSelectedUser(Number(event.target.value))}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by muscle group"
            className={fieldClass}
            value={selectedMuscleGroup}
            onChange={(event) => setSelectedMuscleGroup(event.target.value)}
          >
            <option value="">All muscle groups</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
            🏆
          </span>
          <p className="font-semibold text-zinc-200">No personal records yet</p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Log a workout to start setting records.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 sm:px-5">Exercise</th>
                <th className="px-4 py-3 sm:px-5">Muscle Group</th>
                <th className="px-4 py-3 text-right sm:px-5">
                  Personal Record
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredRecords.map((record) => (
                <tr
                  key={record.exercise_id}
                  className="bg-zinc-900/20 transition hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3 font-semibold text-zinc-100 sm:px-5">
                    {record.exercise}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 sm:px-5">
                    {record.muscle_group}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-lime-400 sm:px-5">
                    {record.personal_record} lbs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PersonalRecords;
