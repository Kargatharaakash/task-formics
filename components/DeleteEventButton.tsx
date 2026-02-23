"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type DeleteEventButtonProps = {
  eventId: string;
  redirectTo?: string;
  size?: "default" | "sm";
};

export function DeleteEventButton({ eventId, redirectTo, size = "sm" }: DeleteEventButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "Failed to delete event.");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="destructive" size={size} onClick={handleDelete} disabled={isLoading}>
      <Trash2 className="h-4 w-4" />
      {isLoading ? "Deleting..." : "Delete"}
    </Button>
  );
}
