import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/shared/footer';
import { Logo } from '@/components/shared/logo';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function Home() {
  const benefits = [
    { 
      title: 'Tus Prestaciones por Ley', 
      description: 'Cuentas con IMSS, aguinaldo y vacaciones pagadas.' 
    },
    { 
      title: 'Tú Tienes el Control', 
      description: 'Elige cuándo y dónde trabajar, sin ninguna penalización.' 
    },
    { 
      title: 'Tus Ganancias Claras', 
      description: 'Recibes tu pago puntual y te quedas con todas tus propinas.' 
    },
    { 
      title: 'Un Contrato que te Respalda', 
      description: 'Tu trabajo está protegido con un contrato formal ante la ley.' 
    },
    { 
      title: 'Estamos para Ayudarte', 
      description: 'Un equipo de personas reales resuelve tus dudas y te da apoyo.' 
    },
    {
      title: 'Crece y Gana Más',
      description: 'Reconocemos tu esfuerzo con bonos, incentivos y oportunidades.'
    }
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

  const sliderImages = [
    { src: "https://i.ibb.co/bX1V4z7/IMG-9924.jpg", alt: "Driver on motorcycle", hint: "motorcycle delivery" },
    { src: "https://i.ibb.co/pPMrxYw/226-A1559.jpg", alt: "BeFast delivery driver", hint: "delivery person" },
    { src: "https://i.ibb.co/M50gJ3k/226-A1568.jpg", alt: "Restaurant interior", hint: "restaurant interior" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#benefits" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Beneficios</Link>
            <Link href="#requirements" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Requisitos</Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="secondary">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full overflow-hidden">
          <div className="absolute inset-0 z-0">
             <Image
              src="https://i.ibb.co/pPMrxYw/226-A1559.jpg"
              alt="BeFast delivery driver"
              layout="fill"
              objectFit="cover"
              className="opacity-20"
              data-ai-hint="delivery person"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/70 sm:text-7xl md:text-9xl">
                BeFast
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
                Sé tu propio jefe. Genera ingresos con horarios que tú decides.
              </p>
              <Button size="lg" className="mt-8 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-accent-foreground group" asChild>
                <Link href="/register">
                  Inicia tu Registro Ahora
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="benefits" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tus Beneficios con <span className="text-primary">BeFast</span></h2>
                <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
                Ser parte de BeFast es más que solo repartir. Te ofrecemos las herramientas y el soporte para que triunfes.
                </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="glass-card text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    <CheckCircle className="h-12 w-12 text-primary" />
                    <h3 className="mt-4 font-semibold text-lg">{benefit.title}</h3>
                    <p className="mt-2 text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="requirements" className="py-16 md:py-24 bg-muted/40">
           <div className="container mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <Carousel className="w-full h-96 lg:h-full rounded-2xl overflow-hidden group">
                      <CarouselContent>
                        {sliderImages.map((image, index) => (
                          <CarouselItem key={index}>
                            <div className="relative h-96 lg:h-full w-full">
                              <Image 
                                  src={image.src}
                                  alt={image.alt}
                                  layout="fill"
                                  objectFit="cover"
                                  className="transition-transform duration-500 hover:scale-110"
                                  data-ai-hint={image.hint}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Carousel>
                    <div>
                         <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Requisitos para Unirte</h2>
                         <p className="mt-4 text-muted-foreground">Asegúrate de tener todo lo necesario para empezar a generar ganancias con nosotros.</p>
                         <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {requirements.map((req) => (
                            <li key={req} className="flex items-start">
                              <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                    </div>
                </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
