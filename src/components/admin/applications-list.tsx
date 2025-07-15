'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Driver } from '@/lib/types';
import { ApplicationsTable } from './applications-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react';

export function ApplicationsList() {
  const [applications, setApplications] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'drivers'), where('operationalStatus', '==', 'pending_validation'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const apps: Driver[] = [];
      querySnapshot.forEach((doc) => {
        apps.push({ uid: doc.id, ...doc.data() } as Driver);
      });
      setApplications(apps);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching applications: ", err);
      setError("No se pudieron cargar las solicitudes. Revisa tu conexión y la configuración de Firestore.");
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Nuevas Solicitudes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
           <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al Cargar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <ApplicationsTable applications={applications} />
        )}
      </CardContent>
    </Card>
  );
}
