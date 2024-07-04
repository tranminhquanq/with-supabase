"use client";

import { useState, useDeferredValue, Suspense, useMemo } from "react";
import { VietnameseSearchTrie } from "./helpers";
import SearchResults from "./SearchResults";

const Autocomplete = () => {
  const [query, setQuery] = useState<string>("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const search = useMemo(() => new VietnameseSearchTrie(), []);

  return (
    <section className="w-1/3">
      <input
        className="w-full p-3 border border-foreground/10 rounded-lg text-gray-900 focus:border-primary/60 transition-colors duration-200 ease-in-out"
        onChange={(e) => setQuery(e.target.value)}
        value={query}
        placeholder="Search for a dish..."
      />
      <Suspense fallback={<p className="text-center">Loading...</p>}>
        <div
          style={{
            opacity: isStale ? 0.5 : 1,
            transition: isStale
              ? "opacity 0.2s 0.2s linear"
              : "opacity 0s 0s linear",
          }}
        >
          <SearchResults query={query} search={search} />
        </div>
      </Suspense>
    </section>
  );
};

export default Autocomplete;
