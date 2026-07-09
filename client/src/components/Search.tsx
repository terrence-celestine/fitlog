import { useState } from "react";

const Search = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("exercise");
  const types = ["exercise", "user", "session"];
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(false);
    fetch(`${import.meta.env.VITE_API_URL}/search?q=${query}&type=${type}`)
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((err) => setError(err.message))
      .finally(() => {
        setIsLoading(false);
        setHasSearched(true);
      });
  };

  const colClass =
    "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider";
  const cellClass = "px-4 py-3 text-sm text-gray-200";
  const rowClass =
    "border-b border-gray-700 hover:bg-gray-700/50 transition-colors";

  const renderResults = () => {
    if (results.length === 0) {
      return <p className="text-center text-gray-400 py-8">No results found</p>;
    }

    if (type === "exercise") {
      return (
        <div className="rounded-lg overflow-hidden border border-gray-700">
          <div className="grid grid-cols-2 bg-gray-800 border-b border-gray-700">
            <span className={colClass}>Name</span>
            <span className={colClass}>Muscle Group</span>
          </div>
          {results.map((r) => (
            <div key={r.id} className={`grid grid-cols-2 ${rowClass}`}>
              <span className={cellClass}>{r.name}</span>
              <span className={cellClass}>{r.muscle_group}</span>
            </div>
          ))}
        </div>
      );
    }

    if (type === "user") {
      return (
        <div className="rounded-lg overflow-hidden border border-gray-700">
          <div className="grid grid-cols-2 bg-gray-800 border-b border-gray-700">
            <span className={colClass}>Name</span>
            <span className={colClass}>Email</span>
          </div>
          {results.map((r) => (
            <div key={r.id} className={`grid grid-cols-2 ${rowClass}`}>
              <span className={cellClass}>{r.name}</span>
              <span className={cellClass}>{r.email}</span>
            </div>
          ))}
        </div>
      );
    }

    if (type === "session") {
      return (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-5 bg-gray-800 border-b border-gray-700">
              <span className={colClass}>Exercise</span>
              <span className={colClass}>Sets</span>
              <span className={colClass}>Reps</span>
              <span className={colClass}>Weight</span>
              <span className={colClass}>Date</span>
            </div>
            {results.map((r) => (
              <div key={r.id} className={`grid grid-cols-5 ${rowClass}`}>
                <span className={`${cellClass} whitespace-nowrap`}>
                  {r.exercise}
                </span>
                <span className={cellClass}>{r.sets}</span>
                <span className={cellClass}>{r.reps}</span>
                <span className={cellClass}>{r.weight}lbs</span>
                <span className={`${cellClass} whitespace-nowrap`}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Searching...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Search</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 sm:flex-none"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className={[
              "bg-lime-400 text-zinc-950 hover:bg-lime-500 px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer",
            ].join(" ")}
          >
            Search
          </button>
        </div>
      </div>

      {hasSearched && renderResults()}
    </div>
  );
};

export default Search;
