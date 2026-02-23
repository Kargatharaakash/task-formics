"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecurrenceType } from "@/lib/constants";
import { toDateTimeLocalValue } from "@/lib/date";

type EventFormInitial = {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  recurrence: RecurrenceType;
  recurrenceEndsAt: string | null;
  recurrenceCount: number | null;
};

type EventFormProps = {
  mode: "create" | "edit";
  initial?: EventFormInitial;
  defaultStartDateTime?: string;
  defaultEndDateTime?: string;
};

function getDefaultStart() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}

function parseSafeDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function EventForm({ mode, initial, defaultStartDateTime, defaultEndDateTime }: EventFormProps) {
  const router = useRouter();

  const defaults = useMemo(() => {
    const safeDefaultStart = parseSafeDate(defaultStartDateTime);
    const safeDefaultEnd = parseSafeDate(defaultEndDateTime);

    const start = initial
      ? new Date(initial.startDateTime)
      : safeDefaultStart
        ? safeDefaultStart
        : getDefaultStart();
    const end = initial
      ? new Date(initial.endDateTime)
      : safeDefaultEnd
        ? safeDefaultEnd
        : new Date(start.getTime() + 60 * 60 * 1000);

    return {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      startDateTime: toDateTimeLocalValue(start),
      endDateTime: toDateTimeLocalValue(end),
      recurrence: initial?.recurrence ?? RecurrenceType.NONE,
      recurrenceEndsAt: initial?.recurrenceEndsAt ? toDateTimeLocalValue(new Date(initial.recurrenceEndsAt)) : "",
      recurrenceCount: initial?.recurrenceCount ? String(initial.recurrenceCount) : "5"
    };
  }, [defaultEndDateTime, defaultStartDateTime, initial]);

  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [startDateTime, setStartDateTime] = useState(defaults.startDateTime);
  const [endDateTime, setEndDateTime] = useState(defaults.endDateTime);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(defaults.recurrence);
  const [recurrenceMode, setRecurrenceMode] = useState<"endDate" | "count">(
    initial?.recurrenceCount ? "count" : "endDate"
  );
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState(defaults.recurrenceEndsAt);
  const [recurrenceCount, setRecurrenceCount] = useState(defaults.recurrenceCount);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError("Please provide a valid start and end time. End must be after start.");
      return;
    }

    const payload: Record<string, unknown> = {
      title,
      description: description.trim() || null,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      recurrence
    };

    if (recurrence !== RecurrenceType.NONE) {
      if (recurrenceMode === "endDate") {
        if (!recurrenceEndsAt) {
          setError("Select recurrence end date/time or switch to occurrence count.");
          return;
        }

        const endsAt = new Date(recurrenceEndsAt);
        if (Number.isNaN(endsAt.getTime())) {
          setError("Recurrence end date/time is invalid.");
          return;
        }

        payload.recurrenceEndsAt = endsAt.toISOString();
      } else {
        const parsedCount = Number(recurrenceCount);
        if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
          setError("Recurrence count must be a positive number.");
          return;
        }

        payload.recurrenceCount = parsedCount;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === "create" ? "/api/events" : `/api/events/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        event?: { id: string };
      };

      if (!response.ok) {
        setError(data.error ?? "Unable to save event.");
        return;
      }

      const nextEventId = data.event?.id ?? initial?.id;
      if (nextEventId) {
        router.push(`/events/${nextEventId}`);
      } else {
        router.push("/events");
      }
      router.refresh();
    } catch {
      setError("Unable to save event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Event details" : "Update event"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={150}
              placeholder="Project kickoff"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Agenda, location, notes"
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDateTime">Start</Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(event) => setStartDateTime(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDateTime">End</Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(event) => setEndDateTime(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrence</Label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(event) => setRecurrence(event.target.value as RecurrenceType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={RecurrenceType.NONE}>Does not repeat</option>
              <option value={RecurrenceType.DAILY}>Daily</option>
              <option value={RecurrenceType.WEEKLY}>Weekly</option>
              <option value={RecurrenceType.MONTHLY}>Monthly</option>
            </select>
          </div>

          {recurrence !== RecurrenceType.NONE ? (
            <div className="space-y-4 rounded-lg border border-dashed border-border bg-secondary/40 p-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-normal">
                  <input
                    type="radio"
                    name="recurrence-mode"
                    checked={recurrenceMode === "endDate"}
                    onChange={() => setRecurrenceMode("endDate")}
                    className="h-4 w-4 accent-primary"
                  />
                  End by date/time
                </Label>
                {recurrenceMode === "endDate" ? (
                  <Input
                    type="datetime-local"
                    value={recurrenceEndsAt}
                    onChange={(event) => setRecurrenceEndsAt(event.target.value)}
                    required
                  />
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-normal">
                  <input
                    type="radio"
                    name="recurrence-mode"
                    checked={recurrenceMode === "count"}
                    onChange={() => setRecurrenceMode("count")}
                    className="h-4 w-4 accent-primary"
                  />
                  Limit by number of occurrences
                </Label>
                {recurrenceMode === "count" ? (
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={recurrenceCount}
                    onChange={(event) => setRecurrenceCount(event.target.value)}
                    required
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {error ? (
            <Alert className="border-destructive/50 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "create" ? "Create event" : "Update event"}
            </Button>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={mode === "create" ? "/events" : `/events/${initial?.id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
