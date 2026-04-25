import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../../lib/api/client";
import { PageHeader } from "../../../components/shared/page-header";
import { cn } from "../../../lib/utils/cn";

type Dentist = {
  id: number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  active?: boolean;
};

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "PAID"
  | string;

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
  treatmentType: string;
  notes?: string | null;
};

type CalendarDayResponse = {
  date: string;
  label: string;
  appointments: Appointment[];
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatHour(value?: string) {
  if (!value) return "--:--";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDentistName(dentist: Dentist) {
  return dentist.fullName ?? dentist.name ?? `Odontólogo ${dentist.id}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
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

function statusClass(status?: AppointmentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "CONFIRMED") return "border-blue-100 bg-blue-50 text-blue-700";
  if (value === "PENDING") return "border-amber-100 bg-amber-50 text-amber-700";
  if (value === "COMPLETED")
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (value === "CANCELLED") return "border-red-100 bg-red-50 text-red-700";

  return "border-slate-100 bg-slate-50 text-slate-600";
}

export function DentistsPage() {
  const [search, setSearch] = useState("");
  const [selectedDentistId, setSelectedDentistId] = useState<number | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());

  const {
    data: dentists = [],
    isLoading: loadingDentists,
    isError: dentistsError,
  } = useQuery({
    queryKey: ["dentists-page-list"],
    queryFn: async () => {
      const response = await api.get<Dentist[]>("/dentists");
      return response.data;
    },
  });

  const {
    data: calendarDay,
    isLoading: loadingAppointments,
    isError: appointmentsError,
  } = useQuery({
    queryKey: ["dentists-page-calendar", selectedDate],
    queryFn: async () => {
      const response = await api.get<CalendarDayResponse>(
        `/appointments/calendar/day?date=${selectedDate}`
      );

      return response.data;
    },
  });

  const appointments = calendarDay?.appointments ?? [];

  const filteredDentists = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return dentists;

    return dentists.filter((dentist) => {
      const name = getDentistName(dentist).toLowerCase();
      const specialty = dentist.specialty?.toLowerCase() ?? "";
      const email = dentist.email?.toLowerCase() ?? "";
      const phone = dentist.phone?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        specialty.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [dentists, search]);

  const selectedDentist =
    filteredDentists.find((dentist) => dentist.id === selectedDentistId) ??
    filteredDentists[0];

  const appointmentsByDentist = useMemo(() => {
    const map = new Map<number, Appointment[]>();

    appointments.forEach((appointment) => {
      const current = map.get(appointment.dentistId) ?? [];
      current.push(appointment);
      map.set(appointment.dentistId, current);
    });

    return map;
  }, [appointments]);

  const selectedDentistAppointments = useMemo(() => {
    if (!selectedDentist) return [];

    return [...(appointmentsByDentist.get(selectedDentist.id) ?? [])].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [appointmentsByDentist, selectedDentist]);

  const stats = useMemo(() => {
    const activeDentists = dentists.filter(
      (dentist) => dentist.active !== false
    ).length;

    const busyDentists = new Set(appointments.map((item) => item.dentistId))
      .size;

    const confirmedToday = appointments.filter(
      (appointment) =>
        String(appointment.status).toUpperCase() === "CONFIRMED"
    ).length;

    const pendingToday = appointments.filter(
      (appointment) => String(appointment.status).toUpperCase() === "PENDING"
    ).length;

    return {
      totalDentists: dentists.length,
      activeDentists,
      busyDentists,
      confirmedToday,
      pendingToday,
      totalAppointmentsToday: appointments.length,
    };
  }, [dentists, appointments]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Equipo clínico"
        title="Odontólogos"
        description="Consulta odontólogos registrados, especialidades y agenda diaria."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Odontólogos</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingDentists ? "..." : stats.totalDentists}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Registrados en el sistema
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Activos</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingDentists ? "..." : stats.activeDentists}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Disponibles para atención
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Con citas hoy
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingAppointments ? "..." : stats.busyDentists}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Odontólogos con agenda
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Activity className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Citas hoy</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingAppointments ? "..." : stats.totalAppointmentsToday}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {stats.pendingToday} pendientes
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <CalendarClock className="size-6" />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Directorio clínico
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Busca por nombre, especialidad, correo o teléfono.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar odontólogo..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          Agenda consultada:{" "}
          <span className="font-black capitalize text-slate-950">
            {formatDate(selectedDate)}
          </span>
        </div>
      </section>

      {(dentistsError || appointmentsError) && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          No se pudo cargar toda la información. Revisa que el token esté activo
          y que el backend esté corriendo.
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-black text-slate-950">
              Lista de odontólogos
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredDentists.length} resultado
              {filteredDentists.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="max-h-[680px] overflow-y-auto p-3">
            {loadingDentists ? (
              <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-500">
                Cargando odontólogos...
              </div>
            ) : filteredDentists.length === 0 ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                    <Stethoscope className="size-7" />
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-950">
                    No hay odontólogos para mostrar
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Cuando el backend devuelva odontólogos, aparecerán aquí.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDentists.map((dentist) => {
                  const name = getDentistName(dentist);
                  const initials = getInitials(name);
                  const isSelected = selectedDentist?.id === dentist.id;
                  const dentistAppointments =
                    appointmentsByDentist.get(dentist.id) ?? [];

                  return (
                    <button
                      key={dentist.id}
                      type="button"
                      onClick={() => setSelectedDentistId(dentist.id)}
                      className={cn(
                        "group w-full rounded-3xl border p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50",
                        isSelected
                          ? "border-blue-200 bg-blue-50"
                          : "border-transparent bg-white"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-black",
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                          )}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">
                                {name}
                              </p>

                              <p className="mt-1 truncate text-sm font-medium text-slate-500">
                                {dentist.specialty ??
                                  "Especialidad no registrada"}
                              </p>
                            </div>

                            <span
                              className={cn(
                                "shrink-0 rounded-full px-3 py-1 text-xs font-black",
                                dentist.active === false
                                  ? "bg-red-50 text-red-600"
                                  : "bg-emerald-50 text-emerald-600"
                              )}
                            >
                              {dentist.active === false ? "Inactivo" : "Activo"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              {dentistAppointments.length} cita
                              {dentistAppointments.length === 1 ? "" : "s"} hoy
                            </span>

                            {dentist.email && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {dentist.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          {!selectedDentist ? (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-slate-100 text-slate-500">
                  <Stethoscope className="size-8" />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  Selecciona un odontólogo
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Verás su información y agenda diaria.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-black text-white shadow-lg shadow-cyan-500/20">
                    {getInitials(getDentistName(selectedDentist))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                      Odontólogo #{selectedDentist.id}
                    </p>

                    <h3 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">
                      {getDentistName(selectedDentist)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDentist.specialty ??
                        "Especialidad no registrada"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                      <Phone className="size-4" />
                      Teléfono
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {selectedDentist.phone ?? "No registrado"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                      <Mail className="size-4" />
                      Correo
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {selectedDentist.email ?? "No registrado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Citas hoy
                    </p>
                    <p className="mt-1 text-2xl font-black text-blue-600">
                      {selectedDentistAppointments.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Confirmadas
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-600">
                      {
                        selectedDentistAppointments.filter(
                          (appointment) =>
                            String(appointment.status).toUpperCase() ===
                            "CONFIRMED"
                        ).length
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Pendientes
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-600">
                      {
                        selectedDentistAppointments.filter(
                          (appointment) =>
                            String(appointment.status).toUpperCase() ===
                            "PENDING"
                        ).length
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-950">
                    Agenda del día
                  </h4>

                  <p className="mt-1 text-sm text-slate-500 capitalize">
                    {formatDate(selectedDate)}
                  </p>

                  <div className="mt-3 space-y-3">
                    {loadingAppointments ? (
                      <div className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-500">
                        Cargando citas...
                      </div>
                    ) : selectedDentistAppointments.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-500">
                          <Clock className="size-6" />
                        </div>

                        <p className="mt-3 font-black text-slate-900">
                          Sin citas para este día
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Cambia la fecha para consultar otra agenda.
                        </p>
                      </div>
                    ) : (
                      selectedDentistAppointments.map((appointment) => (
                        <article
                          key={appointment.id}
                          className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-black text-slate-950">
                                {appointment.patientName}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {appointment.treatmentType ||
                                  "Tratamiento no especificado"}
                              </p>
                            </div>

                            <span
                              className={cn(
                                "w-fit rounded-full border px-3 py-1 text-xs font-black",
                                statusClass(appointment.status)
                              )}
                            >
                              {normalizeStatus(appointment.status)}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {formatHour(appointment.scheduledAt)}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {appointment.durationMinutes} min
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Paciente #{appointment.patientId}
                            </span>
                          </div>

                          {appointment.notes && (
                            <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
                              {appointment.notes}
                            </p>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}