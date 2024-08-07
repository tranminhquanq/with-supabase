import "edge-runtime";
import { Redis } from "@upstash/redis";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (r: Request) => {
  if (r.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });

    const query = new URL(r.url).searchParams;
    const prefix = query.get("q")?.toLowerCase()?.trim();

    if (prefix && prefix.length > 1) { // Only search if prefix is at least 2 characters
      const rank = await redis.zrank("suggestions", prefix);
      if (rank) {
        const suggestions = await redis.zrange<Array<string>>(
          "suggestions",
          rank,
          rank + 100, // 100 it's mean 100 suggestions
        ).then(transformSuggestions(prefix))
          .catch(fallbackToDatabase(prefix));

        return new Response(
          JSON.stringify({ data: suggestions }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggestions error", err.message);
    console.info(err.stack);
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
