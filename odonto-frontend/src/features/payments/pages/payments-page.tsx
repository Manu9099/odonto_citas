import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  ReceiptText,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../../lib/api/client";
import { PageHeader } from "../../../components/shared/page-header";
import { cn } from "../../../lib/utils/cn";

type PaymentProvider = "MERCADOPAGO" | "STRIPE" | "CASH";
type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | string;

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

type PaymentResponse = {
  id: number;
  appointmentId: number;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerPaymentId?: string | null;
  providerRef?: string | null;
  paidAt?: string | null;
  checkoutUrl?: string | null;
};

type PaymentCreateRequest = {
  appointmentId: number;
  amount: number;
  currency: string;
  provider: PaymentProvider;
};

function formatMoney(amount?: number | string, currency = "PEN") {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizePaymentStatus(status?: PaymentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "APPROVED") return "Aprobado";
  if (value === "PENDING") return "Pendiente";
  if (value === "REJECTED") return "Rechazado";
  if (value === "REFUNDED") return "Reembolsado";

  return status || "Sin pago";
}

function normalizeAppointmentStatus(status?: AppointmentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "CONFIRMED") return "Confirmada";
  if (value === "PENDING") return "Pendiente";
  if (value === "PAID") return "Pagada";
  if (value === "COMPLETED") return "Completada";
  if (value === "CANCELLED") return "Cancelada";

  return status || "Sin estado";
}

function paymentStatusClass(status?: PaymentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "APPROVED") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (value === "PENDING") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (value === "REJECTED") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (value === "REFUNDED") {
    return "border-purple-100 bg-purple-50 text-purple-700";
  }

  return "border-slate-100 bg-slate-50 text-slate-600";
}

function providerLabel(provider?: PaymentProvider) {
  if (provider === "MERCADOPAGO") return "Mercado Pago";
  if (provider === "STRIPE") return "Stripe";
  if (provider === "CASH") return "Efectivo";

  return provider ?? "Sin proveedor";
}

