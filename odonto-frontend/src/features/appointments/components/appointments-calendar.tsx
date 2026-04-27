import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { SectionCard } from "../../../components/shared/section-card";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps?: {
    status?: string;
    dentistName?: string;
    notes?: string | null;
  };
};

type AppointmentsCalendarProps = {
  events: CalendarEvent[];
  loading?: boolean;
  onDateClick?: (date: string, time: string) => void;
  onEventClick?: (appointmentId: number) => void;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function AppointmentsCalendar({
  events,
  loading = false,
  onDateClick,
  onEventClick,
}: AppointmentsCalendarProps) {
  return (
    <SectionCard
      title="Agenda clínica"
      description="Visualiza las citas reales registradas en el sistema."
    >
      {loading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
          Cargando agenda...
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-3">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            height="auto"
            locale="es"
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            events={events}
            nowIndicator
            selectable
            dateClick={(info: DateClickArg) => {
              const date = toDateInputValue(info.date);
              const time = toTimeInputValue(info.date);

              onDateClick?.(date, time === "00:00" ? "09:00" : time);
            }}
            eventClick={(info: EventClickArg) => {
              onEventClick?.(Number(info.event.id));
            }}
            eventContent={(eventInfo: EventContentArg) => (
              <div className="px-2 py-1">
                <p className="text-[11px] font-bold">{eventInfo.timeText}</p>
                <p className="truncate text-xs font-semibold">
                  {eventInfo.event.title}
                </p>
              </div>
            )}
            eventClassNames={() => [
              "rounded-xl",
              "border-0",
              "shadow-sm",
              "overflow-hidden",
            ]}
          />
        </div>
      )}
    </SectionCard>
  );
}