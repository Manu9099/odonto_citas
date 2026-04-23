import { createBrowserRouter } from "react-router";
import { AppShell } from "../layouts/app-shell";
import { LoginPage } from "../../features/auth/pages/login-page";
import { DashboardPage } from "../../features/dashboard/pages/dashboard-page";
import { AppointmentsPage } from "../../features/appointments/pages/appointments-page";
import { PatientsPage } from "../../features/patients/pages/patients-page";
import { PaymentsPage } from "../../features/payments/pages/payments-page";

function DentistsPage() {
  return <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-sm text-slate-500">Módulo de odontólogos en construcción.</div>;
}

export const router = createBrowserRouter([
  {
    path: "/login", element: <LoginPage />,
                     },
                     {
                       path: "/",
                       element: <AppShell />,
                       children: [
                         { index: true, element: <DashboardPage /> },
                         { path: "agenda", element: <AppointmentsPage /> },
                         { path: "pacientes", element: <PatientsPage /> },
                         { path: "odontologos", element: <DentistsPage /> },
                         { path: "pagos", element: <PaymentsPage /> },
                       ],
                     },
                   ]);