import { RegistrationForm } from '@/components/auth/registration-form';
import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900 py-12 px-4"
         style={{
           backgroundImage: `url('https://i.ibb.co/bX1V4z7/IMG-9924.jpg')`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed'
         }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 container mx-auto max-w-4xl">
        <Card className="w-full glass-card">
          <CardHeader className="text-center">
             <div className="mb-4 flex justify-center">
                <Logo />
             </div>
            <CardTitle className="text-3xl font-bold">Registro de Repartidor</CardTitle>
            <CardDescription className="text-md">
              Completa los siguientes pasos para unirte a la flota de BeFast.
              <br />
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Inicia sesión
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
