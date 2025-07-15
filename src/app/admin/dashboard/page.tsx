import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Un resumen general de la operación de la flota.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
