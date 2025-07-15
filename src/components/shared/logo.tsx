import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="https://i.ibb.co/fG4j8VPM/BE-FAST-2024-Mesa-de-trabajo-1.png"
        alt="BeFast Logo"
        width={36}
        height={36}
        className="rounded-lg"
      />
    </Link>
  );
}
