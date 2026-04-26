import {
  Activity,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  WalletCards,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../../../lib/api/client";

type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

type PaymentStatusSummary = {
  status: PaymentStatus;
  count: number;
  amount: number;
};

type DashboardDayRevenue = {
  date: string;
  amount: number;
};

type DashboardSummary = {
  todayAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  paidAppointments: number;
  unpaidAppointments: number;
  pendingPayments: number;
  approvedRevenue: number;
  pendingRevenue: number;
  paymentsByStatus: PaymentStatusSummary[];
  revenueByDay: DashboardDayRevenue[];
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(value ?? 0));
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00-05:00`));
}

function statusLabel(status: PaymentStatus) {
  if (status === "APPROVED") return "Pagados";
  if (status === "PENDING") return "Pendientes";
  if (status === "REJECTED") return "Rechazados";
  if (status === "REFUNDED") return "Devueltos";
  return status;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-2xl bg-cyan-50 p-3 text-cyan-600">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Resumen
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </article>
  );
}

export function DashboardPage() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get<DashboardSummary>("/dashboard/summary");
      return response.data;
    },
  });

  const revenueByDay =
    data?.revenueByDay.map((item) => ({
      ...item,
      label: formatDateLabel(item.date),
      amount: Number(item.amount ?? 0),
    })) ?? [];

  const approvedPayments =
    data?.paymentsByStatus.find((item) => item.status === "APPROVED") ?? null;

  const pendingPayments =
    data?.paymentsByStatus.find((item) => item.status === "PENDING") ?? null;

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        No se pudo cargar el dashboard. Revisa que el backend esté corriendo y
        que tu sesión esté activa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">
            Panel principal
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Resumen de citas, pagos e ingresos de la clínica.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Ingresos aprobados:{" "}
          <span className="font-bold text-emerald-600">
            {isLoading ? "..." : formatMoney(data?.approvedRevenue)}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Citas de hoy"
          value={isLoading ? "..." : data?.todayAppointments ?? 0}
          subtitle="Programadas para la fecha actual"
          icon={<CalendarClock className="h-5 w-5" />}
        />

        <StatCard
          title="Citas confirmadas"
          value={isLoading ? "..." : data?.confirmedAppointments ?? 0}
          subtitle="Pacientes con atención confirmada"
          icon={<CalendarCheck className="h-5 w-5" />}
        />

        <StatCard
          title="Citas pendientes"
          value={isLoading ? "..." : data?.pendingAppointments ?? 0}
          subtitle="Aún requieren confirmación"
          icon={<Clock className="h-5 w-5" />}
        />

        <StatCard
          title="Citas completadas"
          value={isLoading ? "..." : data?.completedAppointments ?? 0}
          subtitle="Atenciones finalizadas"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <WalletCards className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pagos
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : data?.paidAppointments ?? 0}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Citas pagadas
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Con pago aprobado registrado.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <CreditCard className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pendiente
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : data?.unpaidAppointments ?? 0}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Citas sin pago aprobado
          </p>
          <p className="mt-1 text-sm text-slate-500">
            No incluye citas canceladas.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ingresos
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {isLoading ? "..." : formatMoney(data?.approvedRevenue)}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Cobrado
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Pagos aprobados acumulados.
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ingresos de los últimos 7 días
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Suma de pagos aprobados por día.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {formatMoney(data?.approvedRevenue)}
            </span>
          </div>

          <div className="h-72">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Cargando gráfico...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    labelFormatter={(label) => `Día: ${label}`}
                  />
                  <Bar
                    dataKey="amount"
                    name="Ingresos"
                    radius={[12, 12, 0, 0]}
                    fill="#0891b2"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Estado de pagos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Control rápido de caja.
            </p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-500">Cargando pagos...</p>
            ) : (
              data?.paymentsByStatus.map((item) => (
                <div
                  key={item.status}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-white p-2 text-cyan-600">
                        <Activity className="h-4 w-4" />
                      </span>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {statusLabel(item.status)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.count} registro
                          {item.count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {formatMoney(item.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
            <p className="text-sm font-semibold text-cyan-900">
              Resumen rápido
            </p>

            <p className="mt-2 text-sm text-cyan-800">
              Pagados:{" "}
              <span className="font-bold">
                {approvedPayments?.count ?? 0}
              </span>
            </p>

            <p className="mt-1 text-sm text-cyan-800">
              Pagos pendientes:{" "}
              <span className="font-bold">
                {pendingPayments?.count ?? 0}
              </span>
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}