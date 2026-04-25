import { api } from "../../../lib/api/client";

export type Treatment = {
  id: number;
  name: string;
  category: string;
  defaultDurationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  basePrice: number | null;
  active: boolean;
};

export async function getActiveTreatments() {
  const { data } = await api.get<Treatment[]>("/treatments/active");
  return data;
}