import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminDriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repartidores</h1>
        <p className="text-muted-foreground">Gestiona y monitorea a todos los repartidores de la flota.</p>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Flota Activa</CardTitle>
          <CardDescription>Esta sección mostrará una lista completa de todos los repartidores.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <Users className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">La gestión de repartidores estará disponible aquí.</p>
        </CardContent>
      </Card>
    </div>
  );
}
