import { useEffect, useState } from "react";

type Rank = { id: number; user_name: string; total_sessions: number };

const medal = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<Rank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/leaderboard`,
        );
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch leaderboard",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Heading placeholder */}
        <div>
          <div className="h-8 w-44 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-800/70" />
        </div>

        {/* Row skeletons */}
        <ol className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
            >
              <div className="h-6 w-6 shrink-0 animate-pulse rounded bg-zinc-800" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
                <div className="mt-2 h-1.5 w-full animate-pulse rounded-full bg-zinc-800/70" />
              </div>
              <div className="h-7 w-8 shrink-0 animate-pulse rounded bg-zinc-800" />
            </li>
          ))}
        </ol>
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
          Couldn&apos;t load the leaderboard
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

  const maxSessions = Math.max(1, ...leaderboard.map((r) => r.total_sessions));

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ranked by total sessions of all-time. Keep grinding.
        </p>
      </div>

      <ol className="space-y-3">
        {leaderboard.map((row, i) => {
          const isTop = i === 0;
          return (
            <li
              key={row.id}
              className={[
                "flex items-center gap-4 rounded-2xl border p-4 transition sm:p-5",
                isTop
                  ? "border-lime-400/40 bg-lime-400/5"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700",
              ].join(" ")}
            >
              {/* Rank */}
              <span className="w-8 shrink-0 text-center text-lg font-bold tabular-nums text-zinc-500">
                {i < 3 ? medal[i] : i + 1}
              </span>

              {/* Name + progress bar */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-100">
                  {row.user_name}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${
                      isTop ? "bg-lime-400" : "bg-zinc-600"
                    }`}
                    style={{
                      width: `${(row.total_sessions / maxSessions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Count */}
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold tabular-nums text-zinc-100">
                  {row.total_sessions}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  sessions
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Leaderboard;
