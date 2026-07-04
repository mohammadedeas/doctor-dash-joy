import type { Response } from "express";

export function handleError(res: Response, err: unknown, context: string) {
  console.error(`[${context}]`, err);
  res.status(500).json({ error: "Internal server error" });
}

/**
 * Optional LIMIT/OFFSET pagination. Returns limit=undefined when the caller
 * didn't ask for pagination, so callers can fall back to unbounded SELECTs.
 */
export function parsePagination(query: Record<string, unknown>): {
  limit: number | undefined;
  offset: number;
} {
  const rawLimit = query.limit;
  if (rawLimit === undefined) return { limit: undefined, offset: 0 };

  const limit = Math.min(Math.max(parseInt(String(rawLimit), 10) || 0, 1), 500);
  const offset = Math.max(parseInt(String(query.offset ?? "0"), 10) || 0, 0);
  return { limit, offset };
}
