// TODO: wire up state + data fetching
//   - fetch leaderboard -> GET /leaderboard
//   - loading / error states

type Rank = { name: string; total_sessions: number };

// TODO: replace with data from GET /leaderboard
const rows: Rank[] = [
  { name: "Terrence", total_sessions: 12 },
  { name: "Jordan", total_sessions: 9 },
  { name: "Sam", total_sessions: 7 },
  { name: "Alex", total_sessions: 4 },
  { name: "Casey", total_sessions: 2 },
];

// TODO: derive from data (max total_sessions) for the progress bars
const maxSessions = Math.max(1, ...rows.map((r) => r.total_sessions));

const medal = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ranked by total sessions this week. Keep grinding.
        </p>
      </div>

      <ol className="space-y-3">
        {rows.map((row, i) => {
          const isTop = i === 0;
          return (
            <li
              key={row.name}
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
                  {row.name}
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
