import Link from "next/link";

import { DeleteEventButton } from "@/components/DeleteEventButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Role } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

function recurrenceText(event: {
  recurrence: string;
  recurrenceEndsAt: Date | null;
  recurrenceCount: number | null;
}): string {
  if (event.recurrence === "NONE") {
    return "No repeat";
  }

  if (event.recurrenceCount) {
    return `${event.recurrence} (${event.recurrenceCount}x)`;
  }

  if (event.recurrenceEndsAt) {
    return `${event.recurrence} until ${formatDateTime(event.recurrenceEndsAt)}`;
  }

  return event.recurrence;
}

export default async function EventsPage() {
  const user = await requireUser();

  const where = user.role === Role.ADMIN ? {} : { createdById: user.id };

  const events = await db.event.findMany({
    where: {
      ...where,
      parentEventId: null
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { startDateTime: "asc" }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        subtitle={
          user.role === Role.ADMIN
            ? "Manage all events in the platform"
            : "Manage your events with recurrence support"
        }
        actions={
          <>
            <Link className={buttonVariants({ variant: "outline" })} href="/calendar">
              Calendar
            </Link>
            <Link className={buttonVariants()} href="/events/new">
              Create event
            </Link>
          </>
        }
      />

      <Card className="border-border/70">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Start</th>
                  <th className="px-2 py-2 font-medium">End</th>
                  <th className="px-2 py-2 font-medium">Recurrence</th>
                  {user.role === Role.ADMIN ? <th className="px-2 py-2 font-medium">Owner</th> : null}
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === Role.ADMIN ? 6 : 5} className="px-2 py-5 text-muted-foreground">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => {
                    const canManage = user.role === Role.ADMIN || user.id === event.createdById;

                    return (
                      <tr key={event.id} className="border-b border-border/50">
                        <td className="px-2 py-2">
                          <Link className="font-medium text-primary hover:underline" href={`/events/${event.id}`}>
                            {event.title}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{formatDateTime(event.startDateTime)}</td>
                        <td className="px-2 py-2 text-muted-foreground">{formatDateTime(event.endDateTime)}</td>
                        <td className="px-2 py-2">
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {recurrenceText(event)}
                          </Badge>
                        </td>
                        {user.role === Role.ADMIN ? <td className="px-2 py-2">{event.createdBy.name}</td> : null}
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/events/${event.id}`}>
                              View
                            </Link>
                            {canManage ? (
                              <>
                                <Link
                                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                                  href={`/events/${event.id}/edit`}
                                >
                                  Edit
                                </Link>
                                <DeleteEventButton eventId={event.id} />
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
