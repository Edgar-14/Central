
'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Driver } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, ExternalLink } from 'lucide-react';

interface ApplicationReviewModalProps {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
  onApplicationUpdate: () => void; // Callback to refresh the list
}

const functions = getFunctions();
const approveApplication = httpsCallable(functions, 'approveapplication');
const rejectApplication = httpsCallable(functions, 'rejectapplication');

export function ApplicationReviewModal({ driver, isOpen, onClose, onApplicationUpdate }: ApplicationReviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    
    try {
      const driverEmail = driver.email; 
      if (!driverEmail) {
          throw new Error("El email del repartidor no está disponible.");
      }

      if (action === 'approve') {
        await approveApplication({ email: driverEmail });
      } else {
        // This function does not exist in the provided functions code, but we assume it would work this way
        // Let's create a placeholder for it
        // await rejectApplication({ email: driverEmail });
        toast({
            title: "Función no implementada",
            description: "La función para rechazar aún no está conectada.",
            variant: "destructive"
        });
        // For now, just log and close
        console.log(`Action 'reject' for ${driverEmail}`);
      }

      toast({
        title: `Solicitud ${action === 'approve' ? 'Aprobada' : 'Procesada'}`,
        description: `El repartidor ${driver.fullName} ha sido ${action === 'approve' ? 'activado' : 'marcado para rechazo'}.`,
      });
      
      onApplicationUpdate(); // Refresh the list in the parent component
      onClose(); // Close the modal

    } catch (err: any) {
      console.error(`Failed to ${action} application:`, err);
      toast({
        title: 'Error',
        description: `No se pudo ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud. ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const documentLinks = Object.entries(driver.documents || {}).map(([key, url]) => ({
      label: key.replace('Url', ''),
      url: url as string
  }));

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
                <p><strong>Nombre:</strong> {driver.fullName}</p>
                <p><strong>Email:</strong> {driver.email}</p>
                <p><strong>Teléfono:</strong> {driver.phone}</p>
                {driver.personalInfo && (
                  <>
                    <p><strong>Dirección:</strong> {driver.personalInfo.address}</p>
                    <p><strong>CURP:</strong> {driver.personalInfo.curp}</p>
                    <p><strong>RFC:</strong> {driver.personalInfo.rfc}</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Documentos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {documentLinks.map(doc => (
                      <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full capitalize" disabled={!doc.url}>
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
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Rechazar
          </Button>
          <Button onClick={() => handleAction('approve')} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Aprobar y Crear en Shipday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
