'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Driver } from '@/lib/types';
import { summarizeDriverDocuments } from '@/ai/flows/summarize-driver-documents';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ApplicationReviewModalProps {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to convert image URL to data URI
async function toDataURL(url: string): Promise<string> {
    // This proxy might be needed in development to avoid CORS issues.
    // In production, configure CORS on your Cloud Storage bucket.
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch image ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


export function ApplicationReviewModal({ driver, isOpen, onClose }: ApplicationReviewModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsLoadingSummary(true);
    setSummary(null);
    setError(null);
    
    if (!driver.documents || Object.values(driver.documents).some(url => !url)) {
         setError('Faltan uno o más documentos. No se puede generar el resumen.');
         setIsLoadingSummary(false);
         return;
    }

    try {
      const [
        ineDataUri,
        licenseDataUri,
        insuranceDataUri,
        addressProofDataUri,
        taxIdDataUri,
        circulationCardDataUri,
      ] = await Promise.all([
        toDataURL(driver.documents.ineUrl),
        toDataURL(driver.documents.licenseUrl),
        toDataURL(driver.documents.insuranceUrl),
        toDataURL(driver.documents.addressProofUrl),
        toDataURL(driver.documents.taxIdUrl),
        toDataURL(driver.documents.circulationCardUrl),
      ]);

      const result = await summarizeDriverDocuments({
        ineDataUri,
        licenseDataUri,
        insuranceDataUri,
        addressProofDataUri,
        taxIdDataUri,
        circulationCardDataUri,
      });

      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to summarize documents:', error);
      const errorMessage = 'No se pudo generar el resumen. Es posible que una de las imágenes no sea accesible, el servicio de IA no esté disponible o haya un problema de CORS. Intenta abrir las imágenes manualmente para verificar.';
      setError(errorMessage);
      toast({
        title: 'Error de IA',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    const newStatus = action === 'approve' ? 'active' : 'rejected';
    const driverDocRef = doc(db, 'drivers', driver.uid);

    try {
      // In a production app, this logic should be in a secure Cloud Function
      // and would also handle setting custom claims and calling Shipday API.
      await updateDoc(driverDocRef, {
        operationalStatus: newStatus
      });

      toast({
        title: `Solicitud ${action === 'approve' ? 'Aprobada' : 'Rechazada'}`,
        description: `El repartidor ${driver.personalInfo.fullName} ha sido ${action === 'approve' ? 'activado' : 'rechazado'}.`,
      });
      onClose();
    } catch (err) {
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Revisión de Solicitud</DialogTitle>
          <DialogDescription>
            {driver.personalInfo.fullName} - {driver.personalInfo.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 overflow-y-auto flex-1 pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
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
          <div className="space-y-4">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Resumen con IA</CardTitle>
                <Button size="sm" onClick={handleSummarize} disabled={isLoadingSummary || isProcessing}>
                  {isLoadingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoadingSummary ? 'Generando...' : 'Analizar Documentos'}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 text-sm">
                {isLoadingSummary && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error al Analizar</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {summary ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{summary}</div>
                ) : (
                  !isLoadingSummary && !error && <p className="text-muted-foreground">Haz clic en "Analizar Documentos" para que la IA genere un resumen y detecte posibles problemas.</p>
                )}
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
