import {
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
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api/client";
import { PageHeader } from "../../../components/shared/page-header";
import { cn } from "../../../lib/utils/cn";

type PaymentProvider = "MERCADOPAGO" | "STRIPE" | "CASH";

type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED"
  | string;

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
  treatmentId?: number | null;
  treatmentType?: string | null;
  treatmentBasePrice?: number | string | null;
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
  currency: string;
  provider: PaymentProvider;
};

function formatMoney(amount?: number | string | null, currency = "PEN") {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatOptionalMoney(amount?: number | string | null, currency = "PEN") {
  if (amount === null || amount === undefined || amount === "") {
    return "Sin precio";
  }

  return formatMoney(amount, currency);
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

function appointmentStatusClass(status?: AppointmentStatus) {
  const value = String(status ?? "").toUpperCase();

  if (value === "CONFIRMED") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (value === "PENDING") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (value === "PAID") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (value === "COMPLETED") {
    return "border-slate-100 bg-slate-50 text-slate-700";
  }

  if (value === "CANCELLED") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-slate-100 bg-slate-50 text-slate-600";
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof DollarSign;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {title}
          </p>
          <strong className="mt-2 block text-2xl font-black text-slate-900">
            {value}
          </strong>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {description}
          </p>
        </div>

        <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="size-5" />
        </span>
      </div>
    </article>
  );
}

export function PaymentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [provider, setProvider] = useState<PaymentProvider>("CASH");

  const {
    data: appointments = [],
    isLoading: loadingAppointments,
    isError: appointmentsError,
  } = useQuery<Appointment[]>({
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
  } = useQuery<PaymentResponse[]>({
    queryKey: [
      "payments-by-appointments",
      appointments.map((appointment) => appointment.id),
    ],
    enabled: appointments.length > 0,
    queryFn: async () => {
      const rows = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            const response = await api.get<PaymentResponse | null>(
              `/payments/appointment/${appointment.id}`
            );

            return response.data || null;
          } catch (error) {
            const apiError = error as { response?: { status?: number } };

            if (apiError.response?.status === 404) {
              return null;
            }

            throw error;
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
      return !payment;
    });
  }, [appointments, paymentByAppointment]);

  const selectedAppointment = useMemo(() => {
    return appointments.find(
      (appointment) => appointment.id === Number(selectedAppointmentId)
    );
  }, [appointments, selectedAppointmentId]);

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
      setProvider("CASH");

      queryClient.invalidateQueries({
        queryKey: ["payments-by-appointments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["payments-appointments"],
      });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!selectedAppointmentId) return;

    createPaymentMutation.mutate({
      appointmentId: Number(selectedAppointmentId),
      currency,
      provider,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestión financiera"
        title="Pagos"
        description="Registra pagos asociados a citas y revisa el estado de cobros."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Cobrado"
          value={loadingPayments ? "..." : formatMoney(stats.totalApproved, "PEN")}
          description="Pagos aprobados"
          icon={DollarSign}
        />

        <StatCard
          title="Aprobados"
          value={loadingPayments ? "..." : stats.approvedPayments}
          description="Transacciones OK"
          icon={CheckCircle2}
        />

        <StatCard
          title="Pendientes"
          value={loadingPayments ? "..." : stats.pendingPayments}
          description="Esperando confirmación"
          icon={Wallet}
        />

        <StatCard
          title="Sin pago"
          value={loadingAppointments ? "..." : stats.unpaidAppointments}
          description="Citas por cobrar"
          icon={XCircle}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <CreditCard className="size-5 text-blue-600" />
                Registrar pago
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Crea un pago asociado a una cita.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Cita
              </span>

              <select
                value={selectedAppointmentId}
                onChange={(event) => setSelectedAppointmentId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Selecciona una cita</option>

                {unpaidAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    #{appointment.id} - {appointment.patientName} -{" "}
                    {appointment.treatmentType ?? "Tratamiento"} -{" "}
                    {formatOptionalMoney(appointment.treatmentBasePrice, currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Monto calculado
              </span>

              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                {selectedAppointment
                  ? formatOptionalMoney(selectedAppointment.treatmentBasePrice, currency)
                  : "Selecciona una cita"}
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                El monto se obtiene automáticamente del precio base del
                tratamiento asociado a la cita.
              </p>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
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

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
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
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                No se pudo crear el pago. Revisa que la cita tenga tratamiento
                con precio y que no tenga un pago duplicado.
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedAppointmentId || createPaymentMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ReceiptText className="size-4" />
                  Registrar pago
                </>
              )}
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Historial de pagos
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Pagos consultados por cita.
              </p>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pago..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {(appointmentsError || paymentsError) && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              No se pudieron cargar los pagos. Revisa token y backend.
            </div>
          )}

          {loadingAppointments || loadingPayments ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 p-10 text-sm font-bold text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Cargando pagos...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
              <ReceiptText className="mx-auto size-10 text-slate-300" />
              <h3 className="mt-3 text-lg font-black text-slate-800">
                No hay pagos para mostrar
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Registra pagos para las citas pendientes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRows.map(({ appointment, payment }) => (
                <article
                  key={appointment.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Cita #{appointment.id}
                      </p>

                      <h3 className="mt-1 text-lg font-black text-slate-900">
                        {appointment.patientName}
                      </h3>

                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {appointment.treatmentType ?? "Tratamiento no especificado"}
                      </p>

                      <p className="text-sm font-medium text-slate-500">
                        {appointment.dentistName ?? "Odontólogo no registrado"}
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

                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-black",
                          appointmentStatusClass(appointment.status)
                        )}
                      >
                        {normalizeAppointmentStatus(appointment.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Fecha cita
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {formatDateTime(appointment.scheduledAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Monto
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {payment
                          ? formatMoney(payment.amount, payment.currency)
                          : formatOptionalMoney(
                              appointment.treatmentBasePrice,
                              currency
                            )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Proveedor
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {providerLabel(payment?.provider)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Fecha pago
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {payment?.paidAt
                          ? formatDateTime(payment.paidAt)
                          : "No pagado"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {payment?.checkoutUrl && (
                      <a
                        href={payment.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                      >
                        <ExternalLink className="size-4" />
                        Abrir checkout
                      </a>
                    )}

                    {!payment && (
                      <p className="text-sm font-bold text-slate-500">
                        Esta cita todavía no tiene pago registrado.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}