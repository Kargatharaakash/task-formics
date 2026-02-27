import { RecurrenceType, Role } from "@/lib/constants";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { parseRange } from "@/lib/events";
import { generateOccurrences } from "@/lib/recurrence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const startRaw = searchParams.get("start");
  const endRaw = searchParams.get("end");

  const parsedRange = parseRange(startRaw, endRaw);
  if (!parsedRange.success) {
    return NextResponse.json({ error: parsedRange.error }, { status: 400 });
  }

  const { start, end } = parsedRange;

  const baseWhere = user.role === Role.ADMIN ? {} : { createdById: user.id };

  const events = await db.event.findMany({
    where: {
      ...baseWhere,
      startDateTime: { lte: end },
      OR: [
        {
          recurrence: RecurrenceType.NONE,
          endDateTime: { gte: start }
        },
        {
          recurrence: { not: RecurrenceType.NONE },
          OR: [{ recurrenceEndsAt: null }, { recurrenceEndsAt: { gte: start } }]
        }
      ]
    },
    orderBy: { startDateTime: "asc" }
  });

  const occurrences = generateOccurrences(events, start, end);

  return NextResponse.json({
    occurrences: occurrences.map((item) => ({
      eventId: item.eventId,
      sourceEventId: item.sourceEventId,
      title: item.title,
      description: item.description,
      start: item.start.toISOString(),
      end: item.end.toISOString(),
      occurrenceStart: item.occurrenceStart.toISOString(),
      isFromRecurringBase: item.isFromRecurringBase,
      isOccurrenceOverride: item.isOccurrenceOverride,
      createdById: item.createdById
    }))
  });
}
