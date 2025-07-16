'use client';

import { useState, useEffect } from 'react';
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

interface DriverDetailPageProps {
    params: {
        uid: string;
    };
}

export default function DriverDetailPage({ params }: DriverDetailPageProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { uid } = params;

  useEffect(() => {
    if (!uid) {
      setError("No se proporcionó un UID.");
      setIsLoading(false);
      return;
    }

    const fetchDriverProfile = async () => {
      setIsLoading(true);
      try {
        // Since the UID from the URL is the email, which is the document ID.
        const driverDocRef = doc(db, 'drivers', uid);
        const driverDocSnap = await getDoc(driverDocRef);

        if (driverDocSnap.exists()) {
          setDriver(driverDocSnap.data() as Driver);
        } else {
          setError('No se encontró el perfil del repartidor.');
        }
      } catch (err) {
        setError('No se pudo cargar el perfil del repartidor.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverProfile();
  }, [uid]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!driver) {
    return (
        <div className="p-4">
            <Alert>
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>No se encontró información para este repartidor.</AlertDescription>
            </Alert>
        </div>
    );
  }
  
  const documentLinks = driver.documents ? Object.entries(driver.documents).map(([key, url]) => ({
    label: key.replace('Url', ''),
    url: url as string,
  })) : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Link href="/admin/drivers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver a la lista
      </Link>
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{driver.personalInfo.fullName}</h1>
          <p className="text-muted-foreground">{driver.personalInfo.email}</p>
        </div>
        <Badge variant={driver.operationalStatus === 'active' ? 'default' : 'destructive'}>
          {driver.operationalStatus}
        </Badge>
      </div>
      <Separator />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                <p><strong>Teléfono:</strong> {driver.personalInfo?.phone || 'N/A'}</p>
                <p><strong>Dirección:</strong> {driver.personalInfo?.address || 'N/A'}</p>
                <p><strong>CURP:</strong> {driver.personalInfo?.curp || 'N/A'}</p>
                <p><strong>RFC:</strong> {driver.personalInfo?.rfc || 'N/A'}</p>
                <p><strong>NSS:</strong> {driver.personalInfo?.nss || 'N/A'}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Vehículo</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                <p><strong>Tipo:</strong> {driver.vehicleInfo?.type || 'N/A'}</p>
                <p><strong>Marca:</strong> {driver.vehicleInfo?.brand || 'N/A'}</p>
                <p><strong>Placa:</strong> {driver.vehicleInfo?.plate || 'N/A'}</p>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Documentación</CardTitle>
                    <CardDescription>Documentos proporcionados.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                {documentLinks.length > 0 ? documentLinks.map(doc => (
                    <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-between">
                        {doc.label} <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    </a>
                )) : <p className="text-sm text-muted-foreground">No hay documentos.</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}