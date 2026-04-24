import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import { AppShell } from "../layouts/app-shell";
import { LoginPage } from "../../features/auth/pages/login-page";
import { DashboardPage } from "../../features/dashboard/pages/dashboard-page";

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

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
        Módulo
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-2 text-slate-500">
        Esta sección todavía está en construcción.
      </p>
    </div>
  );
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
        element: <AppShell />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/agenda",
            element: <ComingSoonPage title="Agenda" />,
          },
          {
            path: "/pacientes",
            element: <ComingSoonPage title="Pacientes" />,
          },
          {
            path: "/odontologos",
            element: <ComingSoonPage title="Odontólogos" />,
          },
          {
            path: "/pagos",
            element: <ComingSoonPage title="Pagos" />,
          },
          {
            path: "/recordatorios",
            element: <ComingSoonPage title="Recordatorios" />,
          },
          {
            path: "/configuracion",
            element: <ComingSoonPage title="Configuración" />,
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