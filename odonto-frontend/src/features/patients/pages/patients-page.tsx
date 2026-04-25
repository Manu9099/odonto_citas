import {
  CalendarClock,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  Activity,
  Clock,
  ChevronRight,
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

type PatientSummary = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  totalAppointments: number;
  nextAppointment?: Appointment;
  lastAppointment?: Appointment;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  dentists: string[];
  treatments: string[];
};

function formatDate(value?: string) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function statusClass(status?: AppointmentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "CONFIRMED") return "bg-blue-50 text-blue-700 border-blue-100";
  if (value === "PENDING") return "bg-amber-50 text-amber-700 border-amber-100";
  if (value === "COMPLETED")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (value === "CANCELLED") return "bg-red-50 text-red-700 border-red-100";

  return "bg-slate-50 text-slate-600 border-slate-100";
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

function buildPatientsFromAppointments(appointments: Appointment[]) {
  const now = new Date();
  const patientMap = new Map<number, Appointment[]>();

  appointments.forEach((appointment) => {
    const current = patientMap.get(appointment.patientId) ?? [];
    current.push(appointment);
    patientMap.set(appointment.patientId, current);
  });

  return Array.from(patientMap.entries()).map(([patientId, patientAppointments]) => {
    const sorted = [...patientAppointments].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    const futureAppointments = sorted.filter(
      (appointment) => new Date(appointment.scheduledAt) >= now
    );

    const pastAppointments = sorted.filter(
      (appointment) => new Date(appointment.scheduledAt) < now
    );

    const firstAppointment = sorted[0];

    const dentists = Array.from(
      new Set(
        sorted
          .map((appointment) => appointment.dentistName)
          .filter(Boolean) as string[]
      )
    );

    const treatments = Array.from(
      new Set(
        sorted
          .map((appointment) => appointment.treatmentType)
          .filter(Boolean) as string[]
      )
    );

    const completedAppointments = sorted.filter(
      (appointment) => String(appointment.status).toUpperCase() === "COMPLETED"
    ).length;

    const pendingAppointments = sorted.filter(
      (appointment) => String(appointment.status).toUpperCase() === "PENDING"
    ).length;

    const cancelledAppointments = sorted.filter(
      (appointment) => String(appointment.status).toUpperCase() === "CANCELLED"
    ).length;

    return {
      id: patientId,
      fullName: firstAppointment.patientName,
      totalAppointments: sorted.length,
      nextAppointment: futureAppointments[0],
      lastAppointment: pastAppointments[pastAppointments.length - 1] ?? sorted[sorted.length - 1],
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      dentists,
      treatments,
    } satisfies PatientSummary;
  });
}

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const {
    data: appointments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["patients-from-appointments"],
    queryFn: async () => {
      const response = await api.get<Appointment[]>("/appointments/me");
      return response.data;
    },
  });

  const patients = useMemo(
    () => buildPatientsFromAppointments(appointments),
    [appointments]
  );

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) => {
      const nameMatch = patient.fullName.toLowerCase().includes(query);
      const dentistMatch = patient.dentists.some((dentist) =>
        dentist.toLowerCase().includes(query)
      );
      const treatmentMatch = patient.treatments.some((treatment) =>
        treatment.toLowerCase().includes(query)
      );

      return nameMatch || dentistMatch || treatmentMatch;
    });
  }, [patients, search]);

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ??
    filteredPatients[0];

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatient) return [];

    return appointments
      .filter((appointment) => appointment.patientId === selectedPatient.id)
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );
  }, [appointments, selectedPatient]);

  const stats = useMemo(() => {
    const totalAppointments = patients.reduce(
      (acc, patient) => acc + patient.totalAppointments,
      0
    );

    const withNextAppointment = patients.filter(
      (patient) => patient.nextAppointment
    ).length;

    const pendingAppointments = patients.reduce(
      (acc, patient) => acc + patient.pendingAppointments,
      0
    );

    return {
      totalPatients: patients.length,
      totalAppointments,
      withNextAppointment,
      pendingAppointments,
    };
  }, [patients]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Gestión de pacientes"
        title="Pacientes"
        description="Consulta pacientes vinculados a las citas registradas en el sistema."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Pacientes
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.totalPatients}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Registrados desde citas
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
              <p className="text-sm font-bold text-slate-500">
                Citas totales
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.totalAppointments}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Historial general
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
              <CalendarClock className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Con próxima cita
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.withNextAppointment}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Agenda futura
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Activity className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Pendientes
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {isLoading ? "..." : stats.pendingAppointments}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Citas por confirmar
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="size-6" />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Directorio de pacientes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Busca por nombre, odontólogo o tratamiento.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar paciente..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          No se pudieron cargar los pacientes. Revisa que el token esté activo y
          que el backend esté corriendo.
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-black text-slate-950">
              Lista de pacientes
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredPatients.length} resultado
              {filteredPatients.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="max-h-[680px] overflow-y-auto p-3">
            {isLoading ? (
              <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-500">
                Cargando pacientes...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                    <UserRound className="size-7" />
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-950">
                    No hay pacientes para mostrar
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Cuando existan citas, los pacientes aparecerán aquí.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPatients.map((patient) => {
                  const isSelected = selectedPatient?.id === patient.id;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(patient.id)}
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
                          {getInitials(patient.fullName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-black text-slate-950">
                              {patient.fullName}
                            </p>

                            <ChevronRight
                              className={cn(
                                "size-5 shrink-0 transition",
                                isSelected
                                  ? "text-blue-600"
                                  : "text-slate-300 group-hover:text-blue-500"
                              )}
                            />
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              {patient.totalAppointments} cita
                              {patient.totalAppointments === 1 ? "" : "s"}
                            </span>

                            {patient.nextAppointment && (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                Próxima:{" "}
                                {formatDate(patient.nextAppointment.scheduledAt)}
                              </span>
                            )}

                            {patient.pendingAppointments > 0 && (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                {patient.pendingAppointments} pendiente
                                {patient.pendingAppointments === 1 ? "" : "s"}
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
          {!selectedPatient ? (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-slate-100 text-slate-500">
                  <UserRound className="size-8" />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  Selecciona un paciente
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Verás su detalle e historial de citas.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-black text-white shadow-lg shadow-cyan-500/20">
                    {getInitials(selectedPatient.fullName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                      Paciente #{selectedPatient.id}
                    </p>

                    <h3 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">
                      {selectedPatient.fullName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedPatient.totalAppointments} cita
                      {selectedPatient.totalAppointments === 1 ? "" : "s"} en el
                      sistema
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
                      {selectedPatient.phone ?? "No registrado"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                      <Mail className="size-4" />
                      Correo
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {selectedPatient.email ?? "No registrado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Completadas
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-600">
                      {selectedPatient.completedAppointments}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Pendientes
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-600">
                      {selectedPatient.pendingAppointments}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Canceladas
                    </p>
                    <p className="mt-1 text-2xl font-black text-red-600">
                      {selectedPatient.cancelledAppointments}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-950">
                    Tratamientos
                  </h4>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPatient.treatments.length === 0 ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Sin tratamientos registrados
                      </span>
                    ) : (
                      selectedPatient.treatments.map((treatment) => (
                        <span
                          key={treatment}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                        >
                          {treatment}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-950">
                    Historial de citas
                  </h4>

                  <div className="mt-3 space-y-3">
                    {selectedPatientAppointments.map((appointment) => (
                      <article
                        key={appointment.id}
                        className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black text-slate-950">
                              {appointment.treatmentType ||
                                "Tratamiento no especificado"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {appointment.dentistName ??
                                "Odontólogo no registrado"}
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
                            {formatDate(appointment.scheduledAt)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {formatHour(appointment.scheduledAt)}
                          </span>
                        </div>

                        {appointment.notes && (
                          <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
                            {appointment.notes}
                          </p>
                        )}
                      </article>
                    ))}
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