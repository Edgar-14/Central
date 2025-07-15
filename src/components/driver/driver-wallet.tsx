
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, ShieldCheck, Banknote, Gift } from 'lucide-react';
import type { Driver, Transaction, OperationalSettings } from '@/lib/types';
import { toDate } from 'date-fns';

export function DriverWallet() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<OperationalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverData = async (user: any) => {
      try {
        if (!user || !user.email) {
          throw new Error('No estás autenticado.');
        }

        const driverDocRef = doc(db, 'drivers', user.email);
        const driverDocSnap = await getDoc(driverDocRef);

        if (!driverDocSnap.exists()) {
          throw new Error('No se encontró el documento del repartidor.');
        }
        setDriver(driverDocSnap.data() as Driver);

        const transactionsQuery = query(collection(driverDocRef, 'transactions'), orderBy('date', 'desc'));
        const transactionsSnap = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        setTransactions(transactionsData);

      } catch (err: any) {
        console.error("Error fetching driver data:", err);
        setError('No se pudo cargar la información de la billetera.');
      }
    };

    const unsubscribeSettings = onSnapshot(doc(db, 'operationalSettings', 'global'), (doc) => {
        if(doc.exists()) {
            setSettings(doc.data() as OperationalSettings);
        }
    });

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDriverData(user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
        setError('Por favor, inicia sesión para ver tu billetera.');
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
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
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Encontrado</AlertTitle>
        <AlertDescription>No se pudo cargar la información del repartidor. Por favor, vuelve a iniciar sesión.</AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp.toDate ? timestamp.toDate() : toDate(timestamp);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isDebt = driver.wallet.currentBalance < 0;
  const activeIncentives = settings?.incentives?.filter(inc => inc.active);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Saldo Actual</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${isDebt ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(driver.wallet.currentBalance)}
            </p>
            {isDebt && <p className="text-sm text-destructive mt-2">Has excedido tu límite de deuda.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Límite de Deuda</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(driver.wallet.debtLimit)}</p>
            <p className="text-xs text-muted-foreground">Límite para pedidos en efectivo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estatus BeFast Pro</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Badge className="text-lg py-2 px-4">{driver.proStatus.level}</Badge>
            <p className="text-xl font-semibold">{driver.proStatus.points} pts</p>
          </CardContent>
        </Card>
      </div>

      {isDebt && driver.operationalStatus === 'restricted_debt' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cuenta Restringida</AlertTitle>
          <AlertDescription>Tu cuenta ha sido restringida por deuda. Por favor, realiza un pago para continuar recibiendo pedidos.</AlertDescription>
        </Alert>
      )}

      {activeIncentives && activeIncentives.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift className="text-primary"/>Incentivos y Bonos Activos</CardTitle>
                <CardDescription>¡Aprovecha estas oportunidades para ganar más!</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                    {activeIncentives.map(incentive => (
                        <li key={incentive.id}>
                            <span className="font-semibold">{incentive.description}:</span> <Badge variant="secondary">{formatCurrency(incentive.amount)}</Badge>
                        </li>
                    ))}
                    {settings?.rainFee.active && (
                         <li>
                            <span className="font-semibold">Tarifa por lluvia activa:</span> <Badge variant="secondary">{formatCurrency(settings.rainFee.amount)} extra por entrega</Badge>
                        </li>
                    )}
                </ul>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Historial de Transacciones</CardTitle></CardHeader>
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
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No hay transacciones aún.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
