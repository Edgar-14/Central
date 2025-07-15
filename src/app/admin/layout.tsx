'use client'
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    const pathname = usePathname()
    const [pendingApplications, setPendingApplications] = useState(0);

    useEffect(() => {
        const q = query(collection(db, "drivers"), where("operationalStatus", "==", "pending_validation"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setPendingApplications(querySnapshot.size);
        });
        return () => unsubscribe();
    }, []);


    const navItems = [
        { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
        { href: "/admin/applications", icon: ShoppingCart, label: "Solicitudes", badge: pendingApplications > 0 ? pendingApplications : undefined },
        { href: "/admin/drivers", icon: Package, label: "Repartidores" },
    ]

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Logo/>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {navItems.map(item => (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
                     >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{item.badge}</Badge>}
                     </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                    <SheetTitle className="self-start">
                        <Logo/>
                    </SheetTitle>
                </SheetHeader>
                <nav className="grid gap-2 text-lg font-medium">
                 {navItems.map(item => (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
                     >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{item.badge}</Badge>}
                     </Link>
                ))}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                <h1 className="text-xl font-semibold">
                    {navItems.find(item => item.href === pathname)?.label}
                </h1>
            </div>
            <ThemeToggle/>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }
  