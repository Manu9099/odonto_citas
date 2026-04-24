import {
  CalendarClock,
  CreditCard,
  Stethoscope,
  Users,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../../../lib/api/client";
import { PageHeader } from "../../../components/shared/page-header";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { StatusBadge } from "../../../components/shared/status-badge";

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
  cancelledReason?: string | null;
};

type CalendarDayResponse = {
  date: string;
  label: string;
  appointments: Appointment[];
};

type Dentist = {
  id: number;
  fullName?: string;
  name?: string;
  specialty?: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatHour(date?: string) {
  if (!date) return "--:--";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function normalizeStatus(status: AppointmentStatus) {
  const value = String(status).toUpperCase();

  if (value === "CONFIRMED") return "Confirmada";
  if (value === "PENDING") return "Pendiente";
  if (value === "PAID") return "Pagada";
  if (value === "COMPLETED") return "Completada";
  if (value === "CANCELLED") return "Cancelada";

  return status;
}

export function DashboardPage() {
  const today = todayIsoDate();

  const {
    data: calendarDay,
    isLoading: loadingCalendar,
    isError: calendarError,
  } = useQuery({
    queryKey: ["dashboard-calendar-day", today],
    queryFn: async () => {
      const response = await api.get<CalendarDayResponse>(
        `/appointments/calendar/day?date=${today}`
      );

      return response.data;
    },
  });

  const { data: myAppointments = [] } = useQuery({
    queryKey: ["dashboard-my-appointments"],
    queryFn: async () => {
      const response = await api.get<Appointment[]>("/appointments/me");
      return response.data;
    },
  });

  const { data: dentists = [] } = useQuery({
    queryKey: ["dashboard-dentists"],
    queryFn: async () => {
      const response = await api.get<Dentist[]>("/dentists");
      return response.data;
    },
  });

  const todayAppointments = calendarDay?.appointments ?? [];

  const dashboardStats = useMemo(() => {
    const pendingToday = todayAppointments.filter(
      (item) => String(item.status).toUpperCase() === "PENDING"
    ).length;

    const confirmedToday = todayAppointments.filter(
      (item) => String(item.status).toUpperCase() === "CONFIRMED"
    ).length;

    const completedToday = todayAppointments.filter(
      (item) => String(item.status).toUpperCase() === "COMPLETED"
    ).length;

    return {
      totalToday: todayAppointments.length,
      pendingToday,
      confirmedToday,
      completedToday,
      totalDentists: dentists.length,
      totalMyAppointments: myAppointments.length,
    };
  }, [todayAppointments, dentists.length, myAppointments.length]);

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Panel administrativo"
        title="Dashboard"
        description="Resumen general de citas, odontólogos y actividad del día conectado al backend."
      />

      {calendarError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo traer la agenda del backend. Revisa que el backend esté
          prendido en <strong>http://localhost:8080</strong> y que tengas token
          si el endpoint está protegido.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Citas hoy"
          value={loadingCalendar ? "..." : String(dashboardStats.totalToday)}
          hint={`${dashboardStats.pendingToday} pendientes`}
          icon={CalendarClock}
        />

        <StatCard
          label="Confirmadas"
          value={loadingCalendar ? "..." : String(dashboardStats.confirmedToday)}
          hint="Citas confirmadas para hoy"
          icon={CheckCircle2}
        />

        <StatCard
          label="Odontólogos"
          value={String(dashboardStats.totalDentists)}
          hint="Registrados en el sistema"
          icon={Stethoscope}
        />

        <StatCard
          label="Mis citas"
          value={String(dashboardStats.totalMyAppointments)}
          hint="Total relacionado a mi usuario"
          icon={Users}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <SectionCard
          title="Agenda de hoy"
          description={calendarDay?.label ?? `Citas programadas para ${today}`}
        >
          {loadingCalendar ? (
            <p className="text-sm text-slate-500">Cargando citas...</p>
          ) : todayAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-800">
                No hay citas para hoy
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cuando el backend devuelva citas, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">
                      {item.patientName}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {item.treatmentType || "Tratamiento no especificado"}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {item.dentistName}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                      <Clock className="size-4 text-slate-400" />
                      {formatHour(item.scheduledAt)}
                    </div>

                    <StatusBadge status={normalizeStatus(item.status)} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Actividad rápida"
          description="Indicadores calculados desde las citas reales"
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Pendientes
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-950">
                    {dashboardStats.pendingToday}
                  </p>
                </div>
                <AlertCircle className="size-8 text-blue-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Completadas hoy
                  </p>
                  <p className="mt-1 text-3xl font-bold text-emerald-950">
                    {dashboardStats.completedToday}
                  </p>
                </div>
                <CheckCircle2 className="size-8 text-emerald-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Pagos
                  </p>
                  <p className="mt-1 text-3xl font-bold text-amber-950">
                    API parcial
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Tu backend tiene pago por cita, pero todavía no lista todos
                    los pagos.
                  </p>
                </div>
                <Wallet className="size-8 text-amber-400" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Odontólogos registrados"
        description="Datos cargados desde /api/dentists"
      >
        {dentists.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay odontólogos cargados todavía.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-950">
                    Odontólogo
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-950">
                    Especialidad
                  </th>
                </tr>
              </thead>

              <tbody>
                {dentists.map((dentist) => (
                  <tr
                    key={dentist.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {dentist.fullName ?? dentist.name ?? "Sin nombre"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dentist.specialty ?? "No registrada"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}