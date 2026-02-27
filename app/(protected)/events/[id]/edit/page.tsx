import { notFound, redirect } from "next/navigation";

import { EventForm } from "@/components/EventForm";
import { PageHeader } from "@/components/PageHeader";
import { isRecurrenceType, RecurrenceType, Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

type EditEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const [user, { id }] = await Promise.all([requireUser(), params]);

  const event = await db.event.findUnique({ where: { id } });
  if (!event) {
    notFound();
  }

  const canManage = user.role === Role.ADMIN || user.id === event.createdById;
  if (!canManage) {
    redirect("/events");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit event" subtitle="Update event details and recurrence" />
      <EventForm
        mode="edit"
        initial={{
          id: event.id,
          title: event.title,
          description: event.description,
          startDateTime: event.startDateTime.toISOString(),
          endDateTime: event.endDateTime.toISOString(),
          recurrence: isRecurrenceType(event.recurrence) ? event.recurrence : RecurrenceType.NONE,
          recurrenceEndsAt: event.recurrenceEndsAt ? event.recurrenceEndsAt.toISOString() : null,
          recurrenceCount: event.recurrenceCount
        }}
      />
    </div>
  );
}
