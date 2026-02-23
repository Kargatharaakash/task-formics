import { EventsCalendar } from "@/components/EventsCalendar";
import { PageHeader } from "@/components/PageHeader";
import { requireUser } from "@/lib/auth/guards";

export default async function CalendarPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Month, week, day, and list views with recurring occurrences. Drag and resize to update."
      />
      <EventsCalendar />
    </div>
  );
}
