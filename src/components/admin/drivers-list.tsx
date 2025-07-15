'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, User, ShieldCheck, MoreVertical, Ban, UserX } from 'lucide-react';
import type { Driver } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const functions = getFunctions();
const suspendDriver = httpsCallable(functions, 'suspenddriver');
const restrictDriver = httpsCallable(functions, 'restrictdriver');

export function DriversList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchActiveDrivers = async () => {
      setIsLoading(true);
      try {
        const driversQuery = query(
          collection(db, 'drivers'),
          where('operationalStatus', 'in', ['active', 'restricted_debt', 'suspended'])
        );
        const querySnapshot = await getDocs(driversQuery);
        const activeDrivers = querySnapshot.docs.map(doc => doc.data() as Driver);
        setDrivers(activeDrivers);
      } catch (err) {
        console.error("Error fetching active drivers:", err);
        setError('No se pudo cargar la lista de repartidores.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchActiveDrivers();
  }, []);
  
  const handleDriverAction = async (action: 'suspend' | 'restrict', driverId: string, driverName: string) => {
    setIsProcessing(driverId);
    try {
        let response;
        if (action === 'suspend') {
            response = await suspendDriver({ driverId });
        } else {
            response = await restrictDriver({ driverId });
        }
        toast({
            title: 'Acción completada',
            description: `${driverName} ha sido ${action === 'suspend' ? 'suspendido' : 'restringido'}.`,
        });
        // Refresh list after action
        fetchActiveDrivers();
    } catch (err) {
        console.error(`Failed to ${action} driver:`, err);
        toast({
            title: 'Error',
            description: `No se pudo completar la acción para ${driverName}.`,
            variant: 'destructive'
        });
    } finally {
        setIsProcessing(null);
    }
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repartidores Activos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estatus Operativo</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <TableRow key={driver.uid}>
                  <TableCell className="font-medium">{driver.personalInfo.fullName}</TableCell>
                  <TableCell>{driver.personalInfo.email}</TableCell>
                  <TableCell>
                    <Badge variant={
                        driver.operationalStatus === 'active' ? 'default' 
                        : driver.operationalStatus === 'suspended' ? 'secondary' 
                        : 'destructive'
                    }>
                        {driver.operationalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${driver.wallet.currentBalance < 0 ? 'text-destructive' : ''}`}>
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(driver.wallet.currentBalance)}
                  </TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isProcessing === driver.uid}>
                                {isProcessing === driver.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleDriverAction('restrict', driver.uid, driver.personalInfo.fullName)}>
                                <Ban className="mr-2 h-4 w-4" />
                                Restringir por Deuda
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDriverAction('suspend', driver.uid, driver.personalInfo.fullName)} className="text-destructive">
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay repartidores para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