export function PaymentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [amount, setAmount] = useState("150");
  const [currency, setCurrency] = useState("PEN");
  const [provider, setProvider] = useState<PaymentProvider>("CASH");

  const {
    data: appointments = [],
    isLoading: loadingAppointments,
    isError: appointmentsError,
  } = useQuery({
    queryKey: ["payments-appointments"],
    queryFn: async () => {
      const response = await api.get<Appointment[]>("/appointments/me");
      return response.data;
    },
  });

  const {
    data: payments = [],
    isLoading: loadingPayments,
    isError: paymentsError,
  } = useQuery({
    queryKey: ["payments-by-appointments", appointments.map((item) => item.id)],
    enabled: appointments.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            const response = await api.get<PaymentResponse>(
              `/payments/appointment/${appointment.id}`
            );

            return response.data;
          } catch {
            return null;
          }
        })
      );

      return rows.filter(Boolean) as PaymentResponse[];
    },
  });

  const paymentByAppointment = useMemo(() => {
    const map = new Map<number, PaymentResponse>();

    payments.forEach((payment) => {
      map.set(payment.appointmentId, payment);
    });

    return map;
  }, [payments]);

  const rows = useMemo(() => {
    return appointments.map((appointment) => ({
      appointment,
      payment: paymentByAppointment.get(appointment.id),
    }));
  }, [appointments, paymentByAppointment]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter(({ appointment, payment }) => {
      return (
        appointment.patientName.toLowerCase().includes(query) ||
        appointment.dentistName?.toLowerCase().includes(query) ||
        appointment.treatmentType?.toLowerCase().includes(query) ||
        payment?.provider?.toLowerCase().includes(query) ||
        payment?.status?.toLowerCase().includes(query)
      );
    });
  }, [rows, search]);

  const unpaidAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const payment = paymentByAppointment.get(appointment.id);
      return String(payment?.status ?? "").toUpperCase() !== "APPROVED";
    });
  }, [appointments, paymentByAppointment]);

  const stats = useMemo(() => {
    const approvedPayments = payments.filter(
      (payment) => String(payment.status).toUpperCase() === "APPROVED"
    );

    const pendingPayments = payments.filter(
      (payment) => String(payment.status).toUpperCase() === "PENDING"
    );

    const rejectedPayments = payments.filter(
      (payment) => String(payment.status).toUpperCase() === "REJECTED"
    );

    const totalApproved = approvedPayments.reduce(
      (acc, payment) => acc + Number(payment.amount ?? 0),
      0
    );

    return {
      totalPayments: payments.length,
      approvedPayments: approvedPayments.length,
      pendingPayments: pendingPayments.length,
      rejectedPayments: rejectedPayments.length,
      totalApproved,
      unpaidAppointments: unpaidAppointments.length,
    };
  }, [payments, unpaidAppointments.length]);

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: PaymentCreateRequest) => {
      const response = await api.post<PaymentResponse>("/payments", payload);
      return response.data;
    },
    onSuccess: () => {
      setSelectedAppointmentId("");
      setAmount("150");
      setProvider("CASH");

      queryClient.invalidateQueries({ queryKey: ["payments-by-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["payments-appointments"] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAppointmentId) return;

    createPaymentMutation.mutate({
      appointmentId: Number(selectedAppointmentId),
      amount: Number(amount),
      currency,
      provider,
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Gestión financiera"
        title="Pagos"
        description="Registra pagos por cita, consulta estados y controla cobros pendientes."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Cobrado</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingPayments
                  ? "..."
                  : formatMoney(stats.totalApproved, "PEN")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Pagos aprobados
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Wallet className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Aprobados</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingPayments ? "..." : stats.approvedPayments}
              </p>
              <p className="mt-2 text-sm text-slate-500">Transacciones OK</p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Pendientes</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingPayments ? "..." : stats.pendingPayments}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Esperando confirmación
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <CreditCard className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Sin pago</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {loadingAppointments ? "..." : stats.unpaidAppointments}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Citas por cobrar
              </p>
            </div>

            <div className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
              <XCircle className="size-6" />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Registrar pago
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea un pago asociado a una cita.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-black text-slate-700">Cita</span>

              <select
                value={selectedAppointmentId}
                onChange={(event) => setSelectedAppointmentId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Selecciona una cita</option>

                {unpaidAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    #{appointment.id} - {appointment.patientName} -{" "}
                    {appointment.treatmentType ?? "Tratamiento"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Monto
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Moneda
                </span>

                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="PEN">PEN</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black text-slate-700">
                Método de pago
              </span>

              <select
                value={provider}
                onChange={(event) =>
                  setProvider(event.target.value as PaymentProvider)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="CASH">Efectivo</option>
                <option value="MERCADOPAGO">Mercado Pago</option>
                <option value="STRIPE">Stripe</option>
              </select>
            </label>

            {createPaymentMutation.isError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                No se pudo crear el pago. Revisa que la cita exista y no tenga
                un pago duplicado.
              </div>
            )}

            <button
              type="submit"
              disabled={
                createPaymentMutation.isPending || !selectedAppointmentId
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <DollarSign className="size-4" />
                  Registrar pago
                </>
              )}
            </button>
          </form>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Historial de pagos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pagos consultados por cita.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar pago..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {(appointmentsError || paymentsError) && (
            <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              No se pudieron cargar los pagos. Revisa token y backend.
            </div>
          )}

          <div className="max-h-[720px] overflow-y-auto p-3">
            {loadingAppointments || loadingPayments ? (
              <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-500">
                Cargando pagos...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                    <ReceiptText className="size-7" />
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-950">
                    No hay pagos para mostrar
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Registra pagos para las citas pendientes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRows.map(({ appointment, payment }) => (
                  <article
                    key={appointment.id}
                    className="rounded-3xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">
                            {appointment.patientName}
                          </p>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            Cita #{appointment.id}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {appointment.treatmentType ??
                            "Tratamiento no especificado"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {appointment.dentistName ??
                            "Odontólogo no registrado"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-black",
                            paymentStatusClass(payment?.status)
                          )}
                        >
                          {normalizePaymentStatus(payment?.status)}
                        </span>

                        <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                          {normalizeAppointmentStatus(appointment.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Fecha cita
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {formatDateTime(appointment.scheduledAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Monto
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {payment
                            ? formatMoney(payment.amount, payment.currency)
                            : "Sin pago"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Proveedor
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {providerLabel(payment?.provider)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Fecha pago
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {payment?.paidAt
                            ? formatDateTime(payment.paidAt)
                            : "No pagado"}
                        </p>
                      </div>
                    </div>

                    {payment?.checkoutUrl && (
                      <a
                        href={payment.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                      >
                        Abrir checkout
                        <ExternalLink className="size-4" />
                      </a>
                    )}

                    {!payment && (
                      <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                        Esta cita todavía no tiene pago registrado.
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}