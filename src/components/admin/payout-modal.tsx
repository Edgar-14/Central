
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Driver } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface PayoutModalProps {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
  onPayoutSuccess: () => void;
}

const functions = getFunctions();
const recordPayout = httpsCallable(functions, 'recordPayout');

const formSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive({ message: 'El monto debe ser mayor a cero.' })
  ),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PayoutModal({ driver, isOpen, onClose, onPayoutSuccess }: PayoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: driver.wallet.currentBalance > 0 ? driver.wallet.currentBalance : 0,
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsProcessing(true);
    try {
      await recordPayout({ 
        driverEmail: driver.email, 
        amount: data.amount,
        notes: data.notes 
      });

      toast({
        title: 'Pago Registrado',
        description: `Se registró un pago de ${data.amount.toFixed(2)} a ${driver.fullName}.`,
      });
      onPayoutSuccess();
      onClose();

    } catch (err: any) {
      console.error('Failed to record payout:', err);
      toast({
        title: 'Error al Registrar el Pago',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pago a {driver.fullName}</DialogTitle>
          <DialogDescription>
            Introduce el monto de la liquidación. Esto creará una transacción de pago y ajustará el saldo del repartidor.
            <br />
            Saldo actual: <span className="font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(driver.wallet.currentBalance)}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Monto a Pagar (MXN)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notas / Referencia (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Ej: Liquidación semana 25, folio 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Registrar Pago
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
