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
        src="https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/BE%20FAST%202024_Mesa%20de%20trabajo%201_200x200.png?alt=media&token=404533ea-401b-4395-9734-73c33256a066"
        alt="BeFast Logo"
        width={36}
        height={36}
        className="rounded-lg"
        style={{ width: "auto", height: "auto" }}
      />
    </Link>
  );
}
