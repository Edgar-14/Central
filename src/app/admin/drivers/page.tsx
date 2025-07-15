import { DriversList } from "@/components/admin/drivers-list";

export default function AdminDriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flota de Repartidores</h1>
        <p className="text-muted-foreground">
          Gestiona y supervisa a todos los repartidores activos en la plataforma.
        </p>
      </div>
      <DriversList />
    </div>
  );
}
