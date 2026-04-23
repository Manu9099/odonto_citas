import { PageHeader } from "../../../components/shared/page-header";
import { AppointmentsCalendar } from "../components/appointments-calendar";

export function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gestiona citas, disponibilidad y reprogramaciones."
      />
      <AppointmentsCalendar />
    </div>
  );
}