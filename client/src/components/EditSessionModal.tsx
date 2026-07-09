import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Exercise, WorkoutSession } from "./HistoryItem";

const fieldClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400";

const EditSessionModal = ({
  session,
  exercises,
  onClose,
  onSaved,
}: {
  session: WorkoutSession;
  exercises: Exercise[];
  onClose: () => void;
  onSaved: (session: WorkoutSession) => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const exerciseId = formData.get("exercise") as string;
    const setsStr = formData.get("sets") as string;
    const repsStr = formData.get("reps") as string;
    const weightStr = formData.get("weight") as string;
    const dateStr = formData.get("date") as string;

    const sets = parseInt(setsStr, 10);
    const reps = parseInt(repsStr, 10);
    const weight = parseInt(weightStr, 10);

    if (isNaN(sets) || sets <= 0) {
      setError("Sets must be a positive number.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(reps) || reps <= 0) {
      setError("Reps must be a positive number.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(weight) || weight < 0) {
      setError("Weight must be a non-negative number.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        exercise_id: parseInt(exerciseId, 10),
        sets,
        reps,
        weight,
        created_at: dateStr
          ? new Date(dateStr).toISOString()
          : session.createdAt,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/${session.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      onSaved(session);
    } catch (err) {
      console.error("Error updating session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update session.",
      );
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-40 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close edit session dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit session"
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Edit Session</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="edit-exercise" className={labelClass}>
                Exercise
              </label>
              <select
                id="edit-exercise"
                name="exercise"
                defaultValue={session.exercise_id}
                className={fieldClass}
              >
                {exercises.map((exercise) => (
                  <option
                    key={exercise.id}
                    value={exercise.id}
                    className="bg-zinc-900"
                  >
                    {exercise.name} — {exercise.muscle_group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-sets" className={labelClass}>
                Sets
              </label>
              <input
                id="edit-sets"
                name="sets"
                type="number"
                min={1}
                required
                defaultValue={session.sets}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="edit-reps" className={labelClass}>
                Reps
              </label>
              <input
                id="edit-reps"
                name="reps"
                type="number"
                min={1}
                required
                defaultValue={session.reps}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="edit-weight" className={labelClass}>
                Weight (lbs)
              </label>
              <input
                id="edit-weight"
                name="weight"
                type="number"
                min={0}
                required
                defaultValue={session.weight}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="edit-date" className={labelClass}>
                Date
              </label>
              <input
                id="edit-date"
                name="date"
                type="date"
                defaultValue={session.createdAt.split("T")[0]}
                className={fieldClass}
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-lime-400 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default EditSessionModal;
