'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Award, Wallet } from 'lucide-react';
import type { Driver, Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DriverWalletProps {
  driver: Driver;
  transactions: Transaction[];
}

export function DriverWallet({ driver, transactions }: DriverWalletProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const proLevelColors = {
    'Bronce': 'bg-orange-700',
    'Plata': 'bg-slate-400',
    'Oro': 'bg-yellow-500',
    'Diamante': 'bg-blue-300',
  }

  return (
    <div className="space-y-6">
      {driver.operationalStatus === 'restricted_debt' && (
         <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cuenta Restringida por Deuda</AlertTitle>
          <AlertDescription>
            Has superado tu límite de deuda. Por favor, liquida tu saldo para reactivar tu cuenta.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance Actual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(driver.wallet.currentBalance)}</div>
            <p className="text-xs text-muted-foreground">Actualizado al momento</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nivel Pro</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-bold flex items-center gap-2">
                <span className={cn("h-4 w-4 rounded-full", proLevelColors[driver.proStatus.level])}></span>
                {driver.proStatus.level}
            </div>
            <p className="text-xs text-muted-foreground">{driver.proStatus.points} puntos acumulados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Tus últimos movimientos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.description}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      ID Orden: {tx.orderId}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {format(new Date(tx.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {tx.type === 'credit_delivery' && <Badge variant="secondary" className="bg-green-100 text-green-800">Crédito</Badge>}
                    {tx.type === 'debit_commission' && <Badge variant="secondary" className="bg-red-100 text-red-800">Débito</Badge>}
                    {tx.type === 'payout' && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Retiro</Badge>}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                        {tx.amount > 0 ? <ArrowUpCircle className="h-4 w-4"/> : <ArrowDownCircle className="h-4 w-4"/>}
                        {formatCurrency(tx.amount)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
