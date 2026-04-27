import { useEffect, useMemo, useState, type FormEvent } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { PageHeader } from "../../../components/shared/page-header";
import { SectionCard } from "../../../components/shared/section-card";
import { api } from "../../../lib/api/client";

type Dentist = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  licenseNumber: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

type Treatment = {
  id: number;
  name: string;
  category: string;
  defaultDurationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  basePrice: number | null;
  active: boolean;
};

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type Appointment = {
  id: number;
  dentistId: number;
  dentistName: string;
  patientId: number;
  patientName: string;
  scheduledAt: string;
  endsAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  treatmentId?: number | null;
  treatmentType: string | null;
  notes: string | null;
  cancelledReason: string | null;
};

type AppointmentForm = {
  dentistId: string;
  treatmentId: string;
  date: string;
  time: string;
  notes: string;
};

const emptyAppointments: Appointment[] = [];

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

const today = toDateInputValue(new Date());

const initialForm: AppointmentForm = {
  dentistId: "",
  treatmentId: "",
  date: today,
  time: "09:00",
  notes: "",
};

function buildLimaDateTime(date: string, time: string) {
  return `${date}T${time}:00-05:00`;
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) return "Sin precio";

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
}

function getStatusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No asistió",
  };

  return labels[status];
}

function getStatusBadgeClass(status: AppointmentStatus) {
  const classes: Record<AppointmentStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    CONFIRMED: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
    NO_SHOW: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return classes[status];
}

function getCalendarEventClass(status?: AppointmentStatus) {
  if (status === "COMPLETED") {
    return ["!bg-emerald-600", "!border-emerald-600", "!text-white"];
  }

  if (status === "CONFIRMED") {
    return ["!bg-cyan-600", "!border-cyan-600", "!text-white"];
  }

  if (status === "CANCELLED") {
    return ["!bg-rose-500", "!border-rose-500", "!text-white"];
  }

  if (status === "NO_SHOW") {
    return ["!bg-slate-500", "!border-slate-500", "!text-white"];
  }

  return ["!bg-amber-500", "!border-amber-500", "!text-white"];
}

function getErrorMessage(error: unknown) {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
        detail?: string;
        error?: string;
      };
    };
    message?: string;
  };

  return (
    apiError.response?.data?.message ||
    apiError.response?.data?.detail ||
    apiError.response?.data?.error ||
    apiError.message ||
    "Ocurrió un error inesperado"
  );
}

