import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeleteEventButton } from "@/components/DeleteEventButton";
import { ExcludeOccurrenceButton } from "@/components/ExcludeOccurrenceButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Role } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { generateOccurrences } from "@/lib/recurrence";
import { requireUser } from "@/lib/auth/guards";

type EventDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    occurrenceStart?: string;
  }>;
};

function recurrenceText(event: {
  recurrence: string;
  recurrenceEndsAt: Date | null;
  recurrenceCount: number | null;
}): string {
  if (event.recurrence === "NONE") {
    return "Does not repeat";
  }

  if (event.recurrenceCount) {
    return `${event.recurrence} (${event.recurrenceCount} occurrences)`;
  }

  if (event.recurrenceEndsAt) {
    return `${event.recurrence} until ${formatDateTime(event.recurrenceEndsAt)}`;
  }

  return event.recurrence;
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const selectedOccurrenceStartRaw = query.occurrenceStart;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!event) {
    notFound();
  }

  const canView = user.role === Role.ADMIN || user.id === event.createdById;
  if (!canView) {
    redirect("/events");
  }

  const canManage = user.role === Role.ADMIN || user.id === event.createdById;

  const selectedOccurrenceStart =
    selectedOccurrenceStartRaw && !Number.isNaN(new Date(selectedOccurrenceStartRaw).getTime())
      ? new Date(selectedOccurrenceStartRaw)
      : null;

  const now = new Date();
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + 12);

  const overrides = await db.event.findMany({
    where: {
      parentEventId: event.id
    },
    orderBy: { startDateTime: "asc" }
  });

  const upcomingOccurrences = generateOccurrences([event, ...overrides], now, horizon)
    .filter((item) => item.eventId === event.id)
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title}
        subtitle={`Owned by ${event.createdBy.name}`}
        actions={
          <>
            <Link className={buttonVariants({ variant: "outline" })} href="/events">
              Back
            </Link>
            {canManage ? (
              <>
                <Link className={buttonVariants({ variant: "secondary" })} href={`/events/${event.id}/edit`}>
                  Edit
                </Link>
                <DeleteEventButton eventId={event.id} redirectTo="/events" size="default" />
              </>
            ) : null}
          </>
        }
      />

      {selectedOccurrenceStart && event.recurrence !== "NONE" && canManage ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Selected occurrence: {formatDateTime(selectedOccurrenceStart)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href={`/events/${event.id}/occurrence/edit?occurrenceStart=${encodeURIComponent(
                  selectedOccurrenceStart.toISOString()
                )}`}
              >
                Edit this occurrence
              </Link>
              <ExcludeOccurrenceButton
                eventId={event.id}
                occurrenceStart={selectedOccurrenceStart.toISOString()}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70">
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Start:</span> {formatDateTime(event.startDateTime)}
            </p>
            <p>
              <span className="font-medium">End:</span> {formatDateTime(event.endDateTime)}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Recurrence:</span>
              <Badge variant="secondary">{recurrenceText(event)}</Badge>
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Owner email:</span> {event.createdBy.email}
            </p>
            <p>
              <span className="font-medium">Created:</span> {formatDateTime(event.createdAt)}
            </p>
            <p>
              <span className="font-medium">Updated:</span> {formatDateTime(event.updatedAt)}
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <h3 className="text-base font-semibold">Description</h3>
            <div className="whitespace-pre-wrap rounded-lg border border-border/70 bg-secondary/30 p-4 text-sm leading-relaxed">
              {event.description || "No description provided."}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Upcoming occurrences</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingOccurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming occurrences in the next 12 months.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Start</th>
                    <th className="px-2 py-2 font-medium">End</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    {canManage && event.recurrence !== "NONE" ? (
                      <th className="px-2 py-2 font-medium">Actions</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {upcomingOccurrences.map((occurrence) => (
                    <tr key={`${occurrence.eventId}-${occurrence.start.toISOString()}`} className="border-b border-border/50">
                      <td className="px-2 py-2">{formatDateTime(occurrence.start)}</td>
                      <td className="px-2 py-2">{formatDateTime(occurrence.end)}</td>
                      <td className="px-2 py-2">
                        <Badge variant={occurrence.isOccurrenceOverride ? "default" : "secondary"}>
                          {occurrence.isOccurrenceOverride ? "Override" : "Series"}
                        </Badge>
                      </td>
                      {canManage && event.recurrence !== "NONE" ? (
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                              href={`/events/${event.id}/occurrence/edit?occurrenceStart=${encodeURIComponent(
                                occurrence.occurrenceStart.toISOString()
                              )}`}
                            >
                              Edit occurrence
                            </Link>
                            {occurrence.isFromRecurringBase ? (
                              <ExcludeOccurrenceButton
                                eventId={event.id}
                                occurrenceStart={occurrence.occurrenceStart.toISOString()}
                              />
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
