import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, ExternalLink } from 'lucide-react';

const supportContacts = [
  {
    title: 'Soporte Urgente (En Pedido)',
    description: 'Para problemas que afecten una entrega en curso.',
    icon: Phone,
    contact: '312 190 5494',
    action: 'tel:',
    cta: 'Llamar Ahora',
  },
  {
    title: 'Soporte para Repartidores',
    description: 'Dudas sobre tu cuenta, pagos o app.',
    icon: MessageSquare,
    contact: '312 213 7033',
    action: 'https://wa.me/',
    cta: 'Enviar WhatsApp',
  },
  {
    title: 'Correo General',
    description: 'Para temas no urgentes o seguimiento.',
    icon: Mail,
    contact: 'soporte@befastapp.com.mx',
    action: 'mailto:',
    cta: 'Enviar Correo',
  },
];

export default function DriverSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Soporte</h1>
        <p className="text-muted-foreground">
          Estamos aquí para ayudarte. Contacta al equipo de BeFast.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportContacts.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="p-3 bg-primary/10 rounded-full">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="mt-1">{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <a 
                href={`${item.action}${item.contact.replace(/\s/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full">
                  {item.cta}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>
                Encuentra respuestas rápidas a las dudas más comunes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground py-8">
                (Sección de Preguntas Frecuentes en construcción)
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
