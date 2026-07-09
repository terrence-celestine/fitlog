import { useEffect, useState } from "react";
import UserPicker from "./UserPicker";

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

const fieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const PersonalRecords = () => {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");

  useEffect(() => {
    if (selectedUser === null) return;

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

  // The header + filters (including UserPicker) always render, regardless of
  // loading/error state - see History.tsx for why UserPicker can't be gated
  // behind isLoading (it owns picking the initial selectedUser).
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
          <UserPicker selectedUserId={selectedUser} onSelect={setSelectedUser} />
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

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-zinc-900/40"
            />
          ))}
        </div>
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
      )}

      {!isLoading && !error && filteredRecords.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
            🏆
          </span>
          <p className="font-semibold text-zinc-200">No personal records yet</p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Log a workout to start setting records.
          </p>
        </div>
      )}

      {!isLoading && !error && filteredRecords.length > 0 && (
        <ul className="space-y-3">
          {filteredRecords.map((record) => (
            <li
              key={record.exercise_id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700 sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-sm font-bold text-lime-400">
                  {record.muscle_group.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">
                    {record.exercise}
                  </p>
                  <p className="text-xs text-zinc-400">{record.muscle_group}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-bold tabular-nums text-lime-400">
                  {record.personal_record}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  lbs
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PersonalRecords;
