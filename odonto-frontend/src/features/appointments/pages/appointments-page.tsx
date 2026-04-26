import { FormEvent, useEffect, useMemo, useState } from "react";

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

const today = new Date().toISOString().slice(0, 10);

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);

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

      setDentists(dentistsResponse.data);
      setTreatments(treatmentsResponse.data);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function refreshAppointments() {
    const { data } = await api.get<Appointment[]>("/appointments/me");
    setAppointments(data);
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

      await api.post<Appointment>("/appointments", {
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
        description="Gestiona citas, disponibilidad y reprogramaciones."
        actions={
          <button
            type="button"
            onClick={openNewAppointmentModal}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            + Nueva cita
          </button>
        }
      />

      {error && !isModalOpen && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Citas activas" subtitle="Pendientes y confirmadas">
          <p className="text-3xl font-bold text-slate-900">
            {loading ? "..." : pendingAppointments.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Citas aún por atender.
          </p>
        </SectionCard>

        <SectionCard title="Citas de hoy" subtitle="Agenda diaria">
          <p className="text-3xl font-bold text-slate-900">
            {loading ? "..." : todayAppointments.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Programadas para hoy.
          </p>
        </SectionCard>

        <SectionCard title="Tratamientos" subtitle="Catálogo activo">
          <p className="text-3xl font-bold text-slate-900">
            {loading ? "..." : treatments.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Con duración automática.
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Agenda"
        subtitle="Vista semanal del consultorio"
        className="overflow-hidden"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-2">
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
          titleFormat={{
            year: "numeric",
            month: "short",
            day: "numeric",
          }}
          dayHeaderFormat={{
            weekday: "short",
            day: "numeric",
            month: "numeric",
          }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          expandRows
          height="auto"
          locale="es"
          selectable
          nowIndicator
          events={calendarEvents}
          eventContent={(eventInfo) => (
            <div className="space-y-0.5 overflow-hidden px-1 py-0.5">
              <p className="truncate text-xs font-bold">
                {eventInfo.timeText}
              </p>
              <p className="truncate text-xs">
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
          dateClick={(info) => {
            const clickedDate = info.date;
            const date = clickedDate.toISOString().slice(0, 10);
            const time = clickedDate.toTimeString().slice(0, 5);

            updateForm("date", date);

            if (time !== "00:00") {
              updateForm("time", time);
            }

            openNewAppointmentModal();
          }}
          eventClick={(info) => {
            const start = info.event.start;
            if (!start) return;

            const date = start.toISOString().slice(0, 10);
            const time = start.toTimeString().slice(0, 5);

            updateForm("date", date);
            updateForm("time", time);
          }}
        />
        </div>
      </SectionCard>

      <SectionCard title="Mis citas" subtitle="Últimas citas registradas">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando citas...</p>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              Todavía no hay citas registradas.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Crea una cita usando el botón superior.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 8).map((appointment) => (
              <article
                key={appointment.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {appointment.treatmentType || "Cita odontológica"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(appointment.scheduledAt)} ·{" "}
                    {formatHour(appointment.scheduledAt)} -{" "}
                    {formatHour(appointment.endsAt)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Dr(a). {appointment.dentistName} · Paciente:{" "}
                    {appointment.patientName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {appointment.durationMinutes} min
                  </span>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    {appointment.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Nueva cita
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  La duración se calcula automáticamente según el tratamiento.
                </p>
              </div>

              <button
                type="button"
                onClick={closeNewAppointmentModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                disabled={saving}
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreateAppointment}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Odontólogo
                </label>
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
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tratamiento
                </label>
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
              </div>

              {selectedTreatment && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                  <p className="text-sm font-semibold text-cyan-900">
                    {selectedTreatment.name}
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cyan-700">
                        Duración
                      </p>
                      <p className="font-semibold text-slate-900">
                        {selectedTreatment.defaultDurationMinutes} min
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-cyan-700">
                        Precio base
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatPrice(selectedTreatment.basePrice)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm("date", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => updateForm("time", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notas
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  rows={4}
                  placeholder="Ej. Paciente refiere sensibilidad dental..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  disabled={saving}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">
                    Resumen:
                  </span>{" "}
                  {selectedDentist
                    ? selectedDentist.fullName
                    : "Sin odontólogo"}{" "}
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
      )}
    </div>
  );
}
