import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import UserPicker from "./UserPicker";

type ProgressPoint = {
  id: number;
  created_at: string;
  weight: number;
  sets: number;
  reps: number;
  volume: number;
  running_max_weight: number;
  exercise: string;
  muscle_group: string;
};

type Exercise = { id: number; name: string; muscle_group: string };

const fieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const ProgressCharts = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<number>(1);
  const [metric, setMetric] = useState<"weight" | "volume">("weight");

  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      const exercisesRes = await fetch(
        `${import.meta.env.VITE_API_URL}/exercises`,
      );
      const exercisesData = await exercisesRes.json();
      setExercises(exercisesData);
      if (exercisesData.length > 0) {
        setSelectedExercise(exercisesData[0].id);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (!selectedUser || !selectedExercise) return;
    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/progress?user_id=${selectedUser}&exercise_id=${selectedExercise}`,
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error ?? "Failed to fetch progress");
        }
        const data = await response.json();
        setProgress(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch progress",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [selectedUser, selectedExercise]);

  const metricLabel = metric === "weight" ? "Weight (lbs)" : "Volume (lbs)";

  // The header + filters (including UserPicker) always render, regardless of
  // loading/error state - see History.tsx for why UserPicker can't be gated
  // behind isLoading (it owns picking the initial selectedUser).
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Progress
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Track how a lift has trended over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UserPicker selectedUserId={selectedUser} onSelect={setSelectedUser} />
          <select
            aria-label="Filter by exercise"
            className={fieldClass}
            value={selectedExercise}
            onChange={(event) =>
              setSelectedExercise(Number(event.target.value))
            }
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 p-1">
            <button
              type="button"
              onClick={() => setMetric("weight")}
              className={[
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                metric === "weight"
                  ? "bg-lime-400 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-100",
              ].join(" ")}
            >
              Weight
            </button>
            <button
              type="button"
              onClick={() => setMetric("volume")}
              className={[
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                metric === "volume"
                  ? "bg-lime-400 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-100",
              ].join(" ")}
            >
              Volume
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="h-80 animate-pulse rounded-2xl bg-zinc-900/40" />
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
            Couldn&apos;t load progress
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

      {!isLoading && !error && progress.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
            📈
          </span>
          <p className="font-semibold text-zinc-200">
            No sessions logged for this exercise yet
          </p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Log a workout for this user and exercise to see progress over
            time.
          </p>
        </div>
      )}

      {!isLoading && !error && progress.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-xl shadow-black/20 sm:p-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={progress}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="created_at"
                tickFormatter={formatDate}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                label={{
                  value: metricLabel,
                  angle: -90,
                  position: "insideLeft",
                  fill: "#a1a1aa",
                  fontSize: 12,
                }}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(String(label))}
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "0.75rem",
                }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#a3e635"
                strokeWidth={2}
                dot={{ fill: "#a3e635", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ProgressCharts;
