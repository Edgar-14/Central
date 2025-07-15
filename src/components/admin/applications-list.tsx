'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ApplicationsTable } from './applications-table';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Driver } from '@/lib/types';

export function ApplicationsList() {
  const [applications, setApplications] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'drivers'),
        where('operationalStatus', '==', 'pending_validation')
      );
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map((doc) => doc.data() as Driver);
      setApplications(apps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
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

  return <ApplicationsTable applications={applications} onApplicationUpdate={fetchApplications} />;
}
