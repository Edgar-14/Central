'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Driver } from '@/lib/types';
import { ApplicationReviewModal } from './application-review-modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ApplicationsTableProps {
  applications: Driver[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
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
            <TableRow key={driver.uid}>
              <TableCell className="font-medium">{driver.personalInfo.fullName}</TableCell>
              <TableCell className="hidden md:table-cell">{driver.personalInfo.email}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {driver.legal.signatureTimestamp ? format(new Date(driver.legal.signatureTimestamp), "d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{driver.vehicleInfo.type}</Badge>
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
        />
      )}
    </>
  );
}
