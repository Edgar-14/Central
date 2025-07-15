'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, FileText, Video, Award, Send } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const steps = [
  { id: 1, name: 'Cuenta y Datos Personales', icon: FileText },
  { id: 2, name: 'Carga de Documentos', icon: UploadCloud },
  { id: 3, name: 'Contratación y Acuerdos', icon: FileText },
  { id: 4, name: 'Capacitación', icon: Video },
  { id: 5, name: 'Envío Final', icon: Award },
];

const fileSchema = z.any().refine(file => file instanceof File, 'Se requiere un archivo.');

const formSchema = z.object({
  // Step 1
  email: z.string().email({ message: 'Correo inválido.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  confirmPassword: z.string(),
  fullName: z.string().min(3, { message: 'Nombre requerido.' }),
  phone: z.string().min(10, { message: 'Teléfono requerido.' }),
  curp: z.string().length(18, { message: 'El CURP debe tener 18 caracteres.' }),
  rfc: z.string().min(12, { message: 'El RFC debe tener al menos 12 caracteres.' }),
  nss: z.string().min(11, { message: 'El NSS debe tener 11 caracteres.' }),
  address: z.string().min(10, { message: 'Dirección requerida.' }),
  // Step 2
  ineUrl: fileSchema,
  licenseUrl: fileSchema,
  addressProofUrl: fileSchema,
  taxIdUrl: fileSchema,
  circulationCardUrl: fileSchema,
  insuranceUrl: fileSchema,
  // Step 3
  acceptContract: z.boolean().refine((val) => val === true, { message: 'Debes aceptar el contrato.' }),
  acceptSignature: z.boolean().refine((val) => val === true, { message: 'Debes aceptar la validez de la firma.' }),
  signatureName: z.string().min(3, { message: 'Firma con tu nombre completo.' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const documents = [
  { name: 'INE/Pasaporte', id: 'ineUrl' as const },
  { name: 'Licencia de Conducir', id: 'licenseUrl' as const },
  { name: 'Comprobante de Domicilio', id: 'addressProofUrl' as const },
  { name: 'Constancia de Situación Fiscal', id: 'taxIdUrl' as const },
  { name: 'Tarjeta de Circulación', id: 'circulationCardUrl' as const },
  { name: 'Póliza de Seguro Vehicular', id: 'insuranceUrl' as const },
];


export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
      curp: '',
      rfc: '',
      nss: '',
      address: '',
      acceptContract: false,
      acceptSignature: false,
      signatureName: '',
    },
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword', 'fullName', 'phone', 'curp', 'rfc', 'nss', 'address'];
    }
     if (currentStep === 2) {
      fieldsToValidate = documents.map(d => d.id);
    }
    if (currentStep === 3) {
      fieldsToValidate = ['acceptContract', 'acceptSignature', 'signatureName'];
    }

    const isValid = await methods.trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const onSubmit = async (data: FormData) => {
    if(currentStep !== 5) return; // Only submit on the last step
    setIsLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Update user profile
      await updateProfile(user, { displayName: data.fullName });
      
      // 3. Upload documents to Cloud Storage
      const documentUrls: { [key: string]: string } = {};
      for (const doc of documents) {
          const file = data[doc.id];
          if (file instanceof File) {
            const path = `drivers/${user.uid}/${doc.id}_${file.name}`;
            documentUrls[doc.id] = await uploadFile(file, path);
          }
      }

      // 4. Create initial driver document in Firestore
      const driverDocRef = doc(db, 'drivers', user.uid);
      await setDoc(driverDocRef, {
        uid: user.uid,
        personalInfo: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          curp: data.curp,
          rfc: data.rfc,
          nss: data.nss,
        },
        vehicleInfo: { type: "Motocicleta", brand: "", plate: "" }, // Placeholder
        legal: {
            contractVersion: "v1.2",
            signatureTimestamp: Date.now(),
            ipAddress: "NA" // Should capture user IP in a real app
        },
        documents: documentUrls,
        wallet: { currentBalance: 0, debtLimit: -500 },
        proStatus: { level: "Bronce", points: 0 },
        operationalStatus: 'pending_validation',
        shipdayId: null,
      });

      toast({
        title: '¡Solicitud Enviada!',
        description: 'Hemos recibido tu solicitud. Nuestro equipo la revisará y te contactará pronto.',
        variant: 'default',
      });
      router.push('/login');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description: error.code === 'auth/email-already-in-use' 
          ? 'Este correo electrónico ya está en uso.' 
          : 'Ocurrió un error. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        <div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4 grid grid-cols-5 gap-x-2 text-sm">
            {steps.map(step => (
              <div key={step.id} className="text-center">
                <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${step.id <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <p className={`mt-2 font-medium ${step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">1. Cuenta y Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="email" render={({ field }) => <FormItem><FormLabel>Correo</FormLabel><FormControl><Input placeholder="tu@correo.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="fullName" render={({ field }) => <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="password" render={({ field }) => <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="confirmPassword" render={({ field }) => <FormItem><FormLabel>Confirmar Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="phone" render={({ field }) => <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="3121234567" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="curp" render={({ field }) => <FormItem><FormLabel>CURP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField name="rfc" render={({ field }) => <FormItem><FormLabel>RFC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                 <FormField name="nss" render={({ field }) => <FormItem><FormLabel>NSS (IMSS)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField name="address" render={({ field }) => <FormItem><FormLabel>Dirección Completa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-semibold">2. Carga de Documentos</h3>
              <p className="text-muted-foreground mb-6">Sube cada documento en formato PDF o JPG. Esta función se conectará a Cloud Storage.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map(doc => (
                  <FormField
                    key={doc.id}
                    control={methods.control}
                    name={doc.id}
                    render={({ field: { onChange, value, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>{doc.name}</FormLabel>
                        <FormControl>
                           <Input 
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => onChange(e.target.files?.[0])}
                           />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">3. Contratación y Acuerdos Legales</h3>
              <Card>
                <CardContent className="p-4 max-h-60 overflow-y-auto border rounded-md">
                  <h4 className="font-bold">Contrato Individual de Trabajo</h4>
                  <p className="text-sm text-muted-foreground">Aquí se mostraría el contenido completo del PDF del contrato y sus anexos...</p>
                </CardContent>
              </Card>
              <FormField name="acceptContract" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>He leído, comprendido y acepto en su totalidad el Contrato Individual de Trabajo y sus cuatro anexos.</FormLabel><FormMessage /></div>
                </FormItem>
              )} />
              <FormField name="acceptSignature" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                   <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>Entiendo que esta aceptación digital tiene la misma validez legal que una firma autógrafa.</FormLabel><FormMessage /></div>
                </FormItem>
              )} />
              <FormField name="signatureName" render={({ field }) => (
                <FormItem><FormLabel>Escribe tu nombre completo como firma digital</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <h3 className="text-xl font-semibold">4. Capacitación Obligatoria</h3>
              <p className="text-muted-foreground">Completa los 5 módulos y aprueba el cuestionario para continuar.</p>
              <div className="p-8 border rounded-lg bg-muted/50">
                  <h4 className="text-2xl font-bold text-primary">Contenido de Capacitación</h4>
                  <p className="mt-2">Aquí se incrustarían videos, presentaciones y texto.</p>
              </div>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <a href="https://forms.google.com" target="_blank" rel="noopener noreferrer">
                  Ir al Cuestionario de Evaluación
                </a>
              </Button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <Award className="mx-auto h-24 w-24 text-primary" />
              <h3 className="text-2xl font-semibold">¡Ya casi terminas!</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Has completado todos los pasos. Revisa tu información si es necesario, o haz clic en "Enviar Solicitud" para finalizar tu postulación.
              </p>
              <Button type="submit" size="lg" disabled={isLoading} className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-accent-foreground">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Atrás
              </Button>
            )}
            <div className="flex-grow"></div>
            {currentStep < 5 ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
