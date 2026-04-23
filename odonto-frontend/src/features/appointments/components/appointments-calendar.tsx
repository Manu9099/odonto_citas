import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { SectionCard } from "../../../components/shared/section-card";

const events = [
  {
    id: "1",
    title: "Luis Pérez · Limpieza dental",
    start: "2026-04-25T10:00:00",
    end: "2026-04-25T10:30:00",
  },
  {
    id: "2",
    title: "Carla Mendoza · Ortodoncia",
    start: "2026-04-25T12:00:00",
    end: "2026-04-25T12:45:00",
     },
    ];

    export function AppointmentsCalendar() {
      return (
        <SectionCard title="Agenda" subtitle="Vista semanal del consultorio" className="overflow-hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                 right: "dayGridMonth,timeGridWeek,timeGridDay",
                   }}
                     slotMinTime="08:00:00"
                      slotMaxTime="20:00:00"
                      allDaySlot={false}
                      height="auto"
                      locale="es"
                       events={events}
                      />
                     </div>
                       </SectionCard>
                       );
                     }
