
import { DriversList } from "@/components/admin/drivers-list";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function AdminDriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flota de Repartidores</h1>
        <p className="text-muted-foreground">
          Gestiona y supervisa a todos los repartidores activos en la plataforma.
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
        <DriversList />
      </Suspense>
    </div>
  );
}
