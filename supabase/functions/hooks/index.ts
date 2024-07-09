import "edge-runtime";
import { Redis } from "@upstash/redis";
import { corsHeaders } from "../_shared/cors.ts";
import { cleanText } from "./helpers.ts";
// import dataSheet from "./data.json" with { type: "json" };
import { generatePrefixes } from "./helpers.ts";

Deno.serve(async (r: Request) => {
  if (r.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const cleanedData = [].map(({ name }) => cleanText(name)); // dataSheet
  const prefixs = cleanedData.flatMap((s) => generatePrefixes(s, 10));

  try {
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });
    const pipeline = redis.pipeline();

    for (const prefix of prefixs) {
      pipeline.zadd("dev:suggestions", {
        score: 0,
        member: prefix,
      });
    }
    await pipeline.exec();
    return new Response(
      JSON.stringify({ message: "ok" }),
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
