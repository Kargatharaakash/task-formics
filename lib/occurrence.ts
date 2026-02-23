export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function parseExcludedDates(value: string | null): Set<number> {
  if (!value) {
    return new Set<number>();
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    const entries = parsed
      .map((item) => (typeof item === "string" ? new Date(item) : null))
      .filter((item): item is Date => !!item && !Number.isNaN(item.getTime()))
      .map((item) => item.getTime());

    return new Set(entries);
  } catch {
    return new Set<number>();
  }
}

export function serializeExcludedDates(entries: Set<number>): string {
  const values = [...entries]
    .sort((a, b) => a - b)
    .map((value) => new Date(value).toISOString());

  return JSON.stringify(values);
}

export function addExcludedOccurrence(existing: string | null, occurrenceStart: Date): string {
  const set = parseExcludedDates(existing);
  set.add(occurrenceStart.getTime());
  return serializeExcludedDates(set);
}
