// src/app/admin/drivers/[uid]/page.tsx

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Componentes de UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Bike, FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Tipos y utilidades
import type { Driver } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';

type PageProps = {
  params: { uid: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function DriverDetailPage({ params }: PageProps) {
  const { uid } = params;

  // The UID is the driver's email, which might be URI encoded.
  const decodedUid = decodeURIComponent(uid);

  const driverDocRef = doc(db, 'drivers', decodedUid);
  const driverDocSnap = await getDoc(driverDocRef);

  if (!driverDocSnap.exists()) {
    notFound();
  }

  const driver = driverDocSnap.data() as Driver;

  const documentLinks = driver.documents
    ? Object.entries(driver.documents)
        .filter(([, url]) => url)
        .map(([key, url]) => ({
          label: key.replace('Url', '').replace(/([A-Z])/g, ' $1').trim(),
          url: url as string,
        }))
    : [];

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'active':
            return 'default';
        case 'pending_validation':
        case 'approved':
            return 'secondary';
        case 'suspended':
        case 'restricted_debt':
        case 'rejected':
            return 'destructive';
        default:
            return 'outline';
    }
  };
  
  const statusVariant = getStatusVariant(driver.operationalStatus);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <Link
        href="/admin/drivers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la lista de repartidores
      </Link>
      
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            {driver.personalInfo?.fullName || 'Nombre no disponible'}
          </h1>
          <p className="text-muted-foreground mt-1">{driver.personalInfo?.email || 'Email no disponible'}</p>
        </div>
        
        <Badge
          variant={statusVariant}
          className="text-sm px-3 py-1 capitalize"
        >
          {driver.operationalStatus?.replace('_', ' ') || 'unknown'}
        </Badge>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p>{driver.personalInfo?.phone ? formatPhoneNumber(driver.personalInfo.phone) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dirección</p>
                <p>{driver.personalInfo?.address || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">CURP</p>
                  <p>{driver.personalInfo?.curp || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">RFC</p>
                  <p>{driver.personalInfo?.rfc || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NSS</p>
                  <p>{driver.personalInfo?.nss || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5" />
                Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p>{driver.vehicleInfo?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marca</p>
                <p>{driver.vehicleInfo?.brand || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Placa</p>
                <p>{driver.vehicleInfo?.plate || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Columna derecha */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentación
              </CardTitle>
              <CardDescription>Documentos proporcionados por el repartidor</CardDescription>
            </CardHeader>
            <CardContent>
              {documentLinks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documentLinks.map((docItem) => (
                    <a
                      key={docItem.label}
                      href={docItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-accent transition-colors"
                      >
                        <span className="truncate max-w-[140px] capitalize">{docItem.label}</span>
                        <ExternalLink className="ml-2 h-4 w-4 flex-shrink-0" />
                      </Button>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No hay documentos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
