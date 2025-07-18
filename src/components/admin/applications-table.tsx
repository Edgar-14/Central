
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Driver } from '@/lib/types';
import { ApplicationReviewModal } from './application-review-modal';
import { format, toDate } from 'date-fns';
import { es } from 'date-fns/locale';

interface ApplicationsTableProps {
  applications: Driver[];
  onApplicationUpdate: () => void;
}

export function ApplicationsTable({ applications, onApplicationUpdate }: ApplicationsTableProps) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const handleReview = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const handleCloseModal = () => {
    setSelectedDriver(null);
  };

  if (applications.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No hay solicitudes pendientes por revisar.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Correo</TableHead>
            <TableHead className="hidden lg:table-cell">Fecha de Solicitud</TableHead>
            <TableHead className="hidden md:table-cell">Vehículo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((driver) => (
            <TableRow key={driver.email}>
              <TableCell className="font-medium">{driver.fullName}</TableCell>
              <TableCell className="hidden md:table-cell">{driver.email}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {driver.applicationSubmittedAt ? format(toDate(driver.applicationSubmittedAt.seconds * 1000), "d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{driver.vehicleInfo?.type || 'No especificado'}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => handleReview(driver)}>
                  Revisar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedDriver && (
        <ApplicationReviewModal
          driver={selectedDriver}
          isOpen={!!selectedDriver}
          onClose={handleCloseModal}
          onApplicationUpdate={onApplicationUpdate}
        />
      )}
    </>
  );
}
