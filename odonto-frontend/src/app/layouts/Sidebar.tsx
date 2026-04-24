import {
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Calendario",
    icon: CalendarDays,
  },
  {
    label: "Pacientes",
    icon: Users,
  },
  {
    label: "Odontólogos",
    icon: Stethoscope,
  },
  {
    label: "Pagos",
    icon: CreditCard,
  },
  {
    label: "Recordatorios",
    icon: Bell,
  },
  {
    label: "Configuración",
    icon: Settings,
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-backdrop ${open ? "show" : ""}`}
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-mark">OC</div>

            <div>
              <strong>Odonto Citas</strong>
              <span>Gestión clínica</span>
            </div>
          </div>

          <button className="close-sidebar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href="#"
                className={`nav-link ${item.active ? "active" : ""}`}
              >
                <Icon size={20} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <span>Estado</span>
          <strong>Clínica operativa</strong>
          <p>Agenda, odontólogos y pagos conectados al backend.</p>
        </div>
      </aside>
    </>
  );
}