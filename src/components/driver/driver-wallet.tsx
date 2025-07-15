'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Driver, Transaction } from '@/lib/types';
import { toDate } from 'date-fns';

export function DriverWallet() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error('No estás autenticado.');
        }

        // Fetch driver document using email as ID
        const driverDocRef = doc(db, 'drivers', currentUser.email);
        const driverDocSnap = await getDoc(driverDocRef);

        if (!driverDocSnap.exists()) {
          throw new Error('No se encontró el documento del repartidor.');
        }
        setDriver(driverDocSnap.data() as Driver);

        // Fetch transactions subcollection
        const transactionsQuery = query(
          collection(driverDocRef, 'transactions'),
          orderBy('date', 'desc')
        );
        const transactionsSnap = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(transactionsData);

      } catch (err: any) {
        console.error("Error fetching driver data:", err);
        setError('No se pudo cargar la información de la billetera.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverData();
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

  if (!driver) {
    return null;
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : toDate(timestamp);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const isDebt = driver.wallet.currentBalance < 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saldo Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${isDebt ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(driver.wallet.currentBalance)}
            </p>
            {isDebt && (
                <p className="text-sm text-destructive mt-2">
                    Has excedido tu límite de deuda.
                </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estatus BeFast Pro</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
             <Badge className="text-lg py-2 px-4">{driver.proStatus.level}</Badge>
             <p className="text-xl font-semibold">{driver.proStatus.points} puntos</p>
          </CardContent>
        </Card>
      </div>
      
       {isDebt && driver.operationalStatus === 'restricted_debt' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cuenta Restringida</AlertTitle>
          <AlertDescription>
            Tu cuenta ha sido restringida por deuda. Por favor, realiza un pago para continuar recibiendo pedidos.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No hay transacciones aún.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
