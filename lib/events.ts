import { isRecurrenceType, RecurrenceType } from "@/lib/constants";

type ParsedEventInput = {
  title: string;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  recurrence: RecurrenceType;
  recurrenceEndsAt: Date | null;
  recurrenceCount: number | null;
};

type ParseResult =
  | { success: true; data: ParsedEventInput }
  | { success: false; error: string };

function parseDateValue(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function parseEventInput(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body." };
  }

  const payload = body as Record<string, unknown>;

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    return { success: false, error: "Title is required." };
  }
  if (title.length > 150) {
    return { success: false, error: "Title must be 150 characters or less." };
  }

  const descriptionRaw = payload.description;
  let description: string | null = null;
  if (typeof descriptionRaw === "string") {
    description = descriptionRaw.trim() || null;
    if (description && description.length > 1000) {
      return { success: false, error: "Description must be 1000 characters or less." };
    }
  }

  const startDateTime = parseDateValue(payload.startDateTime);
  const endDateTime = parseDateValue(payload.endDateTime);
  if (!startDateTime || !endDateTime) {
    return { success: false, error: "Valid start and end date/time are required." };
  }
  if (endDateTime <= startDateTime) {
    return { success: false, error: "End date/time must be after start date/time." };
  }

  const recurrenceRaw = payload.recurrence;
  const recurrence =
    typeof recurrenceRaw === "string" && isRecurrenceType(recurrenceRaw) ? recurrenceRaw : RecurrenceType.NONE;

  let recurrenceEndsAt: Date | null = null;
  let recurrenceCount: number | null = null;

  if (recurrence !== RecurrenceType.NONE) {
    if (payload.recurrenceEndsAt) {
      recurrenceEndsAt = parseDateValue(payload.recurrenceEndsAt);
      if (!recurrenceEndsAt) {
        return { success: false, error: "recurrenceEndsAt must be a valid date/time." };
      }
      if (recurrenceEndsAt < startDateTime) {
        return { success: false, error: "recurrence end must not be before event start." };
      }
    }

    if (payload.recurrenceCount !== undefined && payload.recurrenceCount !== null && payload.recurrenceCount !== "") {
      const count = Number(payload.recurrenceCount);
      if (!Number.isInteger(count) || count <= 0 || count > 365) {
        return { success: false, error: "recurrenceCount must be an integer between 1 and 365." };
      }
      recurrenceCount = count;
    }

    if (!recurrenceEndsAt && !recurrenceCount) {
      return {
        success: false,
        error: "Recurring events require either an end date/time or number of occurrences."
      };
    }

    if (recurrenceEndsAt && recurrenceCount) {
      return {
        success: false,
        error: "Provide recurrence end date/time OR recurrence count, not both."
      };
    }
  }

  return {
    success: true,
    data: {
      title,
      description,
      startDateTime,
      endDateTime,
      recurrence,
      recurrenceEndsAt,
      recurrenceCount
    }
  };
}

export function parseRange(startRaw: string | null, endRaw: string | null):
  | { success: true; start: Date; end: Date }
  | { success: false; error: string } {
  if (!startRaw || !endRaw) {
    return { success: false, error: "start and end query params are required." };
  }

  const start = new Date(startRaw);
  const end = new Date(endRaw);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { success: false, error: "start and end must be valid ISO dates." };
  }

  if (end < start) {
    return { success: false, error: "end must be after start." };
  }

  return { success: true, start, end };
}
