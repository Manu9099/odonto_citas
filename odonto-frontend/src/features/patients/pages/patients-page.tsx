import { PageHeader } from "../../../components/shared/page-header";
import { SectionCard } from "../../../components/shared/section-card";

export function PatientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pacientes" description="Consulta fichas, historial y próximas atenciones." />
      <SectionCard title="Listado de pacientes" subtitle="Aquí irá tabla, búsqueda y filtros.">
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Módulo de pacientes listo para conectar al backend.
        </div>
             </SectionCard>
            </div>
          );
        }