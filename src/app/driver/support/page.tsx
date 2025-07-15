import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

export default function DriverSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Soporte</h1>
        <p className="text-muted-foreground">Encuentra ayuda y contacta a nuestro equipo de soporte.</p>
      </div>
       <Card className="glass-card">
        <CardHeader>
          <CardTitle>Centro de Ayuda</CardTitle>
          <CardDescription>Encuentra respuestas a preguntas frecuentes y contacta a soporte.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <LifeBuoy className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">La sección de soporte para repartidores estará disponible aquí.</p>
        </CardContent>
      </Card>
    </div>
  );
}
