import { api } from "../../../lib/api/client";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type Appointment = {
  id: number;
  dentistId: number;
  dentistName: string;
  patientId: number;
  patientName: string;
  scheduledAt: string;
  endsAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  treatmentId: number | null;
  treatmentType: string | null;
  treatmentBasePrice?: number | string | null;
  notes: string | null;
  cancelledReason: string | null;
};

export type CalendarDayResponse = {
  date: string;
  label: string;
  appointments: Appointment[];
};

export type CreateAppointmentPayload = {
  dentistId: number;
  scheduledAt: string;
  treatmentId: number;
  notes?: string;
};

export async function getMyAppointments(): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments/me");
  return data;
}

export async function getCalendarDay(date: string): Promise<CalendarDayResponse> {
  const { data } = await api.get<CalendarDayResponse>("/appointments/calendar/day", {
    params: { date },
  });

  return data;
}

export async function createAppointment(
  payload: CreateAppointmentPayload
): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", payload);
  return data;
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: AppointmentStatus,
  cancelledReason?: string
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(
    `/appointments/${appointmentId}/status`,
    {
      status,
      cancelledReason,
    }
  );

  return data;
}