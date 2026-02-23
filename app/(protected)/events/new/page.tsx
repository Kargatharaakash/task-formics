import { EventForm } from "@/components/EventForm";
import { PageHeader } from "@/components/PageHeader";
import { requireUser } from "@/lib/auth/guards";

type NewEventPageProps = {
  searchParams: Promise<{
    start?: string;
    end?: string;
  }>;
};

export default async function NewEventPage({ searchParams }: NewEventPageProps) {
  await requireUser();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader title="Create event" subtitle="Add schedule, details, and recurrence settings" />
      <EventForm mode="create" defaultStartDateTime={params.start} defaultEndDateTime={params.end} />
    </div>
  );
}
