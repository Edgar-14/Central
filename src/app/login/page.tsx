import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/shared/logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4"
         style={{
           backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/Fondo-Befast-1.jpg?alt=media')`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed'
         }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="glass-card">
          <CardHeader className="text-center">
             <div className="mb-4 flex justify-center">
                <Logo />
             </div>
            <CardTitle className="text-2xl">Bienvenido de Nuevo</CardTitle>
            <CardDescription>Ingresa a tu portal para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                Regístrate aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
