import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Log Workout" },
  { to: "/workout-history", label: "History" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/search", label: "Search" },
];

const Header = () => {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime-400 text-lg font-black text-zinc-950">
            F
          </span>
          <span className="text-lg font-bold tracking-tight">
            Fit<span className="text-lime-400">Log</span>
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 p-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
                  isActive
                    ? "bg-lime-400 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100",
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
