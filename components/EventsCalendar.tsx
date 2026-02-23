"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
  EventSourceFuncArg
} from "@fullcalendar/core";
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";

type OccurrenceApiItem = {
  eventId: string;
  sourceEventId: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  occurrenceStart: string;
  isFromRecurringBase: boolean;
  isOccurrenceOverride: boolean;
  createdById: string;
};

export function EventsCalendar() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (
      fetchInfo: EventSourceFuncArg,
      successCallback: (events: EventInput[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/events/occurrences?start=${encodeURIComponent(fetchInfo.startStr)}&end=${encodeURIComponent(fetchInfo.endStr)}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );

        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          occurrences?: OccurrenceApiItem[];
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load calendar events.");
        }

        const events = (data.occurrences ?? []).map((item) => ({
          id: `${item.sourceEventId}-${item.occurrenceStart}`,
          title: item.title,
          start: item.start,
          end: item.end,
          extendedProps: {
            eventId: item.eventId,
            sourceEventId: item.sourceEventId,
            occurrenceStart: item.occurrenceStart,
            isFromRecurringBase: item.isFromRecurringBase,
            isOccurrenceOverride: item.isOccurrenceOverride,
            description: item.description
          }
        }));

        successCallback(events);
      } catch (requestError) {
        const typedError = requestError instanceof Error ? requestError : new Error("Unable to load events.");
        setError(typedError.message);
        failureCallback(typedError);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const toolbar = {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
  };

  function handleEventClick(arg: EventClickArg) {
    const eventId = arg.event.extendedProps.eventId as string | undefined;
    const occurrenceStart = arg.event.extendedProps.occurrenceStart as string | undefined;
    if (!eventId) return;
    router.push(
      occurrenceStart
        ? `/events/${eventId}?occurrenceStart=${encodeURIComponent(occurrenceStart)}`
        : `/events/${eventId}`
    );
  }

  function handleSelect(selection: DateSelectArg) {
    const start = selection.start.toISOString();
    const end = selection.end.toISOString();
    router.push(`/events/new?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  }

  async function persistMovedOccurrence({
    rootEventId,
    sourceEventId,
    occurrenceStart,
    title,
    description,
    startDateTime,
    endDateTime
  }: {
    rootEventId: string;
    sourceEventId: string;
    occurrenceStart: string;
    title: string;
    description: string | null;
    startDateTime: string;
    endDateTime: string;
  }) {
    const response = await fetch(`/api/events/${rootEventId}/occurrence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sourceEventId,
        occurrenceStart,
        title,
        description,
        startDateTime,
        endDateTime
      })
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to move occurrence.");
    }
  }

  async function handleDrop(arg: EventDropArg) {
    const rootEventId = arg.event.extendedProps.eventId as string | undefined;
    const sourceEventId = arg.event.extendedProps.sourceEventId as string | undefined;
    const occurrenceStart = arg.event.extendedProps.occurrenceStart as string | undefined;

    if (!rootEventId || !sourceEventId || !occurrenceStart || !arg.event.start) {
      arg.revert();
      toast.error("Unable to move this event.");
      return;
    }

    const oldStart = arg.oldEvent.start;
    const oldEnd = arg.oldEvent.end;
    const duration = oldStart ? (oldEnd?.getTime() ?? oldStart.getTime() + 60 * 60 * 1000) - oldStart.getTime() : 0;

    const newStartDate = arg.event.start;
    const newEndDate = arg.event.end ?? new Date(newStartDate.getTime() + Math.max(duration, 30 * 60 * 1000));

    try {
      await persistMovedOccurrence({
        rootEventId,
        sourceEventId,
        occurrenceStart,
        title: arg.event.title,
        description: (arg.event.extendedProps.description as string | null | undefined) ?? null,
        startDateTime: newStartDate.toISOString(),
        endDateTime: newEndDate.toISOString()
      });
      toast.success("Occurrence updated.");
      router.refresh();
    } catch (error) {
      arg.revert();
      toast.error(error instanceof Error ? error.message : "Unable to update occurrence.");
    }
  }

  async function handleResize(arg: EventResizeDoneArg) {
    const rootEventId = arg.event.extendedProps.eventId as string | undefined;
    const sourceEventId = arg.event.extendedProps.sourceEventId as string | undefined;
    const occurrenceStart = arg.event.extendedProps.occurrenceStart as string | undefined;

    if (!rootEventId || !sourceEventId || !occurrenceStart || !arg.event.start || !arg.event.end) {
      arg.revert();
      toast.error("Unable to resize this event.");
      return;
    }

    try {
      await persistMovedOccurrence({
        rootEventId,
        sourceEventId,
        occurrenceStart,
        title: arg.event.title,
        description: (arg.event.extendedProps.description as string | null | undefined) ?? null,
        startDateTime: arg.event.start.toISOString(),
        endDateTime: arg.event.end.toISOString()
      });
      toast.success("Occurrence updated.");
      router.refresh();
    } catch (error) {
      arg.revert();
      toast.error(error instanceof Error ? error.message : "Unable to resize occurrence.");
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert className="border-destructive/40 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading occurrences...
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border/70 bg-card p-2 md:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={toolbar}
          height="auto"
          selectable
          selectMirror
          editable
          eventDurationEditable
          eventStartEditable
          eventDisplay="block"
          dayMaxEvents
          listDayFormat={{ weekday: "long", month: "short", day: "numeric" }}
          dayHeaderContent={(arg) => {
            const date = arg.date;
            const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
            if (arg.view.type === "dayGridMonth") return weekday;
            return `${weekday} ${date.getDate()}/${date.getMonth() + 1}`;
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            list: "List"
          }}
          events={loadEvents}
          eventClick={handleEventClick}
          select={handleSelect}
          eventDrop={handleDrop}
          eventResize={handleResize}
        />
      </div>
    </div>
  );
}
