import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/shared/footer';
import { Logo } from '@/components/shared/logo';

export default function Home() {
  const benefits = [
    'Control total sobre tus ganancias',
    'Horarios flexibles que se adaptan a ti',
    'Soporte y comunidad de repartidores',
    'Oportunidades de crecimiento y recompensas',
  ];

  const requirements = [
    'Ser mayor de 18 años',
    'Vehículo propio (moto o auto)',
    'INE/Pasaporte vigente',
    'Licencia de conducir vigente',
    'Comprobante de domicilio',
    'Constancia de Situación Fiscal (CSF)',
    'Tarjeta de circulación',
    'Póliza de seguro vehicular con cobertura comercial',
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">Beneficios</Link>
            <Link href="#requirements" className="text-sm font-medium hover:text-primary transition-colors">Requisitos</Link>
          </nav>
          <Button asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[70vh] w-full">
          <Image
            src="https://i.ibb.co/GQ09Wf7/226A1559.jpg"
            alt="BeFast delivery driver"
            layout="fill"
            objectFit="cover"
            className="z-0"
            data-ai-hint="delivery person"
          />
          <div className="relative z-10 flex h-full items-center justify-center bg-black/50">
            <div className="container mx-auto px-4 text-center text-white">
              <h1 className="text-8xl font-extrabold tracking-tighter md:text-9xl">
                BeFast
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl">
                Sé tu propio jefe. Genera ingresos con horarios que tú decides.
              </p>
              <Button size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link href="/register">
                  Inicia tu Registro Aquí
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="benefits" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center">Tus Beneficios con BeFast</h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-muted-foreground">
              Ser parte de BeFast es más que solo repartir. Te ofrecemos las herramientas y el soporte para que triunfes.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <Card key={benefit} className="glass-card text-center">
                  <CardContent className="p-6">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                    <p className="mt-4 font-semibold">{benefit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="requirements" className="bg-white/50 dark:bg-black/20 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">Requisitos para Unirte</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {requirements.map((req) => (
                    <li key={req} className="flex items-start">
                      <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
