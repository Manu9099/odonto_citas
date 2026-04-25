import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AppShell } from "../layouts/app-shell";
import { LoginPage } from "../../features/auth/pages/login-page";
import { DashboardPage } from "../../features/dashboard/pages/dashboard-page";
import { AppointmentsPage } from "../../features/appointments/pages/appointments-page";
import { DentistsPage } from "../../features/dentists/pages/dentists-page";
import { PatientsPage } from "../../features/patients/pages/patients-page";
import { PaymentsPage } from "../../features/payments/pages/payments-page";
import { RemindersPage } from "../../features/reminders/pages/reminders-page";

function RequireAuth() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function GuestOnly() {
  const token = localStorage.getItem("access_token");

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}



export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "agenda",
            element: <AppointmentsPage />,
          },
          {
            path: "pacientes",
            element: <PatientsPage />,
          },
          {
            path: "odontologos",
            element: <DentistsPage />,
          },
          {
            path: "pagos",
            element: <PaymentsPage />,
          },
          {
            path: "recordatorios",
            element: <RemindersPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);