import { isRecurrenceType, RecurrenceType } from "@/lib/constants";

export type RecurrenceEventLike = {
  id: string;
  title: string;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  recurrence: string;
  recurrenceEndsAt: Date | null;
  recurrenceCount: number | null;
  excludedDatesJson: string | null;
  parentEventId: string | null;
  occurrenceDate: Date | null;
  isOccurrenceOverride: boolean;
  createdById: string;
};

export type EventOccurrence = {
  eventId: string;
  sourceEventId: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  occurrenceStart: Date;
  isFromRecurringBase: boolean;
  isOccurrenceOverride: boolean;
  createdById: string;
};

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA <= endB && endA >= startB;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  const day = copy.getDate();
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
  const lastDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(day, lastDay));
  return copy;
}

function nextOccurrenceStart(currentStart: Date, recurrence: RecurrenceType): Date {
  switch (recurrence) {
    case RecurrenceType.DAILY:
      return addDays(currentStart, 1);
    case RecurrenceType.WEEKLY:
      return addDays(currentStart, 7);
    case RecurrenceType.MONTHLY:
      return addMonths(currentStart, 1);
    case RecurrenceType.NONE:
    default:
      return currentStart;
  }
}

function getRecurrenceType(value: string): RecurrenceType {
  if (isRecurrenceType(value)) {
    return value;
  }
  return RecurrenceType.NONE;
}

function parseExcludedDates(value: string | null): Set<number> {
  if (!value) {
    return new Set<number>();
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    const timestamps = parsed
      .map((item) => (typeof item === "string" ? new Date(item).getTime() : Number.NaN))
      .filter((item) => Number.isFinite(item));

    return new Set(timestamps);
  } catch {
    return new Set<number>();
  }
}

export function generateOccurrencesForEvent(
  event: RecurrenceEventLike,
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];
  const recurrence = getRecurrenceType(event.recurrence);
  const excludedDates = parseExcludedDates(event.excludedDatesJson);

  let occurrenceIndex = 0;
  let currentStart = new Date(event.startDateTime);
  const duration = event.endDateTime.getTime() - event.startDateTime.getTime();

  const safetyLimit = 1000;

  while (occurrenceIndex < safetyLimit) {
    const currentEnd = new Date(currentStart.getTime() + duration);

    if (event.recurrenceCount && occurrenceIndex >= event.recurrenceCount) {
      break;
    }

    if (recurrence !== RecurrenceType.NONE && event.recurrenceEndsAt && currentStart > event.recurrenceEndsAt) {
      break;
    }

    if (recurrence !== RecurrenceType.NONE && currentStart > rangeEnd) {
      break;
    }

    const isExcluded = excludedDates.has(currentStart.getTime());

    if (!isExcluded && overlaps(currentStart, currentEnd, rangeStart, rangeEnd)) {
      occurrences.push({
        eventId: event.parentEventId ?? event.id,
        sourceEventId: event.id,
        title: event.title,
        description: event.description,
        start: currentStart,
        end: currentEnd,
        occurrenceStart: event.occurrenceDate ?? currentStart,
        isFromRecurringBase: recurrence !== RecurrenceType.NONE && !event.isOccurrenceOverride,
        isOccurrenceOverride: event.isOccurrenceOverride,
        createdById: event.createdById
      });
    }

    occurrenceIndex += 1;

    if (recurrence === RecurrenceType.NONE) {
      break;
    }

    currentStart = nextOccurrenceStart(currentStart, recurrence);
  }

  return occurrences;
}

export function generateOccurrences(
  events: RecurrenceEventLike[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  return events
    .flatMap((event) => generateOccurrencesForEvent(event, rangeStart, rangeEnd))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
