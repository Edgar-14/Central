import { ApplicationsList } from "@/components/admin/applications-list";

export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes Pendientes</h1>
        <p className="text-muted-foreground">Revisa, aprueba o rechaza las nuevas solicitudes de repartidores.</p>
      </div>
      <ApplicationsList />
    </div>
  );
}
