import { Redis } from "@upstash/redis";

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

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;

  const redis = new Redis({
    url: "https://innocent-coral-35951.upstash.io",
    token: "AYxvAAIncDEwYzEyZDE3YzA0MGE0M2RhYjhjODIyN2ZjODRmMWZhNHAxMzU5NTE",
  });
  const prefix = query.get("q")?.toLowerCase()?.trim();
  if (prefix && prefix.length > 1) {
    const rank = await redis.zrank("suggestions", prefix);
    if (rank !== null) {
      const suggestions = await redis
        .zrange<Array<string>>("suggestions", rank, rank + 100)
        .then(transformSuggestions(prefix))
        .catch(fallbackToDatabase(prefix));
      return new Response(JSON.stringify({ data: suggestions }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }
  return new Response(JSON.stringify({ data: [] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
