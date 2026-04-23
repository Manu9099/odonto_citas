import { PageHeader } from "../../../components/shared/page-header";
import { SectionCard } from "../../../components/shared/section-card";
export function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pagos" description="Monitorea estados, montos y conciliación de cobros." />
      <SectionCard title="Resumen de pagos" subtitle="Aquí irá tabla de pagos, filtros y estados.">
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Módulo de pagos listo para integrar Mercado Pago o Stripe.
        </div>
      </SectionCard>
          </div>
        );
      }