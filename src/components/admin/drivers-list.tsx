
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Ban, UserX, AlertTriangle, Eye, CreditCard } from 'lucide-react';
import type { Driver } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PayoutModal } from './payout-modal';

const functions = getFunctions();
const suspendDriver = httpsCallable(functions, 'suspenddriver');
const restrictDriver = httpsCallable(functions, 'restrictdriver');

export function DriversList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payoutDriver, setPayoutDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  const fetchActiveDrivers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const driversQuery = query(
          collection(db, 'drivers'),
          where('applicationStatus', '==', 'approved')
        );
        
        const unsubscribe = onSnapshot(driversQuery, (querySnapshot) => {
          const activeDrivers = querySnapshot.docs.map(doc => doc.data() as Driver);
          setDrivers(activeDrivers);
          setIsLoading(false);
        }, (err) => {
           console.error("Error fetching active drivers:", err);
           setError('No se pudo cargar la lista de repartidores.');
           setIsLoading(false);
        });

        return () => unsubscribe();

      } catch (err) {
        console.error("Error setting up driver fetch:", err);
        setError('No se pudo inicializar la carga de repartidores.');
        setIsLoading(false);
      }
    };

  useEffect(() => {
    const unsubPromise = fetchActiveDrivers();
    return () => {
        unsubPromise.then(unsub => unsub && unsub());
    };
  }, []);
  
  const handleDriverAction = async (action: 'suspend' | 'restrict', driverId: string, driverName: string) => {
    setIsProcessing(driverId);
    try {
        if (action === 'suspend') {
            await suspendDriver({ driverId }); // driverId is the email
        } else {
            await restrictDriver({ driverId }); // driverId is the email
        }
        toast({
            title: 'Acción completada',
            description: `${driverName} ha sido ${action === 'suspend' ? 'suspendido' : 'restringido'}.`,
        });
        // No need to call fetchActiveDrivers, onSnapshot will handle it.
    } catch (err: any) {
        toast({
            title: 'Error',
            description: `No se pudo completar la acción para ${driverName}. ${err.message}`,
            variant: 'destructive'
        });
    } finally {
        setIsProcessing(null);
    }
  }

  const refreshList = () => {
      fetchActiveDrivers();
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Repartidores Activos</CardTitle>
        <CardDescription>Lista de todos los repartidores aprobados en la plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
       {isLoading && <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
       {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
       {!isLoading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estatus Operativo</TableHead>
              <TableHead className="text-right">Saldo en Billetera</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <TableRow key={driver.email}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/drivers/${encodeURIComponent(driver.email)}`} className="hover:underline">
                      {driver.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{driver.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                        driver.operationalStatus === 'active' ? 'default' 
                        : driver.operationalStatus === 'suspended' ? 'secondary' 
                        : 'destructive'
                    } className="capitalize">
                        {driver.operationalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${driver.wallet.currentBalance < 0 ? 'text-destructive' : ''}`}>
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(driver.wallet.currentBalance)}
                  </TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isProcessing === driver.email}>
                                {isProcessing === driver.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/drivers/${encodeURIComponent(driver.email)}`}><Eye className="mr-2 h-4 w-4" />Ver Detalles</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPayoutDriver(driver)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Registrar Pago
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDriverAction('restrict', driver.email, driver.fullName)}>
                                <Ban className="mr-2 h-4 w-4" />
                                Restringir por Deuda
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDriverAction('suspend', driver.email, driver.fullName)} className="text-destructive focus:text-destructive">
                                <UserX className="mr-2 h-4 w-4" />
                                Suspender Cuenta
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                   </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No hay repartidores activos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
       )}
      </CardContent>
    </Card>

    {payoutDriver && (
        <PayoutModal 
            driver={payoutDriver}
            isOpen={!!payoutDriver}
            onClose={() => setPayoutDriver(null)}
            onPayoutSuccess={refreshList}
        />
    )}
    </>
  );
}
