import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function DriverProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal y de tu vehículo.</p>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
          <CardDescription>Esta sección te permitirá editar tus datos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <User className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">La gestión del perfil de repartidor estará disponible aquí.</p>
        </CardContent>
      </Card>
    </div>
  );
}
