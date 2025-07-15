'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User, Bike, FileText, AlertTriangle } from 'lucide-react';
import type { Driver } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function DriverProfilePage() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No estás autenticado.');
        }

        const driverDocRef = doc(db, 'drivers', currentUser.uid);
        const driverDocSnap = await getDoc(driverDocRef);

        if (!driverDocSnap.exists()) {
          throw new Error('No se encontró tu perfil de repartidor.');
        }
        setDriver(driverDocSnap.data() as Driver);
      } catch (err: any) {
        console.error("Error fetching driver profile:", err);
        setError('No se pudo cargar tu perfil.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Aquí está tu información registrada en BeFast.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <User className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Tus datos de contacto e identificación.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nombre:</strong> {driver.personalInfo.fullName}</p>
            <p><strong>Email:</strong> {driver.personalInfo.email}</p>
            <p><strong>Teléfono:</strong> {driver.personalInfo.phone}</p>
            <p><strong>Dirección:</strong> {driver.personalInfo.address}</p>
            <p><strong>CURP:</strong> {driver.personalInfo.curp}</p>
            <p><strong>RFC:</strong> {driver.personalInfo.rfc}</p>
            <p><strong>NSS:</strong> {driver.personalInfo.nss}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Bike className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Vehículo Registrado</CardTitle>
              <CardDescription>Información de tu vehículo para operar.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Tipo:</strong> {driver.vehicleInfo.type}</p>
            <p><strong>Marca y Modelo:</strong> {driver.vehicleInfo.brand}</p>
            <p><strong>Placa:</strong> {driver.vehicleInfo.plate}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
                <CardTitle>Legal</CardTitle>
                <CardDescription>Información sobre tu contrato.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="text-sm">
            <p><strong>Versión de Contrato:</strong> {driver.legal.contractVersion}</p>
            <p><strong>Fecha de Firma:</strong> {driver.legal.signatureTimestamp ? new Date(driver.legal.signatureTimestamp).toLocaleString('es-MX') : 'No registrada'}</p>
        </CardContent>
      </Card>
      
      <div className="text-center pt-4">
        <Button variant="outline" disabled>Editar Perfil (Próximamente)</Button>
      </div>
    </div>
  );
}
