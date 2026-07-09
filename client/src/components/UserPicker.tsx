import { useEffect, useRef, useState } from "react";

const defaultFieldClass =
  "rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

type User = { id: number; name: string; email: string };

type UserPickerProps = {
  selectedUserId: number | null;
  onSelect: (id: number) => void;
  className?: string;
  inputClassName?: string;
  id?: string;
};

const UserPicker = ({
  selectedUserId,
  onSelect,
  className = "",
  inputClassName = defaultFieldClass,
  id,
}: UserPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  // Mount-only default fetch: picks an initial user without ever fetching the
  // full table, matching the old "silently defaults to a user" behavior.
  useEffect(() => {
    const thisRequest = ++requestIdRef.current;
    fetch(`${import.meta.env.VITE_API_URL}/users?limit=1`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
        return res.json();
      })
      .then((data: User[]) => {
        if (thisRequest !== requestIdRef.current) return;
        if (data.length > 0) {
          onSelect(data[0].id);
          setSelectedName(data[0].name);
        }
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search-as-you-type.
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const thisRequest = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      fetch(
        `${import.meta.env.VITE_API_URL}/users?q=${encodeURIComponent(query)}&limit=8`,
      )
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
          return res.json();
        })
        .then((data: User[]) => {
          if (thisRequest !== requestIdRef.current) return;
          setResults(data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handlePick = (user: User) => {
    onSelect(user.id);
    setSelectedName(user.name);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        id={id}
        type="text"
        aria-label="Filter by user"
        placeholder={selectedName || "Search users..."}
        className={inputClassName}
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-64 w-56 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-zinc-500">Searching…</div>
          )}
          {!isLoading && error && (
            <div className="px-3 py-2 text-sm text-red-400">{error}</div>
          )}
          {!isLoading && !error && query.trim() !== "" && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-500">No users found</div>
          )}
          {!isLoading &&
            results.map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => handlePick(user)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 ${
                  user.id === selectedUserId ? "bg-zinc-800 text-lime-400" : "text-zinc-100"
                }`}
              >
                {user.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default UserPicker;
