import HistoryList from "./HistoryList";
import type { WorkoutSession } from "./HistoryItem";

// TODO: wire up state + data fetching
//   - selectedUser / userFilter -> useState
//   - exerciseFilter            -> useState
//   - fetch sessions            -> GET /sessions?user_id=<id>&exercise=<name>
//   - loading / error states

// TODO: replace with data from GET /sessions
const sessions: WorkoutSession[] = [
  {
    id: 1,
    exercise: "Bench Press",
    muscleGroup: "Chest",
    sets: 4,
    reps: 8,
    weight: 155,
    createdAt: "2026-07-01",
  },
  {
    id: 2,
    exercise: "Deadlift",
    muscleGroup: "Back",
    sets: 3,
    reps: 5,
    weight: 275,
    createdAt: "2026-06-29",
  },
  {
    id: 3,
    exercise: "Squat",
    muscleGroup: "Legs",
    sets: 5,
    reps: 5,
    weight: 225,
    createdAt: "2026-06-27",
  },
];

const fieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const WorkoutHistory = () => {
  return (
    <div className="space-y-8">
      {/* Page heading + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Workout History
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {/* TODO: {sessions.length} sessions */}
            Every rep you&apos;ve put in the books.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            aria-label="Filter by user"
            /* TODO: value + onChange */
            className={fieldClass}
          >
            <option className="bg-zinc-900">All athletes</option>
          </select>
          <select
            aria-label="Filter by exercise"
            /* TODO: value + onChange */
            className={fieldClass}
          >
            <option className="bg-zinc-900">All exercises</option>
          </select>
        </div>
      </div>

      <HistoryList sessions={sessions} />
    </div>
  );
};

export default WorkoutHistory;
