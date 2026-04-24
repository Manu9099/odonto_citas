import { useState } from "react";
import {
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { cn } from "../../lib/utils/cn";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/odontologos", label: "Odontólogos", icon: Stethoscope },
  { to: "/pagos", label: "Pagos", icon: CreditCard },
  { to: "/recordatorios", label: "Recordatorios", icon: Bell },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

type StoredUser = {
  fullName?: string;
  email?: string;
  role?: string;
};

function getStoredUser(): StoredUser | null {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

function formatRole(role?: string) {
  if (!role) return "Usuario";

  const roles: Record<string, string> = {
    ADMIN: "Administrador",
    DENTIST: "Odontólogo",
    PATIENT: "Paciente",
    RECEPTIONIST: "Recepción",
  };

  return roles[role] ?? role;
}

function SidebarContent({
  onNavigate,
  onLogout,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const user = getStoredUser();

  const userName = user?.fullName ?? "Usuario";
  const userEmail = user?.email ?? "Sin correo";
  const userRole = formatRole(user?.role);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl font-black text-white shadow-lg shadow-cyan-500/20">
          OC
        </div>

        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-950">
            OdontoCitas Pro
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Gestión clínica
          </p>
        </div>
      </div>

      <nav className="mt-9 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold transition",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                )
              }
            >
              <Icon className="size-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
              <UserCircle className="size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950">
                {userName}
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                {userEmail}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Rol
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              {userRole}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 flex-col border-r border-slate-200 bg-white px-6 py-7 shadow-sm lg:flex">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="grid size-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Abrir menú"
        >
          <Menu className="size-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white">
            OC
          </div>

          <div>
            <p className="text-sm font-black text-slate-950">
              OdontoCitas Pro
            </p>
            <p className="text-xs font-medium text-slate-500">
              Gestión clínica
            </p>
          </div>
        </div>

        <div className="size-11" />
      </header>

      {/* Overlay mobile */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col border-r border-slate-200 bg-white px-6 py-7 shadow-2xl transition-transform duration-300 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="grid size-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <SidebarContent
          onNavigate={() => setMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Content */}
      <main className="min-h-screen lg:pl-80">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}