import { FC, useEffect, useState } from "react";
import { FunctionRegion } from "@supabase/supabase-js";
import { AutocompleteSearchTrie } from "./helpers";

type SearchResultsProps = {
  query: string;
  searchTrie: AutocompleteSearchTrie;
};

const SearchResults: FC<SearchResultsProps> = ({ query, searchTrie }) => {
  const [searchSesults, setSearchResults] = useState<Array<string>>([]);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    if (!query) return setSearchResults([]);
    const resultsInTrie = searchTrie.search(query);
    if (resultsInTrie.length)
      return setSearchResults(resultsInTrie.filter(Boolean) as Array<string>);

    (async () => {
      try {
        const requestURL = `https://hjlytwgwushifstyclio.supabase.co/functions/v1/suggestions?q=${query}`;
        const response = await fetch(requestURL, {
          signal,
          headers: {
            "x-region": FunctionRegion.ApSoutheast1,
          },
        });
        if (!signal.aborted && response.ok) {
          const { data } = await response.json();
          setSearchResults(data);
        }
      } catch (err) {
        if (!signal.aborted) console.error(err);
      }
    })();

    return () => abortController.abort();
  }, [query]);

  useEffect(() => {
    if (searchSesults.length)
      searchSesults.forEach((s) => searchTrie.addWord(s));
  }, [searchSesults]);

  return (
    <ul className="flex flex-col gap-2 p-4">
      {searchSesults.slice(0, 10).map((s, idx) => (
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
