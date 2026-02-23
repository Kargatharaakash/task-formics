import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { canManageEvent } from "@/lib/authorization";
import { RecurrenceType } from "@/lib/constants";
import { db } from "@/lib/db";
import { addExcludedOccurrence, parseIsoDate } from "@/lib/occurrence";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function parseTitle(value: unknown, fallback: string): { success: true; value: string } | { success: false; error: string } {
  if (value === undefined) {
    return { success: true, value: fallback };
  }

  if (typeof value !== "string") {
    return { success: false, error: "Title must be a string." };
  }

  const title = value.trim();
  if (!title) {
    return { success: false, error: "Title is required." };
  }

  if (title.length > 150) {
    return { success: false, error: "Title must be 150 characters or less." };
  }

  return { success: true, value: title };
}

function parseDescription(
  value: unknown,
  fallback: string | null
): { success: true; value: string | null } | { success: false; error: string } {
  if (value === undefined) {
    return { success: true, value: fallback };
  }

  if (value === null) {
    return { success: true, value: null };
  }

  if (typeof value !== "string") {
    return { success: false, error: "Description must be a string or null." };
  }

  const description = value.trim();
  if (description.length > 1000) {
    return { success: false, error: "Description must be 1000 characters or less." };
  }

  return { success: true, value: description || null };
}

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const rootEvent = await db.event.findUnique({ where: { id } });
    if (!rootEvent) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!canManageEvent(user, rootEvent.createdById)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const occurrenceStart = parseIsoDate(body.occurrenceStart);
    if (!occurrenceStart) {
      return NextResponse.json({ error: "occurrenceStart must be a valid ISO date." }, { status: 400 });
    }

    const sourceEventId =
      typeof body.sourceEventId === "string" && body.sourceEventId.trim().length > 0 ? body.sourceEventId : id;

    const excludeOnly = body.excludeOnly === true;

    if (excludeOnly) {
      if (rootEvent.recurrence === RecurrenceType.NONE) {
        return NextResponse.json(
          { error: "Cannot exclude occurrence from a non-recurring event." },
          { status: 400 }
        );
      }

      const updatedRoot = await db.event.update({
        where: { id },
        data: {
          excludedDatesJson: addExcludedOccurrence(rootEvent.excludedDatesJson, occurrenceStart)
        }
      });

      return NextResponse.json({
        success: true,
        excluded: true,
        event: updatedRoot
      });
    }

    const startDateTime = parseIsoDate(body.startDateTime);
    const endDateTime = parseIsoDate(body.endDateTime);

    if (!startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "startDateTime and endDateTime are required and must be valid ISO dates." },
        { status: 400 }
      );
    }

    if (endDateTime <= startDateTime) {
      return NextResponse.json({ error: "End date/time must be after start date/time." }, { status: 400 });
    }

    const parsedTitle = parseTitle(body.title, rootEvent.title);
    if (!parsedTitle.success) {
      return NextResponse.json({ error: parsedTitle.error }, { status: 400 });
    }

    const parsedDescription = parseDescription(body.description, rootEvent.description);
    if (!parsedDescription.success) {
      return NextResponse.json({ error: parsedDescription.error }, { status: 400 });
    }

    if (sourceEventId === id && rootEvent.recurrence !== RecurrenceType.NONE) {
      const overrideEvent = await db.$transaction(async (tx) => {
        await tx.event.update({
          where: { id },
          data: {
            excludedDatesJson: addExcludedOccurrence(rootEvent.excludedDatesJson, occurrenceStart)
          }
        });

        const existingOverride = await tx.event.findFirst({
          where: {
            parentEventId: id,
            occurrenceDate: occurrenceStart
          }
        });

        const overrideData = {
          title: parsedTitle.value,
          description: parsedDescription.value,
          startDateTime,
          endDateTime,
          recurrence: RecurrenceType.NONE,
          recurrenceEndsAt: null,
          recurrenceCount: null,
          excludedDatesJson: null,
          parentEventId: id,
          occurrenceDate: occurrenceStart,
          isOccurrenceOverride: true,
          createdById: rootEvent.createdById
        };

        if (existingOverride) {
          return tx.event.update({
            where: { id: existingOverride.id },
            data: overrideData
          });
        }

        return tx.event.create({ data: overrideData });
      });

      return NextResponse.json({
        success: true,
        event: overrideEvent,
        occurrenceEdited: true,
        overrideCreated: true
      });
    }

    const sourceEvent = sourceEventId === id ? rootEvent : await db.event.findUnique({ where: { id: sourceEventId } });

    if (!sourceEvent) {
      return NextResponse.json({ error: "Source event not found." }, { status: 404 });
    }

    if (!canManageEvent(user, sourceEvent.createdById)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (sourceEvent.parentEventId && sourceEvent.parentEventId !== id) {
      return NextResponse.json({ error: "Source event does not match root event." }, { status: 400 });
    }

    const updatedEvent = await db.event.update({
      where: { id: sourceEvent.id },
      data: {
        title: parsedTitle.value,
        description: parsedDescription.value,
        startDateTime,
        endDateTime
      }
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      occurrenceEdited: true,
      overrideCreated: false
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update occurrence." }, { status: 500 });
  }
}
