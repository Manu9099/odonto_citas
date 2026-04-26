import {
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
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

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-backdrop ${open ? "show" : ""}`}
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      <aside
        className={`sidebar ${open ? "open" : ""} ${
          collapsed ? "collapsed" : ""
        }`}
      >
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-mark">OC</div>

            {!collapsed && (
              <div className="brand-text">
                <strong>Odonto Citas</strong>
                <span>Gestión clínica</span>
              </div>
            )}
          </div>

          <div className="sidebar-actions">
            <button
              type="button"
              className="collapse-sidebar"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>

            <button className="close-sidebar" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href="#"
                className={`nav-link ${item.active ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="sidebar-card">
            <span>Estado</span>
            <strong>Clínica operativa</strong>
            <p>Agenda, odontólogos y pagos conectados al backend.</p>
          </div>
        )}
      </aside>
    </>
  );
}