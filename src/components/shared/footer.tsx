import { Facebook, Instagram, Mail, Phone, Globe } from 'lucide-react';
import { Logo } from './logo';

export function Footer() {
  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/befastmarket1/' },
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/befastmarket/' },
  ];

  const contactInfo = {
    phones: [
      { label: 'Soporte Técnico y Pedidos', number: '312 190 5494' },
      { label: 'Repartidores', number: '312 213 7033' },
    ],
    emails: [
      { label: 'Soporte General', address: 'soporte@befastapp.com.mx' },
    ],
    websites: [
        { label: 'BeFast Market', url: 'befastmarket.com' },
        { label: 'BeFast Delivery', url: 'befastapp.com' },
    ]
  };

  return (
    <footer className="bg-card/60 backdrop-blur-lg border-t mt-auto">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              La plataforma para la gestión de nuestra flota de repartidores.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map(({ name, icon: Icon, href }) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                  <Icon className="h-6 w-6" />
                  <span className="sr-only">{name}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:col-span-3 gap-8">
            <div>
              <h3 className="font-semibold text-foreground">Teléfonos</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {contactInfo.phones.map(({ label, number }) => (
                  <li key={number}>
                    <a href={`tel:${number.replace(/\s/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{label}: {number}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Correos Electrónicos</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {contactInfo.emails.map(({ label, address }) => (
                  <li key={address}>
                    <a href={`mailto:${address}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>{label}: {address}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sitios Web</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {contactInfo.websites.map(({ label, url }) => (
                  <li key={url}>
                     <a href={`https://${url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                      <Globe className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BeFast. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
