import { useState } from "react";
import EditSessionModal from "./EditSessionModal";

// A single logged workout session row.

export type WorkoutSession = {
  id: number;
  user_id: number;
  exercise_id: number;
  exercise: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
  createdAt: string; // ISO date
};

export type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
};

type DeleteStatus = "idle" | "confirming" | "deleting" | "error";

const HistoryItem = ({
  session,
  exercises,
  onDeleted,
  onUpdated,
}: {
  session: WorkoutSession;
  exercises: Exercise[];
  onDeleted: (session: WorkoutSession) => void;
  onUpdated: () => void;
}) => {
  const [status, setStatus] = useState<DeleteStatus>("idle");
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirmDelete = async () => {
    setStatus("deleting");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/${session.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }
      onDeleted(session);
    } catch (err) {
      console.error("Error deleting session:", err);
      setStatus("error");
    }
  };

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
            {session.muscleGroup} · {/* TODO: format createdAt */}
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

      {/* Edit / Delete actions */}
      <div className="flex shrink-0 items-center gap-2">
        {status === "idle" && (
          <>
            <button
              type="button"
              aria-label="Edit session"
              onClick={() => setIsEditing(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5m-1.5-9.5a2.121 2.121 0 0 1 3 3L12 16l-4 1 1-4 9.5-9.5Z"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Delete session"
              onClick={() => setStatus("confirming")}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 7h10Z"
                />
              </svg>
            </button>
          </>
        )}

        {(status === "confirming" || status === "error") && (
          <div className="flex items-center gap-1.5">
            {status === "error" && (
              <span className="text-xs text-red-400">Failed</span>
            )}
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              {status === "error" ? "Retry" : "Confirm"}
            </button>
          </div>
        )}

        {status === "deleting" && (
          <span className="px-2.5 py-1.5 text-xs font-semibold text-zinc-500">
            Deleting…
          </span>
        )}
      </div>

      {isEditing && (
        <EditSessionModal
          session={session}
          exercises={exercises}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            onUpdated();
          }}
        />
      )}
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
