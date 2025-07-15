
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash, PlusCircle, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const functions = getFunctions();
const updateOperationalSettings = httpsCallable(functions, 'updateOperationalSettings');

const incentiveSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'La descripción es requerida.'),
  amount: z.preprocess(val => Number(val), z.number().min(0, 'El monto no puede ser negativo.')),
  active: z.boolean(),
});

const settingsSchema = z.object({
  baseCommission: z.preprocess(val => Number(val), z.number().min(0, 'La comisión no puede ser negativa.')),
  rainFee: z.object({
    active: z.boolean(),
    amount: z.preprocess(val => Number(val), z.number().min(0, 'La tarifa no puede ser negativa.')),
  }),
  incentives: z.array(incentiveSchema),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function OperationalSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      baseCommission: 15,
      rainFee: { active: false, amount: 0 },
      incentives: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'incentives',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'operationalSettings', 'global'));
        if (settingsDoc.exists()) {
          form.reset(settingsDoc.data() as SettingsFormData);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los ajustes operativos.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [form, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      await updateOperationalSettings(data);
      toast({
        title: 'Ajustes Guardados',
        description: 'La configuración operativa ha sido actualizada.',
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: 'Error al Guardar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !form.formState.isDirty) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Tarifas y Comisiones</CardTitle>
            <CardDescription>Ajusta los valores financieros base de la operación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="baseCommission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comisión Base por Pedido en Efectivo (MXN)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Tarifa por Lluvia</h3>
                 <FormField
                  control={form.control}
                  name="rainFee.active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Activar Tarifa por Lluvia</FormLabel>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="rainFee.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Extra por Lluvia (MXN)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incentivos y Bonos</CardTitle>
            <CardDescription>Crea y gestiona bonificaciones para los repartidores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                    <Trash className="h-4 w-4" />
                </Button>
                <FormField
                  control={form.control}
                  name={`incentives.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Incentivo</FormLabel>
                      <FormControl><Input placeholder="Ej: Bono por 10 entregas" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`incentives.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Incentivo (MXN)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`incentives.${index}.active`}
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel>Activo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => append({ id: `new_${Date.now()}`, description: '', amount: 0, active: true })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Incentivo
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Ajustes
        </Button>
      </form>
    </Form>
  );
}
