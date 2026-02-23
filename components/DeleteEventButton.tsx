"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteEventButtonProps = {
  eventId: string;
  redirectTo?: string;
  size?: "default" | "sm" | "icon";
  iconOnlyOnMobile?: boolean;
};

export function DeleteEventButton({ eventId, redirectTo, size = "sm", iconOnlyOnMobile }: DeleteEventButtonProps) {
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
    <Button
      type="button"
      variant="destructive"
      size={iconOnlyOnMobile ? "sm" : size}
      className={cn(iconOnlyOnMobile && "max-sm:px-2")}
      onClick={handleDelete}
      disabled={isLoading}
    >
      <Trash2 className="h-4 w-4" />
      <span className={cn(iconOnlyOnMobile && "max-sm:hidden", "ml-2")}>
        {isLoading ? "Deleting..." : "Delete"}
      </span>
    </Button>
  );
}
