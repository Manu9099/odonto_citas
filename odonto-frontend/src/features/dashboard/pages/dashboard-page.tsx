import { CalendarClock, CreditCard, Users, Wallet } from "lucide-react";
import { PageHeader } from "../../../components/shared/page-header";
import { SectionCard } from "../../../components/shared/section-card";
import { StatCard } from "../../../components/shared/stat-card";
import { StatusBadge } from "../../../components/shared/status-badge";

const todaysAppointments = [
  { id: 1, patient: "Luis Pérez", time: "09:00", treatment: "Limpieza dental", status: "Confirmada" },
  { id: 2, patient: "Carla Mendoza", time: "10:30", treatment: "Ortodoncia", status: "Pendiente" },
  { id: 3, patient: "Andrés Salazar", time: "12:00", treatment: "Evaluación", status: "Pagada" },
];
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general de citas, pacientes y pagos del día."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Citas hoy" value="18" hint="4 pendientes de confirmación" icon={<CalendarClock className="size-5 text-slate-400" />} />
        <StatCard label="Pacientes activos" value="248" hint="12 nuevos este mes" icon={<Users className="size-5 text-slate-400" />} />
        <StatCard label="Cobrado hoy" value="S/ 1,840" hint="6 pagos aprobados" icon={<Wallet className="size-5 text-slate-400" />} />
        <StatCard label="Pendientes" value="S/ 420" hint="3 pagos por regularizar" icon={<CreditCard className="size-5 text-slate-400" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard title="Agenda de hoy" subtitle="Citas próximas del consultorio">
          <div className="space-y-3">
             {todaysAppointments.map((item) => (
               <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                     <div>
                         <p className="font-medium text-slate-950">{item.patient}</p>
                             <p className="text-sm text-slate-500">{item.treatment}</p>
                           </div>
                           <div className="flex items-center gap-3">
                             <p className="text-sm font-medium text-slate-700">{item.time}</p>
                             <StatusBadge
                               label={item.status}
                                 variant={
                                                     item.status === "Confirmada"
                                                       ? "success"
                                                       : item.status === "Pendiente"
                                                         ? "warning"
                                                         : "info"
                                                   }
                                                 />
                                               </div>
                                             </div>
                                           ))}
                                         </div>
                                       </SectionCard>

                                       <SectionCard title="Actividad rápida" subtitle="Indicadores operativos del consultorio">
                                         <div className="space-y-4">
                                         <div className="rounded-2xl bg-slate-50 p-4">
                                                       <p className="text-sm text-slate-500">Ocupación de agenda</p>
                                                       <p className="mt-2 text-2xl font-semibold text-slate-950">78%</p>
                                                     </div>
                                                     <div className="rounded-2xl bg-slate-50 p-4">
                                                     <p className="text-sm text-slate-500">Pacientes nuevos hoy</p>
                                                       <p className="mt-2 text-2xl font-semibold text-slate-950">3</p>
                                                     </div>
                                                     <div className="rounded-2xl bg-slate-50 p-4">
                                                       <p className="text-sm text-slate-500">Recordatorios programados</p>
                                                       <p className="mt-2 text-2xl font-semibold text-slate-950">14</p>
                                                     </div>
                                                   </div>
                                                          </SectionCard>
                                                         </div>
                                                       </div>
                                                     );
                                                   }