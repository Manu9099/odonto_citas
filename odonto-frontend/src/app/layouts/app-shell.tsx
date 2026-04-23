import { CalendarDays, CreditCard, LayoutDashboard, Stethoscope, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/utils/cn";
const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/odontologos", label: "Odontólogos", icon: Stethoscope },
  { to: "/pagos", label: "Pagos", icon: CreditCard },
]
export function AppShell() {
  return (
   <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
          <aside className="hidden border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col">
            <div className="mb-10">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="size-9 rounded-xl bg-emerald-600" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Odonto</p>
                  <h1 className="text-lg font-semibold text-slate-950">OdontoCitas Pro</h1>
                </div>
                       </div>
                          </div>

                          <nav className="space-y-2">
                            {navItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <NavLink
                                  key={item.to}
                                    to={item.to}
                                                    end={item.to === "/"}
                                                    className={({ isActive }) =>
                                                      cn(
                                                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                                                        isActive
                                                          ? "bg-slate-950 text-white shadow-sm"
                                                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                                      )
                                                    }
                                                  >
                                                    <Icon className="size-4" />
                                                    {item.label}
                                                  </NavLink>
                                                );
                                                           })}
                                                          </nav>

                                                          <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                            <p className="text-sm font-medium text-slate-900">Clínica Sonrisa Integral</p>
                                                            <p className="mt-1 text-xs text-slate-500">Agenda, pacientes y pagos en un solo lugar.</p>
                                                          </div>
                                                        </aside>
                                                        <main className="min-w-0">
                                                                  <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
                                                                    <div className="flex items-center justify-between px-4 py-4 md:px-8">
                                                                      <div>
                                                                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Panel administrativo</p>
                                                                        <h2 className="text-lg font-semibold text-slate-950">OdontoCitas Pro</h2>
                                                                      </div>
                                                                      <div className="flex items-center gap-3">
                                                                        <div className="hidden text-right md:block">
                                                                          <p className="text-sm font-medium text-slate-900">Administrador</p>
                                                                          <p className="text-xs text-slate-500">admin@clinicadental.com</p>
                                                                        </div>
                                                                        <div className="size-10 rounded-full bg-slate-200" />
                                                                      </div>
                                                                    </div>
                                                                  </header>

                                                                  <div className="px-4 py-6 md:px-8 md:py-8">
                                                                            <Outlet />
                                                                            </div>
                                                                          </main>
                                                                        </div>
                                                                      </div>
                                                                    );
                                                                  }