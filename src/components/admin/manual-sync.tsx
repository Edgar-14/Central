
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Zod schema for form validation
const formSchema = z.object({
  fullName: z.string().min(3, { message: 'El nombre completo es requerido.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  phone: z.string().min(10, { message: 'El teléfono debe tener al menos 10 dígitos.' }),
  shipdayId: z.string().min(1, { message: 'El ID de Rider de Shipday es requerido.' }),
});

type FormData = z.infer<typeof formSchema>;

export function ManualSync() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const db = getFirestore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      shipdayId: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const emailAsId = data.email.toLowerCase();
      const docRef = doc(db, 'drivers', emailAsId);

      await setDoc(docRef, {
        fullName: data.fullName,
        email: emailAsId,
        phone: data.phone,
        shipdayId: data.shipdayId,
        status: 'approved', // Existing drivers are considered approved
        applicationStatus: 'approved_manual_sync',
        createdAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Repartidor Guardado',
        description: `El repartidor ${data.fullName} ha sido guardado en la base de datos.`,
      });
      form.reset();

    } catch (error) {
      console.error('Error saving driver:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Ocurrió un error al intentar guardar el repartidor. Revisa la consola para más detalles.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo del Repartidor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Carlos Gonzalez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="ejemplo@correo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="5512345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shipdayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipday Rider ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduce el ID numérico de Shipday" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Guardando...' : 'Guardar Repartidor'}
        </Button>
      </form>
    </Form>
  );
}
