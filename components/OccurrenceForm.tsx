"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateTimeLocalValue } from "@/lib/date";

type OccurrenceFormProps = {
  eventId: string;
  sourceEventId?: string | null;
  occurrenceStart: string;
  initial: {
    title: string;
    description: string | null;
    startDateTime: Date;
    endDateTime: Date;
  };
};

export function OccurrenceForm({ eventId, sourceEventId, occurrenceStart, initial }: OccurrenceFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [startDateTime, setStartDateTime] = useState(toDateTimeLocalValue(initial.startDateTime));
  const [endDateTime, setEndDateTime] = useState(toDateTimeLocalValue(initial.endDateTime));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedStart = new Date(startDateTime);
    const parsedEnd = new Date(endDateTime);

    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
      setError("Please provide valid start/end values. End must be after start.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/occurrence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceEventId: sourceEventId ?? undefined,
          occurrenceStart,
          title,
          description: description.trim() || null,
          startDateTime: parsedStart.toISOString(),
          endDateTime: parsedEnd.toISOString()
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to update occurrence.");
        return;
      }

      toast.success("Occurrence updated.");
      router.push(`/events/${eventId}?occurrenceStart=${encodeURIComponent(occurrenceStart)}`);
      router.refresh();
    } catch {
      setError("Failed to update occurrence.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Edit single occurrence</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="occurrence-title">Title</Label>
            <Input
              id="occurrence-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurrence-description">Description</Label>
            <Textarea
              id="occurrence-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="occurrence-start">Start</Label>
              <Input
                id="occurrence-start"
                type="datetime-local"
                value={startDateTime}
                onChange={(event) => setStartDateTime(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occurrence-end">End</Label>
              <Input
                id="occurrence-end"
                type="datetime-local"
                value={endDateTime}
                onChange={(event) => setEndDateTime(event.target.value)}
                required
              />
            </div>
          </div>

          {error ? (
            <Alert className="border-destructive/40 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save occurrence"}
            </Button>
            <Link
              prefetch={false}
              href={`/events/${eventId}`}
              className={buttonVariants({
                variant: "outline"
              })}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
