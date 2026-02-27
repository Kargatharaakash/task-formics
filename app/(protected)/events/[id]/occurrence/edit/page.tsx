import { notFound, redirect } from "next/navigation";

import { OccurrenceForm } from "@/components/OccurrenceForm";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { canManageEvent } from "@/lib/authorization";
import { RecurrenceType } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

type EditOccurrencePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    occurrenceStart?: string;
  }>;
};

export default async function EditOccurrencePage({ params, searchParams }: EditOccurrencePageProps) {
  const [user, { id }, search] = await Promise.all([
    requireUser(),
    params,
    searchParams
  ]);

  const occurrenceStartRaw = search.occurrenceStart;
  const occurrenceStart = occurrenceStartRaw ? new Date(occurrenceStartRaw) : null;

  if (!occurrenceStart || Number.isNaN(occurrenceStart.getTime())) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit occurrence" subtitle="A valid occurrenceStart is required." />
        <Card className="border-border/70">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Open this page from an event occurrence action so the specific occurrence can be identified.
          </CardContent>
        </Card>
      </div>
    );
  }

  const event = await db.event.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true
        }
      }
    }
  });

  if (!event) {
    notFound();
  }

  if (!canManageEvent(user, event.createdById)) {
    redirect("/events");
  }

  if (event.recurrence === RecurrenceType.NONE) {
    redirect(`/events/${id}/edit`);
  }

  const override = await db.event.findFirst({
    where: {
      parentEventId: id,
      occurrenceDate: occurrenceStart
    }
  });

  const durationMs = event.endDateTime.getTime() - event.startDateTime.getTime();

  const initialStart = override ? override.startDateTime : occurrenceStart;
  const initialEnd = override ? override.endDateTime : new Date(occurrenceStart.getTime() + durationMs);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit occurrence"
        subtitle={`Series: ${event.title} (${event.createdBy.name})`}
      />

      <OccurrenceForm
        eventId={id}
        sourceEventId={override?.id ?? null}
        occurrenceStart={occurrenceStart.toISOString()}
        initial={{
          title: override?.title ?? event.title,
          description: override?.description ?? event.description,
          startDateTime: initialStart,
          endDateTime: initialEnd
        }}
      />
    </div>
  );
}
