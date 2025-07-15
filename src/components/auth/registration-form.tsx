
'use client';

import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, FileText, Video, Award, Send, CheckCircle, Download, ExternalLink, Upload } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, storage } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const functions = getFunctions();
const submitApplication = httpsCallable(functions, 'submitapplication');

const steps = [
  { id: 1, name: 'Cuenta y Datos', icon: FileText },
  { id: 2, name: 'Documentos', icon: UploadCloud },
  { id: 3, name: 'Legal', icon: FileText },
  { id: 4, name: 'Capacitación', icon: Video },
  { id: 5, name: 'Envío', icon: Award },
];

const fileSchema = z.any().optional();

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
  // Step 4
  trainingEvidenceUrl: fileSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const documents: { name: string; id: keyof FormData }[] = [
    { name: 'INE/Pasaporte', id: 'ineUrl' },
    { name: 'Licencia de Conducir', id: 'licenseUrl' },
    { name: 'Comprobante de Domicilio', id: 'addressProofUrl' },
    { name: 'Constancia de Situación Fiscal', id: 'taxIdUrl' },
    { name: 'Tarjeta de Circulación', id: 'circulationCardUrl' },
    { name: 'Póliza de Seguro Vehicular', id: 'insuranceUrl' },
];

const trainingModules: {
    id: string;
    title: string;
    duration: string;
    type: 'video' | 'quiz' | 'upload';
    content?: string; // URL for video or quiz link
    fieldId?: keyof FormData; // Field ID for upload type
}[] = [
    { id: 'module1', title: 'Introducción a BeFast y Nuestra App', type: 'video', duration: '5 min', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { id: 'module2', title: 'Manejo de Pedidos y Tiempos de Entrega', type: 'video', duration: '10 min', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { id: 'module3', title: 'Protocolos de Seguridad y Emergencias', type: 'video', duration: '8 min', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { id: 'module4', title: 'Cuestionario de Evaluación Final', type: 'quiz', duration: '15 min', content: 'https://forms.gle/example' }, // Example link
    { id: 'module5', title: 'Evidencia: Foto de tu Mochila Térmica', type: 'upload', duration: '2 min', fieldId: 'trainingEvidenceUrl' },
];

const contractUrl = "https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media&token=e9e6a9a4-6b21-4d38-8e6e-21e3c83b8b05";
const annexLinks = {
    anexo1: "/#", // Placeholder for Política Financiera
    anexo2: "/#", // Placeholder for Protocolo de Revisión
    anexo3: "/#", // Placeholder for Beneficiarios
    anexo4: "/#", // Placeholder for Protocolo de Accidentes
}

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
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

  const allModulesCompleted = useMemo(() => {
    return trainingModules.every(module => {
        if (module.type === 'upload') {
            return !!methods.watch(module.fieldId as keyof FormData);
        }
        return completedModules.has(module.id);
    });
  }, [completedModules, methods.watch()]);

  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword', 'fullName', 'phone', 'curp', 'rfc', 'nss', 'address'];
    }
     if (currentStep === 2) {
      // Step 2 is now optional
    }
    if (currentStep === 3) {
      fieldsToValidate = ['acceptContract', 'acceptSignature', 'signatureName'];
    }

    const isValid = fieldsToValidate.length > 0 ? await methods.trigger(fieldsToValidate) : true;
    
    if (isValid) {
       if (currentStep === 4 && !allModulesCompleted) {
            toast({
                title: "Capacitación Incompleta",
                description: "Por favor, completa todas las tareas de capacitación para continuar.",
                variant: "destructive"
            });
            return;
       }
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
  
  const toggleModuleCompletion = (moduleId: string) => {
    setCompletedModules(prev => {
        const newSet = new Set(prev);
        if (newSet.has(moduleId)) {
            newSet.delete(moduleId);
        } else {
            newSet.add(moduleId);
        }
        return newSet;
    });
  }

  const uploadFile = async (file: File | undefined, path: string): Promise<string | undefined> => {
    if (!file) return undefined;
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
      const uid = user.uid;

      // 2. Update user profile
      await updateProfile(user, { displayName: data.fullName });
      
      // 3. Upload documents to Cloud Storage
      const documentUrls: { [key: string]: string } = {};
      const allDocsToUpload = [...documents, { name: 'Evidencia de Capacitación', id: 'trainingEvidenceUrl' }];
      for (const doc of allDocsToUpload) {
          const file = data[doc.id] as File | undefined;
          if (file) {
            const path = `drivers/${uid}/${doc.id}_${file.name}`;
            const url = await uploadFile(file, path);
            if (url) {
                documentUrls[doc.id] = url;
            }
          }
      }

      // 4. Call the submitApplication cloud function
      await submitApplication({
        personalInfo: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          curp: data.curp,
          rfc: data.rfc,
          nss: data.nss,
        },
        documents: documentUrls,
        legal: {
          contractVersion: "v1.2",
          signatureTimestamp: Date.now(),
          ipAddress: "NA" // Should capture user IP in a real app
        },
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
  
  const getModuleIcon = (type: 'video' | 'quiz' | 'upload') => {
    switch (type) {
        case 'video': return <Video className="h-5 w-5 mr-2" />;
        case 'quiz': return <ExternalLink className="h-5 w-5 mr-2" />;
        case 'upload': return <Upload className="h-5 w-5 mr-2" />;
    }
  }

  return (
    <FormProvider {...methods}>
      <Dialog open={!!selectedVideo} onOpenChange={(isOpen) => !isOpen && setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Módulo de Capacitación</DialogTitle>
            <DialogDescription>Completa el video para continuar.</DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="aspect-video">
                <iframe
                className="w-full h-full rounded-md"
                src={selectedVideo}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="space-y-8">
        <div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4 grid grid-cols-5 gap-x-2">
            {steps.map(step => (
              <div key={step.id} className="text-center">
                <div className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-full", step.id <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                  <step.icon className="h-5 w-5" />
                </div>
                <p className={cn("mt-2 font-medium text-xs hidden md:block", step.id <= currentStep ? 'text-primary' : 'text-muted-foreground')}>{step.name}</p>
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
              <p className="text-muted-foreground mb-6">Sube cada documento en formato PDF o JPG.</p>
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
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Contrato Individual de Trabajo</CardTitle>
                      <CardDescription>Revisa el contrato y sus anexos.</CardDescription>
                    </div>
                    <a href={contractUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Contrato en PDF
                      </Button>
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                   <div className="w-full h-64 border rounded-md p-4 overflow-y-auto text-xs bg-white dark:bg-gray-800 space-y-2">
                        <h4 className="font-bold text-center mb-2">CONTRATO INDIVIDUAL DE TRABAJO BAJO EL ESQUEMA DE PLATAFORMA DIGITAL</h4>
                        <p><strong>DECLARACIONES:</strong></p>
                        <p><strong>I.- "El Patrón":</strong> a) Que es una sociedad legalmente constituida... b) RFC [RFC DEL PATRÓN]... c) Domicilio en Boulevard Camino Real 1095 Interior 1, Colima...</p>
                        <p><strong>II.- "El Trabajador":</strong> a) Ser de nacionalidad mexicana, mayor de edad... b) Que su domicilio es correcto... c) Que cuenta con la capacidad y medios propios (vehículo, teléfono)... d) Que posee licencias y seguros vigentes...</p>
                        <p><strong>CLÁUSULAS:</strong></p>
                        <p><strong>PRIMERA.- OBJETO.</strong> Prestar servicios personales subordinados de repartidor mediante la plataforma BEFAST...</p>
                        <p><strong>SEGUNDA.- DURACIÓN.</strong> Contrato por tiempo indeterminado...</p>
                        <p><strong>TERCERA.- PERIODO DE PRUEBA.</strong> 30 días...</p>
                        <p><strong>SÉPTIMA.- BILLETERA DIGITAL.</strong> Todas las transacciones se gestionan aquí. Se autoriza el débito de comisión ($15.00 MXN) en pedidos de efectivo...</p>
                        <p><strong>VIGÉSIMA SEGUNDA (Aceptación Digital y Validez):</strong> "Las Partes" acuerdan y reconocen que la celebración del presente Contrato y sus Anexos se realiza por medios electrónicos...</p>
                        <p className="text-center font-bold mt-2">[El contenido completo se puede revisar en el PDF descargable]</p>
                  </div>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                    <CardTitle className="text-base">Anexos del Contrato</CardTitle>
                    <CardDescription className="text-sm">Estos documentos forman parte integral de tu contrato.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    <a href={annexLinks.anexo1} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="w-full"><Download className="mr-2 h-4 w-4" />Anexo 1: Política Financiera</Button></a>
                    <a href={annexLinks.anexo2} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="w-full"><Download className="mr-2 h-4 w-4" />Anexo 2: Protocolo de Revisión</Button></a>
                    <a href={annexLinks.anexo3} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="w-full"><Download className="mr-2 h-4 w-4" />Anexo 3: Beneficiarios</Button></a>
                    <a href={annexLinks.anexo4} target="_blank" rel="noopener noreferrer"><Button variant="secondary" className="w-full"><Download className="mr-2 h-4 w-4" />Anexo 4: Protocolo de Accidentes</Button></a>
                </CardContent>
               </Card>
              <FormField name="acceptContract" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>He leído, comprendido y acepto en su totalidad el Contrato Individual de Trabajo y sus anexos.</FormLabel><FormMessage /></div>
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
             <div className="space-y-6">
                <h3 className="text-xl font-semibold">4. Capacitación Obligatoria</h3>
                <p className="text-muted-foreground">Completa cada módulo para poder continuar.</p>
                <div className="space-y-3">
                    {trainingModules.map((module, index) => (
                        <Card key={module.id} className={cn("transition-all", (module.type !== 'upload' && completedModules.has(module.id)) || (module.type === 'upload' && !!methods.watch(module.fieldId as keyof FormData)) ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "")}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg", (module.type !== 'upload' && completedModules.has(module.id)) || (module.type === 'upload' && !!methods.watch(module.fieldId as keyof FormData)) ? "bg-green-600 text-white" : "bg-muted")}>
                                        {(module.type !== 'upload' && completedModules.has(module.id)) || (module.type === 'upload' && !!methods.watch(module.fieldId as keyof FormData)) ? <CheckCircle /> : index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{module.title}</p>
                                        <p className="text-sm text-muted-foreground">{module.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     {module.type === 'video' && (
                                        <>
                                            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedVideo(module.content!)}>{getModuleIcon(module.type)} Ver Módulo</Button>
                                            <Checkbox className="h-6 w-6" checked={completedModules.has(module.id)} onCheckedChange={() => toggleModuleCompletion(module.id)} />
                                        </>
                                    )}
                                    {module.type === 'quiz' && (
                                        <>
                                            <a href={module.content} target="_blank" rel="noopener noreferrer"><Button type="button" variant="secondary" size="sm">{getModuleIcon(module.type)} Iniciar Cuestionario</Button></a>
                                            <Checkbox className="h-6 w-6" checked={completedModules.has(module.id)} onCheckedChange={() => toggleModuleCompletion(module.id)} />
                                        </>
                                    )}
                                    {module.type === 'upload' && module.fieldId && (
                                        <FormField
                                            control={methods.control}
                                            name={module.fieldId}
                                            render={({ field: { onChange } }) => (
                                            <FormItem>
                                                <FormControl>
                                                <Button type="button" variant="secondary" size="sm" asChild>
                                                    <label className="cursor-pointer flex items-center">{getModuleIcon(module.type)} Subir Evidencia<Input type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0])} /></label>
                                                </Button>
                                                </FormControl>
                                            </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 {allModulesCompleted && (
                    <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="h-4 w-4 !text-green-600" />
                        <AlertTitle className="text-green-700 dark:text-green-400">¡Capacitación Completa!</AlertTitle>
                        <AlertDescription className="text-green-600 dark:text-green-500">
                            Has completado todos los módulos. Ya puedes pasar al último paso.
                        </AlertDescription>
                    </Alert>
                )}
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
