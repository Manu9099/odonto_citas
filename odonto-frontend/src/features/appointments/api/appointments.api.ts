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
  notes: string | null;
  cancelledReason: string | null;
};

export type CreateAppointmentPayload = {
  dentistId: number;
  scheduledAt: string;
  treatmentId: number;
  notes?: string;
};

export async function createAppointment(payload: CreateAppointmentPayload) {
  const { data } = await api.post<Appointment>("/appointments", payload);
  return data;
}

export async function getMyAppointments() {
  const { data } = await api.get<Appointment[]>("/appointments/me");
  return data;
}