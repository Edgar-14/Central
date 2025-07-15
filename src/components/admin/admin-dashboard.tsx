'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileClock, CircleDollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DashboardStats {
  pendingApplications: number;
  activeDrivers: number;
  totalBalance: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const driversRef = collection(db, 'drivers');

        const pendingQuery = query(driversRef, where('operationalStatus', '==', 'pending_validation'));
        const activeQuery = query(driversRef, where('operationalStatus', '==', 'active'));
        
        const [pendingSnapshot, activeSnapshot] = await Promise.all([
          getDocs(pendingQuery),
          getDocs(activeQuery),
        ]);

        // Note: Calculating total balance client-side like this is not scalable or secure.
        // This is a placeholder and should be done with a backend aggregation in a real app.
        const allDriversSnap = await getDocs(driversRef);
        const totalBalance = allDriversSnap.docs.reduce((acc, doc) => acc + (doc.data().wallet?.currentBalance || 0), 0);

        setStats({
          pendingApplications: pendingSnapshot.size,
          activeDrivers: activeSnapshot.size,
          totalBalance: totalBalance,
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError('No se pudo cargar la información del panel.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
          <FileClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.pendingApplications ?? 0}</div>
          <p className="text-xs text-muted-foreground">Esperando revisión</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repartidores Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeDrivers ?? 0}</div>
          <p className="text-xs text-muted-foreground">Actualmente en la flota</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Total (Global)</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(stats?.totalBalance ?? 0)}
          </div>
          <p className="text-xs text-muted-foreground">Suma de saldos de todos los repartidores</p>
        </CardContent>
      </Card>
    </div>
  );
}
