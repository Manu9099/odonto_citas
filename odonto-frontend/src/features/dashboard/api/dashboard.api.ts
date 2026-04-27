import { api } from "../../../lib/api/client";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export type PaymentStatusSummary = {
  status: PaymentStatus;
  count: number;
  amount: number;
};

export type DashboardDayRevenue = {
  date: string;
  amount: number;
};

export type DashboardSummary = {
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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}