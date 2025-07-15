
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, User, LifeBuoy, Wallet, Menu, LogOut, Shield } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from '@/components/shared/theme-toggle';

const navItems = [
  { href: '/driver/dashboard', icon: Wallet, label: 'Mi Billetera' },
  { href: '/driver/profile', icon: User, label: 'Mi Perfil' },
  { href: '/driver/support', icon: LifeBuoy, label: 'Soporte' },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
          </div>
          <nav className="flex-1 overflow-auto py-4 px-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                  pathname.startsWith(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Link
                href="/admin/applications"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Shield className="h-4 w-4" />
                Portal Admin
            </Link>
          </nav>
           <div className="mt-auto p-4">
             <Link
                href="/login"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Link>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Logo />
                 {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-4 rounded-xl px-3 py-2 transition-all hover:text-primary ${
                      pathname.startsWith(item.href) ? 'bg-muted text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 <Link
                    href="/admin/applications"
                    className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <Shield className="h-5 w-5" />
                    Portal Admin
                </Link>
              </nav>
              <div className="mt-auto">
                 <Link
                    href="/login"
                    className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                  </Link>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/driver/profile">Perfil</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/driver/support">Soporte</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/login">Cerrar Sesión</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
