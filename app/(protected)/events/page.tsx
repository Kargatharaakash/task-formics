import Link from "next/link";

import { DeleteEventButton } from "@/components/DeleteEventButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye } from "lucide-react";
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
        <CardContent className="p-0 sm:pt-6">
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Start</th>
                  <th className="hidden lg:table-cell px-2 py-2 font-medium">End</th>
                  <th className="hidden md:table-cell px-2 py-2 font-medium">Recurrence</th>
                  {user.role === Role.ADMIN ? <th className="hidden lg:table-cell px-2 py-2 font-medium">Owner</th> : null}
                  <th className="px-2 py-2 font-medium text-right sm:text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === Role.ADMIN ? 6 : 5} className="p-4 text-center text-muted-foreground">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  events.map((event: any) => {
                    const canManage = user.role === Role.ADMIN || user.id === event.createdById;

                    return (
                      <tr key={event.id} className="flex flex-col sm:table-row border-b border-border/50 p-4 sm:p-0">
                        <td className="sm:px-2 sm:py-2 mb-1 sm:mb-0">
                          <Link className="font-semibold sm:font-medium text-primary hover:underline" href={`/events/${event.id}`}>
                            {event.title}
                          </Link>
                          <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                            {formatDateTime(event.startDateTime)}
                            <br />
                            <span className="opacity-75">{recurrenceText(event)}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-2 py-2 text-muted-foreground">{formatDateTime(event.startDateTime)}</td>
                        <td className="hidden lg:table-cell px-2 py-2 text-muted-foreground">{formatDateTime(event.endDateTime)}</td>
                        <td className="hidden md:table-cell px-2 py-2">
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {recurrenceText(event)}
                          </Badge>
                        </td>
                        {user.role === Role.ADMIN ? <td className="hidden lg:table-cell px-2 py-2 text-muted-foreground">{event.createdBy.name}</td> : null}
                        <td className="mt-3 sm:mt-0 sm:px-2 sm:py-2 flex justify-end">
                          <div className="flex flex-wrap gap-2">
                            <Link className={buttonVariants({ variant: "outline", size: "sm", className: "max-sm:px-2" })} href={`/events/${event.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline ml-2">View</span>
                            </Link>
                            {canManage ? (
                              <>
                                <Link
                                  className={buttonVariants({ variant: "secondary", size: "sm", className: "max-sm:px-2" })}
                                  href={`/events/${event.id}/edit`}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="hidden sm:inline ml-2">Edit</span>
                                </Link>
                                <DeleteEventButton eventId={event.id} iconOnlyOnMobile />
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
