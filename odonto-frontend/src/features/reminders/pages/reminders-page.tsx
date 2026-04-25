import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../../lib/api/client";
import { PageHeader } from "../../../components/shared/page-header";
import { cn } from "../../../lib/utils/cn";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "PAID"
  | string;

type Appointment = {
  id: number;
  dentistId?: number;
  dentistName?: string;
  patientId: number;
  patientName: string;
  scheduledAt: string;
  endsAt?: string;
  durationMinutes?: number;
  status: AppointmentStatus;
  treatmentType?: string;
  notes?: string | null;
};

type FilterType = "all" | "today" | "tomorrow" | "week";

function formatDate(value?: string) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
}

function formatHour(value?: string) {
  if (!value) return "--:--";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeStatus(status?: AppointmentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "CONFIRMED") return "Confirmada";
  if (value === "PENDING") return "Pendiente";
  if (value === "PAID") return "Pagada";
  if (value === "COMPLETED") return "Completada";
  if (value === "CANCELLED") return "Cancelada";

  return status || "Sin estado";
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getHoursUntil(value: string) {
  const now = new Date();
  const target = new Date(value);

  return (target.getTime() - now.getTime()) / 1000 / 60 / 60;
}

function reminderPriority(appointment: Appointment) {
  const hours = getHoursUntil(appointment.scheduledAt);

  if (hours < 0) {
    return {
      label: "Vencida",
      className: "border-red-100 bg-red-50 text-red-700",
    };
  }

  if (hours <= 24) {
    return {
      label: "Enviar hoy",
      className: "border-amber-100 bg-amber-50 text-amber-700",
    };
  }

  if (hours <= 48) {
    return {
      label: "Mañana",
      className: "border-blue-100 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "Programada",
    className: "border-slate-100 bg-slate-50 text-slate-600",
  };
}

function buildReminderMessage(appointment: Appointment) {
  return `Hola ${appointment.patientName}, te recordamos tu cita odontológica el ${formatDate(
    appointment.scheduledAt
  )} a las ${formatHour(appointment.scheduledAt)} con ${
    appointment.dentistName ?? "tu odontólogo"
  }. Tratamiento: ${
    appointment.treatmentType ?? "consulta odontológica"
  }. Por favor confirma tu asistencia.`;
}

function canSendReminder(appointment: Appointment) {
  const status = String(appointment.status).toUpperCase();

  return status !== "CANCELLED" && status !== "COMPLETED";
}

export function RemindersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const {
    data: appointments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reminders-appointments"],
    queryFn: async () => {
      const response = await api.get<Appointment[]>("/appointments/me");
      return response.data;
    },
  });

  const reminderAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => canSendReminder(appointment))
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.scheduledAt);
        const tomorrow = addDays(now, 1);
        const inSevenDays = addDays(now, 7);

        if (filter === "today") return isSameDate(appointmentDate, now);
        if (filter === "tomorrow") return isSameDate(appointmentDate, tomorrow);
        if (filter === "week") {
          return appointmentDate >= now && appointmentDate <= inSevenDays;
        }

        return true;
      })
      .filter((appointment) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return (
          appointment.patientName.toLowerCase().includes(query) ||
          appointment.dentistName?.toLowerCase().includes(query) ||
          appointment.treatmentType?.toLowerCase().includes(query)
        );
      });
  }, [appointments, filter, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const inSevenDays = addDays(now, 7);

    const active = appointments.filter((appointment) =>
      canSendReminder(appointment)
    );

    const today = active.filter((appointment) =>
      isSameDate(new Date(appointment.scheduledAt), now)
    ).length;

    const tomorrowCount = active.filter((appointment) =>
      isSameDate(new Date(appointment.scheduledAt), tomorrow)
    ).length;

    const week = active.filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduledAt);
      return appointmentDate >= now && appointmentDate <= inSevenDays;
    }).length;

    return {
      total: active.length,
      today,
      tomorrow: tomorrowCount,
      week,
    };
  }, [appointments]);

  async function handleCopy(appointment: Appointment) {
    const message = buildReminderMessage(appointment);

    await navigator.clipboard.writeText(message);

    setCopiedId(appointment.id);

    window.setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  }

  function handleOpenWhatsApp(appointment: Appointment) {
    const message = buildReminderMessage(appointment);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Comunicación"
        title="Recordatorios"
        description="Prepara mensajes para recordar citas próximas a tus pacientes."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Recordatorios</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.total}
              </p>
              <p className="mt-2 text-sm text-slate-500">Citas activas</p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Bell className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Hoy</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.today}
              </p>
              <p className="mt-2 text-sm text-slate-500">Enviar ahora</p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Mañana</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.tomorrow}
              </p>
              <p className="mt-2 text-sm text-slate-500">Aviso 24h antes</p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
              <CalendarClock className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Semana</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.week}
              </p>
              <p className="mt-2 text-sm text-slate-500">Próximos 7 días</p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Bandeja de recordatorios
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filtra citas y copia mensajes listos para enviar.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar paciente..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterType)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">Todos</option>
              <option value="today">Hoy</option>
              <option value="tomorrow">Mañana</option>
              <option value="week">Próximos 7 días</option>
            </select>
          </div>
        </div>
      </section>

      {isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          No se pudieron cargar los recordatorios. Revisa token y backend.
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-black text-slate-950">
            Citas por recordar
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {reminderAppointments.length} resultado
            {reminderAppointments.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-500">
              Cargando recordatorios...
            </div>
          ) : reminderAppointments.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                  <Bell className="size-7" />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  No hay recordatorios para mostrar
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Cambia el filtro o crea nuevas citas.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {reminderAppointments.map((appointment) => {
                const priority = reminderPriority(appointment);
                const message = buildReminderMessage(appointment);

                return (
                  <article
                    key={appointment.id}
                    className="rounded-3xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                        <UserRound className="size-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-950">
                              {appointment.patientName}
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {appointment.treatmentType ??
                                "Consulta odontológica"}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "w-fit rounded-full border px-3 py-1 text-xs font-black",
                              priority.className
                            )}
                          >
                            {priority.label}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              Fecha
                            </p>
                            <p className="mt-1 text-sm font-bold capitalize text-slate-700">
                              {formatDate(appointment.scheduledAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              Hora
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {formatHour(appointment.scheduledAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              Estado
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {normalizeStatus(appointment.status)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Mensaje sugerido
                          </p>

                          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                            {message}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleCopy(appointment)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                          >
                            <Copy className="size-4" />
                            {copiedId === appointment.id
                              ? "Copiado"
                              : "Copiar mensaje"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(appointment)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                          >
                            <MessageCircle className="size-4" />
                            Abrir WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(appointment)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                          >
                            <Send className="size-4" />
                            Preparar envío
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}