import { FC, useEffect, useState } from "react";
import { VietnameseSearchTrie } from "./helpers";

type SearchResultsProps = {
  query: string;
  search: VietnameseSearchTrie;
};

const SearchResults: FC<SearchResultsProps> = ({ query, search }) => {
  const [searchSesults, setSearchResults] = useState<Array<string>>([]);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    if (!query) return setSearchResults([]);
    const resultsInTrie = search.search(query);
    if (resultsInTrie.length)
      return setSearchResults(resultsInTrie.filter(Boolean) as Array<string>);

    (async () => {
      try {
        const requestURL = `https://hjlytwgwushifstyclio.supabase.co/functions/v1/suggestions?q=${query}`;
        const response = await fetch(requestURL, { signal });
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
    if (searchSesults.length) searchSesults.forEach((s) => search.addWord(s));
  }, [searchSesults]);

  return (
    <ul className="flex flex-col gap-2 p-4">
      {searchSesults.map((s, idx) => (
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
