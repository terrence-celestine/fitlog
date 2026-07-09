import HistoryItem, { type Exercise, type WorkoutSession } from "./HistoryItem";

const HistoryList = ({
  sessions,
  exercises,
  onSessionDeleted,
  onSessionUpdated,
}: {
  sessions: WorkoutSession[];
  exercises: Exercise[];
  onSessionDeleted: (session: WorkoutSession) => void;
  onSessionUpdated: () => void;
}) => {
  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
          🏋️
        </span>
        <p className="font-semibold text-zinc-200">No workouts logged yet</p>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Once you log a session it will show up here. Time to hit the gym.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <HistoryItem
          key={session.id}
          session={session}
          exercises={exercises}
          onDeleted={onSessionDeleted}
          onUpdated={onSessionUpdated}
        />
      ))}
    </ul>
  );
};

export default HistoryList;
