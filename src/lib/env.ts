import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FLIGHT_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  FLIGHT_API_KEY: z.string().optional().default(""),
  FLIGHT_API_BASE_URL: z.string().optional().default(""),
  RATE_LIMIT_SEARCH_PER_MINUTE: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_AUTOCOMPLETE_PER_MINUTE: z.coerce.number().int().positive().default(60),
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(1),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Fail fast at boot rather than leaking a confusing runtime error later.
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration. Check .env against .env.example.");
  }
  return parsed.data;
}

export const env = loadEnv();
