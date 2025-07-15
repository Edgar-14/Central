
'use client';

import { useState, useEffect, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User, Bike, FileText, AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import type { Driver } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function DriverDetailContent({ email }: { email: string }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!email) {
        setError("No se proporcionó un email de repartidor.");
        setIsLoading(false);
        return;
      }
      try {
        const driverDocRef = doc(db, 'drivers', decodeURIComponent(email));
        const driverDocSnap = await getDoc(driverDocRef);

        if (!driverDocSnap.exists()) {
          throw new Error('No se encontró el perfil del repartidor.');
        }
        setDriver(driverDocSnap.data() as Driver);
      } catch (err: any) {
        console.error("Error fetching driver profile:", err);
        setError('No se pudo cargar el perfil del repartidor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverProfile();
  }, [email]);

  const documentLinks = driver?.documents ? Object.entries(driver.documents).map(([key, url]) => ({
      label: key.replace('Url', ''),
      url: url as string
  })) : [];


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
       <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a la lista de repartidores
        </Link>
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div>
            <h1 className="text-3xl font-bold">{driver.fullName}</h1>
            <p className="text-muted-foreground">{driver.email}</p>
        </div>
        <Badge variant={driver.operationalStatus === 'active' ? 'default' : 'destructive'} className="capitalize text-base">
            {driver.operationalStatus}
        </Badge>
      </div>
      <Separator/>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Datos y Vehículo */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Información Personal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Teléfono:</strong> {driver.personalInfo?.phone || 'N/A'}</p>
                <p><strong>Dirección:</strong> {driver.personalInfo?.address || 'N/A'}</p>
                <p><strong>CURP:</strong> {driver.personalInfo?.curp || 'N/A'}</p>
                <p><strong>RFC:</strong> {driver.personalInfo?.rfc || 'N/A'}</p>
                <p><strong>NSS:</strong> {driver.personalInfo?.nss || 'N/A'}</p>
              </CardContent>
            </Card>

             <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Bike className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Vehículo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Tipo:</strong> {driver.vehicleInfo?.type || 'N/A'}</p>
                <p><strong>Marca y Modelo:</strong> {driver.vehicleInfo?.brand || 'N/A'}</p>
                <p><strong>Placa:</strong> {driver.vehicleInfo?.plate || 'N/A'}</p>
              </CardContent>
            </Card>
        </div>

        {/* Columna 2 y 3: Documentos y Legal */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Documentación</CardTitle>
                    <CardDescription>Documentos proporcionados durante el registro.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {documentLinks.length > 0 ? documentLinks.map(doc => (
                      <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full capitalize justify-between">
                              {doc.label}
                              <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                      </a>
                  )) : <p className="text-sm text-muted-foreground col-span-full">No hay documentos disponibles.</p>}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}


export default function DriverDetailPage({ params }: { params: { email: string } }) {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <DriverDetailContent email={params.email} />
        </Suspense>
    );
}

