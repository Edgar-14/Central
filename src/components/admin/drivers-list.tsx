'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, ShieldCheck } from 'lucide-react';
import type { Driver } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DriversList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveDrivers = async () => {
      try {
        const driversQuery = query(
          collection(db, 'drivers'),
          where('operationalStatus', '==', 'active')
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

    fetchActiveDrivers();
  }, []);

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
              <TableHead>Estatus Pro</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <TableRow key={driver.uid}>
                  <TableCell className="font-medium">{driver.personalInfo.fullName}</TableCell>
                  <TableCell>{driver.personalInfo.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{driver.proStatus.level}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${driver.wallet.currentBalance < 0 ? 'text-destructive' : ''}`}>
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(driver.wallet.currentBalance)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No hay repartidores activos en este momento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
