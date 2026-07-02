// A single logged workout session row.

export type WorkoutSession = {
  id: number;
  user_id: number;
  exercise_id: number;
  exercise: string; // TODO: join exercise name from exercise_id
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
  createdAt: string; // ISO date
};

const HistoryItem = ({ session }: { session: WorkoutSession }) => {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700 sm:p-5">
      <div className="flex min-w-0 items-center gap-4">
        {/* Muscle group icon/initial */}
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-sm font-bold text-lime-400">
          {session.muscleGroup.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-100">
            {session.exercise}
          </p>
          <p className="text-xs text-zinc-400">
            {session.muscleGroup} ·{" "}
            {/* TODO: format createdAt */}
            {new Date(session.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Stat label="Sets" value={session.sets} />
        <Stat label="Reps" value={session.reps} />
        <Stat label="lbs" value={session.weight} highlight />
      </div>
    </li>
  );
};

const Stat = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div className="text-right">
    <p
      className={`text-base font-bold tabular-nums ${
        highlight ? "text-lime-400" : "text-zinc-100"
      }`}
    >
      {value}
    </p>
    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
      {label}
    </p>
  </div>
);

export default HistoryItem;
