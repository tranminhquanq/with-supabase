import { FC, useCallback, useEffect, useState } from "react";
// import { FunctionRegion } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { debounce } from "lodash";
import { AutocompleteSearchTrie } from "./helpers";

type SearchResultsProps = {
  query: string;
  searchTrie: AutocompleteSearchTrie;
};

const SearchResults = ({ query, searchTrie }: SearchResultsProps) => {
  const [searchSesults, setSearchResults] = useState<Array<string>>([]);

  // const getSuggestions = useCallback(async () => {
  //   const redis = new Redis({
  //     url: "https://innocent-coral-35951.upstash.io",
  //     token: "AYxvAAIncDEwYzEyZDE3YzA0MGE0M2RhYjhjODIyN2ZjODRmMWZhNHAxMzU5NTE",
  //   });
  //   const prefix = query.toLowerCase().trim();
  //   if (prefix && prefix.length > 1) {
  //     const rank = await redis.zrank("suggestions", prefix);
  //     if (rank !== null) {
  //       const suggestions = await redis
  //         .zrange<Array<string>>("suggestions", rank, rank + 100)
  //         .then(transformSuggestions(prefix))
  //         .catch(fallbackToDatabase(prefix));
  //       return setSearchResults(suggestions);
  //     }
  //   }
  //   setSearchResults([]);
  // }, [query]);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    if (!query) return setSearchResults([]);
    const resultsInTrie = searchTrie.search(query);
    if (resultsInTrie.length)
      return setSearchResults(resultsInTrie.filter(Boolean) as Array<string>);

    // debounce(getSuggestions, 300)();
    // (async () => {
    //   try {
    //     const requestURL = `/api/autocomplete?q=${query}`;
    //     const response = await fetch(requestURL, {
    //       signal,
    //     });
    //     if (!signal.aborted && response.ok) {
    //       const { data } = await response.json();
    //       setSearchResults(data);
    //     }
    //   } catch (err) {
    //     if (!signal.aborted) console.error(err);
    //   }
    // })();
    // return () => abortController.abort();

    (async () => {
      try {
        const redis = new Redis({
          url: "https://innocent-coral-35951.upstash.io",
          token:
            "AYxvAAIncDEwYzEyZDE3YzA0MGE0M2RhYjhjODIyN2ZjODRmMWZhNHAxMzU5NTE",
          signal,
        });

        const prefix = query.toLowerCase().trim();
        if (!signal.aborted) {
          if (prefix.length > 1) {
            const rank = await redis.zrank("suggestions", prefix);
            if (rank !== null) {
              const suggestions = await redis
                .zrange<Array<string>>("suggestions", rank, rank + 100)
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
  }, [query]);

  useEffect(() => {
    if (searchSesults.length)
      searchSesults.forEach((s: string) => searchTrie.addWord(s));
  }, [searchSesults]);

  return (
    <ul className="flex flex-col gap-2 p-4">
      {searchSesults.slice(0, 10).map((s: string, idx: number) => (
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

// async function getSuggestions(query: string) {
//   const abortController = new AbortController();
//   const signal = abortController.signal;

//   const redis = new Redis({
//     url: "https://innocent-coral-35951.upstash.io",
//     token: "AYxvAAIncDEwYzEyZDE3YzA0MGE0M2RhYjhjODIyN2ZjODRmMWZhNHAxMzU5NTE",
//   });

//   const prefix = query.toLowerCase().trim();

//   if (prefix && prefix.length > 1) {
//     // Only search if prefix is at least 2 characters
//     const rank = await redis.zrank("suggestions", prefix);
//     if (rank) {
//       const suggestions = await redis
//         .zrange<Array<string>>(
//           "suggestions",
//           rank,
//           rank + 100 // 100 it's mean 100 suggestions
//         )
//         .then(transformSuggestions(prefix))
//         .catch(fallbackToDatabase(prefix));

//       return suggestions;
//     }
//   }
//   return [];
// }

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
      // log error here
      // probably fetch from database
      return Promise.resolve([]);
    } catch (_error) {
      return Promise.resolve([]);
    }
  };
}
