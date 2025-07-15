
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { DriverWallet } from '@/components/driver/driver-wallet';
import type { Driver, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react';

export default function DriverDashboardPage() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch driver data
          const driverDocRef = doc(db, 'drivers', user.uid);
          const driverSnap = await getDoc(driverDocRef);

          if (driverSnap.exists()) {
            setDriver({ uid: driverSnap.id, ...driverSnap.data() } as Driver);
          } else {
            setError('No se encontró el perfil del repartidor.');
          }

          // Fetch transactions
          const transactionsQuery = query(
            collection(db, 'drivers', user.uid, 'transactions'),
            orderBy('date', 'desc')
          );
          const transactionsSnap = await getDocs(transactionsQuery);
          const transactionsData = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
          setTransactions(transactionsData);

        } catch (err) {
          console.error("Error fetching driver data:", err);
          setError('No se pudo cargar la información del repartidor.');
        } finally {
          setLoading(false);
        }
      } else {
        // User is signed out
        setLoading(false);
        setError('Por favor, inicia sesión para ver tu billetera.');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Billetera</h1>
        <p className="text-muted-foreground">Consulta tu balance, historial de transacciones y nivel Pro.</p>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && !loading && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && driver && (
        <DriverWallet driver={driver} transactions={transactions} />
      )}
    </div>
  );
}
