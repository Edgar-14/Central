'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Driver } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ApplicationReviewModalProps {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
}

const functions = getFunctions();
const activateDriver = httpsCallable(functions, 'activatedriver');
const rejectApplication = httpsCallable(functions, 'rejectapplication');

export function ApplicationReviewModal({ driver, isOpen, onClose }: ApplicationReviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
        if (action === 'approve') {
            await activateDriver({ driverId: driver.uid });
        } else {
            await rejectApplication({ driverId: driver.uid });
        }

      toast({
        title: `Solicitud ${action === 'approve' ? 'Aprobada' : 'Rechazada'}`,
        description: `El repartidor ${driver.personalInfo.fullName} ha sido ${action === 'approve' ? 'activado' : 'rechazado'}.`,
      });
      onClose();
    } catch (err: any) {
      console.error(`Failed to ${action} application:`, err);
      toast({
        title: 'Error',
        description: `No se pudo ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud.`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const documentLinks = [
    { label: "INE", url: driver.documents.ineUrl },
    { label: "Licencia", url: driver.documents.licenseUrl },
    { label: "Seguro", url: driver.documents.insuranceUrl },
    { label: "Comp. Domicilio", url: driver.documents.addressProofUrl },
    { label: "CSF", url: driver.documents.taxIdUrl },
    { label: "Tarjeta Circulación", url: driver.documents.circulationCardUrl },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Revisión de Solicitud</DialogTitle>
          <DialogDescription>
            Revisa los detalles y documentos del aspirante para tomar una decisión.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Nombre:</strong> {driver.personalInfo.fullName}</p>
                <p><strong>Email:</strong> {driver.personalInfo.email}</p>
                <p><strong>Teléfono:</strong> {driver.personalInfo.phone}</p>
                <p><strong>Dirección:</strong> {driver.personalInfo.address}</p>
                <p><strong>CURP:</strong> {driver.personalInfo.curp}</p>
                <p><strong>RFC:</strong> {driver.personalInfo.rfc}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Información del Vehículo</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                 <p><strong>Tipo:</strong> <Badge variant="outline">{driver.vehicleInfo.type}</Badge></p>
                 <p><strong>Marca/Modelo:</strong> {driver.vehicleInfo.brand}</p>
                 <p><strong>Placa:</strong> {driver.vehicleInfo.plate}</p>
              </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Documentos</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {documentLinks.map(doc => (
                        <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="w-full" disabled={!doc.url}>
                                {doc.label}
                                <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                        </a>
                    ))}
                </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <X className="mr-2 h-4 w-4" /> Rechazar
          </Button>
          <Button onClick={() => handleAction('approve')} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-2 h-4 w-4" /> Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
