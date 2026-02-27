import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurrenceType, Role } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const user = await requireUser();

  const baseWhere = user.role === Role.ADMIN ? {} : { createdById: user.id };

  const [totalEvents, recurringEvents, upcomingEvents] = await Promise.all([
    db.event.count({ where: { ...baseWhere, parentEventId: null } }),
    db.event.count({ where: { ...baseWhere, parentEventId: null, recurrence: { not: RecurrenceType.NONE } } }),
    db.event.findMany({
      where: {
        ...baseWhere,
        parentEventId: null,
        endDateTime: { gte: new Date() }
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: { startDateTime: "asc" },
      take: 8
    })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={
          user.role === Role.ADMIN
            ? "Admin overview across all users and events"
            : "Your event activity overview"
        }
        actions={
          <>
            <Link prefetch={false} className={buttonVariants({ variant: "outline" })} href="/calendar">
              Open calendar
            </Link>
            <Link prefetch={false} className={buttonVariants()} href="/events/new">
              Create event
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total events</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold">{totalEvents}</CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurring events</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold">{recurringEvents}</CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant={user.role === Role.ADMIN ? "default" : "secondary"}>{user.role}</Badge>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/70">
        <div className="flex items-center justify-between gap-3 p-6 pb-2">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Upcoming events</h2>
          <Link prefetch={false} href="/events" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View all
          </Link>
        </div>
        <CardContent className="p-0 sm:p-6">
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Start</th>
                  <th className="hidden lg:table-cell px-2 py-2 font-medium">End</th>
                  {user.role === Role.ADMIN ? <th className="hidden lg:table-cell px-2 py-2 font-medium">Owner</th> : null}
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === Role.ADMIN ? 4 : 3} className="p-4 text-center text-muted-foreground">
                      No upcoming events.
                    </td>
                  </tr>
                ) : (
                  upcomingEvents.map((event: any) => (
                    <tr key={event.id} className="flex flex-col sm:table-row border-b border-border/50 p-4 sm:p-0">
                      <td className="sm:px-2 sm:py-2 mb-1 sm:mb-0">
                        <Link prefetch={false} className="font-semibold sm:font-medium text-primary hover:underline" href={`/events/${event.id}`}>
                          {event.title}
                        </Link>
                        <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                          {formatDateTime(event.startDateTime)}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-2 py-2 text-muted-foreground">{formatDateTime(event.startDateTime)}</td>
                      <td className="hidden lg:table-cell px-2 py-2 text-muted-foreground">{formatDateTime(event.endDateTime)}</td>
                      {user.role === Role.ADMIN ? <td className="hidden lg:table-cell px-2 py-2 text-muted-foreground">{event.createdBy.name}</td> : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
