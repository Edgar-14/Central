
import { OperationalSettings } from "@/components/admin/operational-settings";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajustes Operativos</h1>
        <p className="text-muted-foreground">
          Gestiona las variables globales de la operación como tarifas, comisiones e incentivos.
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
        <OperationalSettings />
      </Suspense>
    </div>
  );
}
