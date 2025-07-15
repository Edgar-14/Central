
import { ManualSync } from "@/components/admin/manual-sync";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSyncPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sincronización Manual</h1>
      <p className="text-muted-foreground">
        Usa esta sección para registrar manualmente a los repartidores que ya existen en tu cuenta de Shipday.
        Esta es una acción que solo necesitarás hacer una vez por cada repartidor existente.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Añadir Repartidor Existente</CardTitle>
          <CardDescription>
            Introduce los datos del repartidor exactamente como aparecen en Shipday. El 'Shipday Rider ID' es crucial para la sincronización futura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualSync />
        </CardContent>
      </Card>
    </div>
  );
}
