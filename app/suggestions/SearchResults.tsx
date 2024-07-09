import { useEffect, useState } from "react";
import { Redis } from "@upstash/redis";
import { AutocompleteSearchTrie } from "./helpers";

type SearchResultsProps = {
  query: string;
  searchTrie: AutocompleteSearchTrie;
};

const SearchResults = ({ query, searchTrie }: SearchResultsProps) => {
  const [searchSesults, setSearchResults] = useState<Array<string>>([]);

  useEffect(() => {
    if (!query) return setSearchResults([]);
    const resultsInTrie = searchTrie.search({ query, isFuzzy: true });
    setSearchResults(resultsInTrie as Array<string>);
  }, [query]);

  useEffect(() => {
    if (searchSesults.length) return;

    const abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      try {
        const redis = new Redis({
          url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
          token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_TOKEN!,
          signal,
        });

        const prefix = query.toLowerCase().trim();
        if (!signal.aborted) {
          if (prefix.length > 1) {
            const rank = await redis.zrank("dev:suggestions", prefix);
            if (rank !== null) {
              const suggestions = await redis
                .zrange<Array<string>>("dev:suggestions", rank, rank + 100)
                .then(transformSuggestions(prefix))
                .catch(fallbackToDatabase(prefix));
              setSearchResults(suggestions);
            }
          }
        }
      } catch (err) {
        if (!signal.aborted) console.error(err);
      }
    })();

    return () => abortController.abort();
  }, [searchSesults, query]);

  useEffect(() => {
    if (searchSesults.length) {
      searchSesults.forEach((s: string) => searchTrie.addWord(s));
    }
  }, [searchSesults]);

  return (
    <ul className="flex flex-col gap-2 p-4">
      {searchSesults.slice(0, 5).map((s: string, idx: number) => (
        <li
          className="underline cursor-pointer first-letter:uppercase"
          key={idx}
        >
          {s}
        </li>
      ))}
    </ul>
  );
};

export default SearchResults;

function transformSuggestions(prefix: string) {
  return (suggestions: Array<string>) => {
    if (suggestions.length === 0) {
      throw new Error("No suggestions found. Fallback to database");
    }
    const result: Array<string> = [];
    for (const s of suggestions) {
      if (!s.startsWith(prefix)) break;
      if (s.endsWith("*")) {
        result.push(s.substring(0, s.length - 1));
      }
    }
    return result;
  };
}

function fallbackToDatabase(_prefix: string) {
  return (_error: Error): Promise<Array<string>> => {
    try {
      return Promise.resolve([]);
    } catch (_error) {
      return Promise.resolve([]);
    }
  };
}
