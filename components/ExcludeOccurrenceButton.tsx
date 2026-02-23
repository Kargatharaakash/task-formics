"use client";

import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ExcludeOccurrenceButtonProps = {
  eventId: string;
  occurrenceStart: string;
};

export function ExcludeOccurrenceButton({ eventId, occurrenceStart }: ExcludeOccurrenceButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleExclude(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    const confirmed = window.confirm("Exclude this occurrence from the recurring series?");
    if (!confirmed) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/occurrence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          occurrenceStart,
          excludeOnly: true
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to exclude occurrence.");
        return;
      }

      toast.success("Occurrence excluded.");
      router.refresh();
      setTimeout(() => router.refresh(), 120);
    } catch {
      toast.error("Failed to exclude occurrence.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExclude} disabled={isLoading}>
      <Ban className="h-4 w-4" />
      {isLoading ? "Excluding..." : "Exclude"}
    </Button>
  );
}