export function AppointmentsPage() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(emptyAppointments);
  const [form, setForm] = useState<AppointmentForm>(initialForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedTreatment = useMemo(
    () =>
      treatments.find(
        (treatment) => treatment.id === Number(form.treatmentId)
      ),
    [form.treatmentId, treatments]
  );

  const selectedDentist = useMemo(
    () => dentists.find((dentist) => dentist.id === Number(form.dentistId)),
    [form.dentistId, dentists]
  );

  const calendarEvents = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: String(appointment.id),
        title: `${appointment.patientName} · ${
          appointment.treatmentType || "Cita odontológica"
        }`,
        start: appointment.scheduledAt,
        end: appointment.endsAt,
        extendedProps: {
          status: appointment.status,
          dentistName: appointment.dentistName,
          notes: appointment.notes,
        },
      })),
    [appointments]
  );

  const todayAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const appointmentDate = appointment.scheduledAt.slice(0, 10);
        return appointmentDate === today;
      }),
    [appointments]
  );

  const pendingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "PENDING" ||
          appointment.status === "CONFIRMED"
      ),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((appointment) => appointment.status !== "CANCELLED")
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime()
        )
        .slice(0, 8),
    [appointments]
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [dentistsResponse, treatmentsResponse, appointmentsResponse] =
        await Promise.all([
          api.get<Dentist[]>("/dentists"),
          api.get<Treatment[]>("/treatments/active"),
          api.get<Appointment[]>("/appointments/me"),
        ]);

      setDentists(dentistsResponse.data ?? []);
      setTreatments(treatmentsResponse.data ?? []);
      setAppointments(appointmentsResponse.data ?? []);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function refreshAppointments() {
    const { data } = await api.get<Appointment[]>("/appointments/me");
    setAppointments(data ?? []);
  }

  function updateForm<K extends keyof AppointmentForm>(
    key: K,
    value: AppointmentForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function openNewAppointmentModal() {
    setError("");
    setSuccessMessage("");
    setIsModalOpen(true);
  }

  function closeNewAppointmentModal() {
    if (saving) return;
    setIsModalOpen(false);
  }

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.dentistId) {
      setError("Selecciona un odontólogo.");
      return;
    }

    if (!form.treatmentId) {
      setError("Selecciona un tratamiento.");
      return;
    }

    if (!form.date || !form.time) {
      setError("Selecciona fecha y hora para la cita.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await api.post("/appointments", {
        dentistId: Number(form.dentistId),
        scheduledAt: buildLimaDateTime(form.date, form.time),
        treatmentId: Number(form.treatmentId),
        notes: form.notes.trim() || undefined,
      });

      await refreshAppointments();

      setForm(initialForm);
      setIsModalOpen(false);
      setSuccessMessage("Cita creada correctamente.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gestiona las citas clínicas por día, semana o mes con datos reales del sistema."
        actions={
          <button
            type="button"
            onClick={openNewAppointmentModal}
            className="h-11 rounded-2xl bg-cyan-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
          >
            + Nueva cita
          </button>
        }
      />

      {error && !isModalOpen ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Pendientes
          </p>
          <strong className="mt-3 block text-3xl font-black text-slate-950">
            {loading ? "..." : pendingAppointments.length}
          </strong>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Citas aún por atender.
          </p>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Hoy
          </p>
          <strong className="mt-3 block text-3xl font-black text-slate-950">
            {loading ? "..." : todayAppointments.length}
          </strong>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Programadas para hoy.
          </p>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Tratamientos
          </p>
          <strong className="mt-3 block text-3xl font-black text-slate-950">
            {loading ? "..." : treatments.length}
          </strong>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Con duración automática.
          </p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Calendario clínico"
          subtitle="Puedes cambiar entre vista mensual, semanal y diaria."
        >
          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
              Cargando agenda...
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-3">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                buttonText={{
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                }}
                locale="es"
                height="auto"
                allDaySlot={false}
                nowIndicator
                selectable
                editable={false}
                events={calendarEvents}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                expandRows
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                dateClick={(info) => {
                  const date = toDateInputValue(info.date);
                  const time = toTimeInputValue(info.date);

                  updateForm("date", date);
                  updateForm("time", time === "00:00" ? "09:00" : time);
                  openNewAppointmentModal();
                }}
                eventClick={(info) => {
                  const start = info.event.start;

                  if (!start) return;

                  updateForm("date", toDateInputValue(start));
                  updateForm("time", toTimeInputValue(start));
                }}
                eventContent={(eventInfo) => (
                  <div className="px-2 py-1">
                    <p className="text-[11px] font-black leading-tight">
                      {eventInfo.timeText}
                    </p>
                    <p className="truncate text-xs font-bold leading-tight">
                      {eventInfo.event.title}
                    </p>
                  </div>
                )}
                eventClassNames={(arg) =>
                  getCalendarEventClass(
                    arg.event.extendedProps.status as AppointmentStatus
                  )
                }
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Próximas citas"
          subtitle="Resumen rápido de la agenda activa."
        >
          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              Cargando citas...
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-bold text-slate-700">
                Todavía no hay citas registradas.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Crea una cita usando el botón superior.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-950">
                        {appointment.treatmentType || "Cita odontológica"}
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDate(appointment.scheduledAt)} ·{" "}
                        {formatHour(appointment.scheduledAt)} -{" "}
                        {formatHour(appointment.endsAt)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStatusBadgeClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs font-medium text-slate-500">
                    <p>Dr(a). {appointment.dentistName}</p>
                    <p>Paciente: {appointment.patientName}</p>
                    <p>{appointment.durationMinutes} min</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Nueva cita
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  La duración se calcula automáticamente según el tratamiento.
                </p>
              </div>

              <button
                type="button"
                onClick={closeNewAppointmentModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ×
              </button>
            </div>

            {error ? (
              <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Odontólogo
                  </span>
                  <select
                    value={form.dentistId}
                    onChange={(event) =>
                      updateForm("dentistId", event.target.value)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={loading || saving}
                  >
                    <option value="">Selecciona un odontólogo</option>
                    {dentists.map((dentist) => (
                      <option key={dentist.id} value={dentist.id}>
                        {dentist.fullName}
                        {dentist.specialty ? ` · ${dentist.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Tratamiento
                  </span>
                  <select
                    value={form.treatmentId}
                    onChange={(event) =>
                      updateForm("treatmentId", event.target.value)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={loading || saving}
                  >
                    <option value="">Selecciona un tratamiento</option>
                    {treatments.map((treatment) => (
                      <option key={treatment.id} value={treatment.id}>
                        {treatment.name} · {treatment.defaultDurationMinutes} min
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedTreatment ? (
                <div className="grid gap-3 rounded-3xl border border-cyan-100 bg-cyan-50 p-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                      Tratamiento
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {selectedTreatment.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                      Duración
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {selectedTreatment.defaultDurationMinutes} min
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                      Precio base
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatPrice(selectedTreatment.basePrice)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Fecha
                  </span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={saving}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">
                    Hora
                  </span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => updateForm("time", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">
                  Notas
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  rows={4}
                  placeholder="Ej. Paciente refiere sensibilidad dental..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  disabled={saving}
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">
                    Resumen:
                  </span>{" "}
                  {selectedDentist ? selectedDentist.fullName : "Sin odontólogo"}{" "}
                  ·{" "}
                  {selectedTreatment
                    ? `${selectedTreatment.name} (${selectedTreatment.defaultDurationMinutes} min)`
                    : "Sin tratamiento"}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeNewAppointmentModal}
                  disabled={saving}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="h-11 rounded-2xl bg-cyan-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Creando cita..." : "Crear cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}