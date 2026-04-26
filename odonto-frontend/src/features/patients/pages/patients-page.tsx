import {
  Activity,
  CalendarClock,
  ChevronRight,
  Clock,
  FileText,
  Mail,
  Phone,
  Pill,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  Download,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "../../../components/shared/page-header";
import { api } from "../../../lib/api/client";
import { cn } from "../../../lib/utils/cn";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

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
  treatmentId?: number | null;
  treatmentType?: string | null;
  amountDue?: number | string | null;
  notes?: string | null;
  cancelledReason?: string | null;
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
  confirmedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  dentists: string[];
  treatments: string[];
};

type PrescriptionItemResponse = {
  id: number;
  medicationName: string;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
};

type PrescriptionResponse = {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  dentistId: number;
  dentistName: string;
  diagnosis: string | null;
  indications: string;
  notes: string | null;
  nextControlDate: string | null;
  items: PrescriptionItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type PrescriptionItemForm = {
  medicationName: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type PrescriptionForm = {
  appointmentId: number | null;
  diagnosis: string;
  indications: string;
  nextControlDate: string;
  notes: string;
  items: PrescriptionItemForm[];
};

const emptyPrescriptionItem: PrescriptionItemForm = {
  medicationName: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const initialPrescriptionForm: PrescriptionForm = {
  appointmentId: null,
  diagnosis: "",
  indications: "",
  nextControlDate: "",
  notes: "",
  items: [{ ...emptyPrescriptionItem }],
};

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00-05:00`));
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
  if (value === "COMPLETED") return "Completada";
  if (value === "CANCELLED") return "Cancelada";
  if (value === "NO_SHOW") return "No asistió";

  return status || "Sin estado";
}

function statusClass(status?: AppointmentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "CONFIRMED") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (value === "PENDING") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (value === "COMPLETED") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (value === "CANCELLED") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (value === "NO_SHOW") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-slate-100 bg-slate-50 text-slate-600";
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

function buildPatientsFromAppointments(appointments: Appointment[]) {
  const now = new Date();
  const patientMap = new Map<number, Appointment[]>();

  appointments.forEach((appointment) => {
    const current = patientMap.get(appointment.patientId) ?? [];
    current.push(appointment);
    patientMap.set(appointment.patientId, current);
  });

  return Array.from(patientMap.entries()).map(
    ([patientId, patientAppointments]) => {
      const sorted = [...patientAppointments].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime()
      );

      const futureAppointments = sorted.filter(
        (appointment) =>
          new Date(appointment.scheduledAt) >= now &&
          appointment.status !== "CANCELLED"
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
        (appointment) => appointment.status === "COMPLETED"
      ).length;

      const pendingAppointments = sorted.filter(
        (appointment) => appointment.status === "PENDING"
      ).length;

      const confirmedAppointments = sorted.filter(
        (appointment) => appointment.status === "CONFIRMED"
      ).length;

      const cancelledAppointments = sorted.filter(
        (appointment) => appointment.status === "CANCELLED"
      ).length;

      const noShowAppointments = sorted.filter(
        (appointment) => appointment.status === "NO_SHOW"
      ).length;

      return {
        id: patientId,
        fullName: firstAppointment.patientName,
        totalAppointments: sorted.length,
        nextAppointment: futureAppointments[0],
        lastAppointment:
          pastAppointments[pastAppointments.length - 1] ??
          sorted[sorted.length - 1],
        completedAppointments,
        pendingAppointments,
        confirmedAppointments,
        cancelledAppointments,
        noShowAppointments,
        dentists,
        treatments,
      } satisfies PatientSummary;
    }
  );
}

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  );

  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<
    number | null
  >(null);

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [viewingPrescription, setViewingPrescription] =
    useState<PrescriptionResponse | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>(
    initialPrescriptionForm
  );
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: appointments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Appointment[]>({
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

  const {
    data: patientPrescriptions = [],
    isLoading: loadingPrescriptions,
    refetch: refetchPatientPrescriptions,
  } = useQuery<PrescriptionResponse[]>({
    queryKey: ["patient-prescriptions", selectedPatient?.id],
    enabled: Boolean(selectedPatient?.id),
    queryFn: async () => {
      const response = await api.get<PrescriptionResponse[]>(
        `/prescriptions/patient/${selectedPatient?.id}`
      );
      return response.data;
    },
  });

  const prescriptionByAppointmentId = useMemo(() => {
    return new Map(
      patientPrescriptions.map((prescription) => [
        prescription.appointmentId,
        prescription,
      ])
    );
  }, [patientPrescriptions]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatient) return [];

    return appointments
      .filter((appointment) => appointment.patientId === selectedPatient.id)
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() -
          new Date(a.scheduledAt).getTime()
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

  async function handleUpdateAppointmentStatus(
    appointmentId: number,
    nextStatus: AppointmentStatus
  ) {
    try {
      setError("");
      setSuccessMessage("");

      let cancelledReason: string | undefined;

      if (nextStatus === "CANCELLED") {
        const reason = window.prompt("Motivo de cancelación:");

        if (!reason || !reason.trim()) {
          setError("Para cancelar una cita debes indicar un motivo.");
          return;
        }

        cancelledReason = reason.trim();
      }

      setUpdatingAppointmentId(appointmentId);

      await api.patch(`/appointments/${appointmentId}/status`, {
        status: nextStatus,
        cancelledReason,
      });

      await refetch();

      setSuccessMessage("Estado de cita actualizado correctamente.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setUpdatingAppointmentId(null);
    }
  }

  function openCreatePrescriptionModal(appointment: Appointment) {
    setError("");
    setSuccessMessage("");

    setPrescriptionForm({
      ...initialPrescriptionForm,
      appointmentId: appointment.id,
    });

    setIsPrescriptionModalOpen(true);
  }

  function closeCreatePrescriptionModal() {
    if (savingPrescription) return;

    setIsPrescriptionModalOpen(false);
    setPrescriptionForm(initialPrescriptionForm);
  }

  function updatePrescriptionField<K extends keyof PrescriptionForm>(
    key: K,
    value: PrescriptionForm[K]
  ) {
    setPrescriptionForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function updatePrescriptionItem(
    index: number,
    key: keyof PrescriptionItemForm,
    value: string
  ) {
    setPrescriptionForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }));

    setError("");
    setSuccessMessage("");
  }

  function addPrescriptionItem() {
    setPrescriptionForm((current) => ({
      ...current,
      items: [...current.items, { ...emptyPrescriptionItem }],
    }));
  }

  function removePrescriptionItem(index: number) {
    setPrescriptionForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [{ ...emptyPrescriptionItem }]
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleCreatePrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prescriptionForm.appointmentId) {
      setError("No se encontró la cita para crear la receta.");
      return;
    }

    if (!prescriptionForm.indications.trim()) {
      setError("Las indicaciones son obligatorias.");
      return;
    }

    const items = prescriptionForm.items
      .map((item) => ({
        medicationName: item.medicationName.trim(),
        dose: item.dose.trim() || undefined,
        frequency: item.frequency.trim() || undefined,
        duration: item.duration.trim() || undefined,
        instructions: item.instructions.trim() || undefined,
      }))
      .filter((item) => item.medicationName.length > 0);

    try {
      setSavingPrescription(true);
      setError("");
      setSuccessMessage("");

      await api.post<PrescriptionResponse>("/prescriptions", {
        appointmentId: prescriptionForm.appointmentId,
        diagnosis: prescriptionForm.diagnosis.trim() || undefined,
        indications: prescriptionForm.indications.trim(),
        nextControlDate: prescriptionForm.nextControlDate || undefined,
        notes: prescriptionForm.notes.trim() || undefined,
        items,
      });

      await refetchPatientPrescriptions();

      setIsPrescriptionModalOpen(false);
      setPrescriptionForm(initialPrescriptionForm);
      setSuccessMessage("Receta registrada correctamente.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSavingPrescription(false);
    }
  }
  async function downloadPrescriptionPdf(prescription: PrescriptionResponse) {
    try {
      setError("");
      setSuccessMessage("");

      const response = await api.get<Blob>(
        `/prescriptions/${prescription.id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `receta-${prescription.id}-${prescription.patientName}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description="Consulta el historial de atención, estado de citas y recetas."
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Users className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : stats.totalPatients}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Registrados desde citas
          </p>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-cyan-50 p-3 text-cyan-600">
              <CalendarClock className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Citas
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : stats.totalAppointments}
          </p>

          <p className="mt-1 text-sm text-slate-500">Historial general</p>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Clock className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Próximas
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : stats.withNextAppointment}
          </p>

          <p className="mt-1 text-sm text-slate-500">Agenda futura</p>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pendientes
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : stats.pendingAppointments}
          </p>

          <p className="mt-1 text-sm text-slate-500">Citas por confirmar</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Directorio de pacientes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Busca por nombre, odontólogo o tratamiento.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar paciente..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {isError && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              No se pudieron cargar los pacientes. Revisa que el token esté
              activo y que el backend esté corriendo.
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Lista de pacientes
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {filteredPatients.length} resultado
              {filteredPatients.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Cargando pacientes...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center">
                <UserRound className="mx-auto h-8 w-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-700">
                  No hay pacientes para mostrar
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Cuando existan citas, los pacientes aparecerán aquí.
                </p>
              </div>
            ) : (
              filteredPatients.map((patient) => {
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
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {getInitials(patient.fullName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {patient.fullName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {patient.totalAppointments} cita
                          {patient.totalAppointments === 1 ? "" : "s"}
                        </p>
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition",
                          isSelected
                            ? "text-blue-600"
                            : "text-slate-300 group-hover:text-blue-500"
                        )}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {patient.nextAppointment && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          Próxima:{" "}
                          {formatDate(patient.nextAppointment.scheduledAt)}
                        </span>
                      )}

                      {patient.pendingAppointments > 0 && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {patient.pendingAppointments} pendiente
                          {patient.pendingAppointments === 1 ? "" : "s"}
                        </span>
                      )}

                      {patient.completedAppointments > 0 && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {patient.completedAppointments} completada
                          {patient.completedAppointments === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          {!selectedPatient ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-200">
              <div className="text-center">
                <UserRound className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-700">
                  Selecciona un paciente
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Verás su detalle, historial de citas y recetas.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-lg font-bold text-white">
                    {getInitials(selectedPatient.fullName)}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Paciente #{selectedPatient.id}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {selectedPatient.fullName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedPatient.totalAppointments} cita
                      {selectedPatient.totalAppointments === 1 ? "" : "s"} en
                      el sistema
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    Teléfono
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedPatient.phone ?? "No registrado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Correo
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedPatient.email ?? "No registrado"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Confirmadas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {selectedPatient.confirmedAppointments}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pendientes
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    {selectedPatient.pendingAppointments}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Completadas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {selectedPatient.completedAppointments}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Canceladas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {selectedPatient.cancelledAppointments}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Recetas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-cyan-600">
                    {loadingPrescriptions ? "..." : patientPrescriptions.length}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Tratamientos
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPatient.treatments.length === 0 ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Sin tratamientos registrados
                    </span>
                  ) : (
                    selectedPatient.treatments.map((treatment) => (
                      <span
                        key={treatment}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        {treatment}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-900">
                  Historial de citas
                </h3>

                <div className="mt-3 space-y-3">
                  {selectedPatientAppointments.map((appointment) => {
                    const prescription = prescriptionByAppointmentId.get(
                      appointment.id
                    );

                    return (
                      <article
                        key={appointment.id}
                        className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {appointment.treatmentType ||
                                "Tratamiento no especificado"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {appointment.dentistName ??
                                "Odontólogo no registrado"}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  statusClass(appointment.status)
                                )}
                              >
                                {normalizeStatus(appointment.status)}
                              </span>

                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {formatDate(appointment.scheduledAt)} ·{" "}
                                {formatHour(appointment.scheduledAt)}
                              </span>

                              {appointment.durationMinutes && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                  {appointment.durationMinutes} min
                                </span>
                              )}

                              {prescription && (
                                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                  Con receta
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex w-full flex-col gap-2 md:w-56">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-500">
                                Cambiar estado
                              </label>

                              <select
                                value={appointment.status}
                                disabled={
                                  updatingAppointmentId === appointment.id
                                }
                                onChange={(event) =>
                                  handleUpdateAppointmentStatus(
                                    appointment.id,
                                    event.target.value as AppointmentStatus
                                  )
                                }
                                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="PENDING">Pendiente</option>
                                <option value="CONFIRMED">Confirmada</option>
                                <option value="COMPLETED">Completada</option>
                                <option value="NO_SHOW">No asistió</option>
                                <option value="CANCELLED">Cancelada</option>
                              </select>
                            </div>

                            {appointment.status === "COMPLETED" &&
                              !prescription && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCreatePrescriptionModal(appointment)
                                  }
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                >
                                  <Plus className="h-4 w-4" />
                                  Crear receta
                                </button>
                              )}

                            {prescription && (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingPrescription(prescription)
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 px-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                              >
                                <FileText className="h-4 w-4" />
                                Ver receta
                              </button>
                            )}
                          </div>
                        </div>

                        {appointment.notes && (
                          <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-slate-500">
                            {appointment.notes}
                          </p>
                        )}

                        {appointment.cancelledReason && (
                          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">
                            Motivo de cancelación:{" "}
                            {appointment.cancelledReason}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {isPrescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Nueva receta
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registra diagnóstico, indicaciones y medicamentos de la
                  atención.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreatePrescriptionModal}
                disabled={savingPrescription}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreatePrescription}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Diagnóstico
                </label>
                <input
                  value={prescriptionForm.diagnosis}
                  onChange={(event) =>
                    updatePrescriptionField("diagnosis", event.target.value)
                  }
                  placeholder="Ej. Gingivitis leve asociada a placa bacteriana"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  disabled={savingPrescription}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Indicaciones principales
                </label>
                <textarea
                  value={prescriptionForm.indications}
                  onChange={(event) =>
                    updatePrescriptionField("indications", event.target.value)
                  }
                  rows={4}
                  placeholder="Ej. Mantener higiene oral estricta, cepillado después de cada comida..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  disabled={savingPrescription}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Próximo control
                  </label>
                  <input
                    type="date"
                    value={prescriptionForm.nextControlDate}
                    onChange={(event) =>
                      updatePrescriptionField(
                        "nextControlDate",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={savingPrescription}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Notas internas
                  </label>
                  <input
                    value={prescriptionForm.notes}
                    onChange={(event) =>
                      updatePrescriptionField("notes", event.target.value)
                    }
                    placeholder="Ej. Paciente refiere dolor leve"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    disabled={savingPrescription}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Medicamentos
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Puedes dejar esta sección vacía si solo deseas registrar
                      indicaciones.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addPrescriptionItem}
                    disabled={savingPrescription}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-3 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>

                <div className="space-y-3">
                  {prescriptionForm.items.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-800">
                          Medicamento #{index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removePrescriptionItem(index)}
                          disabled={savingPrescription}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Eliminar medicamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={item.medicationName}
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "medicationName",
                              event.target.value
                            )
                          }
                          placeholder="Medicamento. Ej. Ibuprofeno 400 mg"
                          className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                          disabled={savingPrescription}
                        />

                        <input
                          value={item.dose}
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "dose",
                              event.target.value
                            )
                          }
                          placeholder="Dosis. Ej. 1 tableta"
                          className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                          disabled={savingPrescription}
                        />

                        <input
                          value={item.frequency}
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "frequency",
                              event.target.value
                            )
                          }
                          placeholder="Frecuencia. Ej. Cada 8 horas"
                          className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                          disabled={savingPrescription}
                        />

                        <input
                          value={item.duration}
                          onChange={(event) =>
                            updatePrescriptionItem(
                              index,
                              "duration",
                              event.target.value
                            )
                          }
                          placeholder="Duración. Ej. 3 días"
                          className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                          disabled={savingPrescription}
                        />
                      </div>

                      <textarea
                        value={item.instructions}
                        onChange={(event) =>
                          updatePrescriptionItem(
                            index,
                            "instructions",
                            event.target.value
                          )
                        }
                        rows={2}
                        placeholder="Instrucciones. Ej. Tomar después de alimentos si presenta dolor."
                        className="mt-3 w-full resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        disabled={savingPrescription}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreatePrescriptionModal}
                  disabled={savingPrescription}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingPrescription}
                  className="h-11 rounded-2xl bg-cyan-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPrescription ? "Guardando receta..." : "Guardar receta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                  Receta odontológica #{viewingPrescription.id}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {viewingPrescription.patientName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Dr(a). {viewingPrescription.dentistName} ·{" "}
                  {formatDate(viewingPrescription.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingPrescription(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Diagnóstico
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {viewingPrescription.diagnosis || "No registrado"}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Indicaciones
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {viewingPrescription.indications}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-cyan-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Medicamentos
                  </h3>
                </div>

                {viewingPrescription.items.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No se registraron medicamentos.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {viewingPrescription.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <p className="text-sm font-bold text-slate-900">
                          {item.medicationName}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.dose && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Dosis: {item.dose}
                            </span>
                          )}

                          {item.frequency && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {item.frequency}
                            </span>
                          )}

                          {item.duration && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {item.duration}
                            </span>
                          )}
                        </div>

                        {item.instructions && (
                          <p className="mt-3 text-sm text-slate-500">
                            {item.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="grid gap-3 md:grid-cols-2">
                <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Próximo control
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(viewingPrescription.nextControlDate)}
                  </p>
                </section>

                <section className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Notas internas
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {viewingPrescription.notes || "Sin notas"}
                  </p>
                </section>
              </div>
            </div>

               <div className="mt-6 flex justify-end">
                 <button
                   type="button"
                   onClick={() => setViewingPrescription(null)}
                   className="h-11 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                 >
                   Cerrar
                 </button>
               </div>
          </div>
        </div>
      )}
    </div>
  );
}