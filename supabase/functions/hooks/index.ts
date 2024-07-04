import "edge-runtime";
import { Redis } from "@upstash/redis";
import { corsHeaders } from "../_shared/cors.ts";
import { cleanText } from "./helpers.ts";
import dataSheet from "./data.json" with { type: "json" };
import { generatePrefixes } from "./helpers.ts";

Deno.serve(async (r: Request) => {
  if (r.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const redis = new Redis({
    url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
    token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
  });

  const cleanedData = dataSheet.map(({ name }) => cleanText(name));
  const prefixs = cleanedData.flatMap(transformToPrefix);

  const pipeline = redis.pipeline();
  for (const p of prefixs) {
    pipeline.zadd("suggestions", {
      score: 0,
      member: p,
    });
  }
  try {
    await pipeline.exec();

    return new Response(
      JSON.stringify({ message: "Data loaded" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ message: e.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function transformToPrefix(s: string) {
  return generatePrefixes(s, 10);
}
