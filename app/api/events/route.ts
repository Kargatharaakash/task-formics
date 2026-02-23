import { Role } from "@/lib/constants";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { parseEventInput } from "@/lib/events";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const scope = searchParams.get("scope");

  const where =
    user.role === Role.ADMIN && scope !== "mine"
      ? {}
      : {
          createdById: user.id
        };

  const events = await db.event.findMany({
    where: {
      ...where,
      parentEventId: null
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { startDateTime: "asc" }
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseEventInput(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const createdEvent = await db.event.create({
      data: {
        ...parsed.data,
        createdById: user.id
      }
    });

    return NextResponse.json({ event: createdEvent }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
