"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/auth') {
        router.push('/auth');
      } else if (user && pathname === '/auth') {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  // Premium loading state matching modern UI
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0E17] text-foreground gap-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl logo-glow shadow-md animate-bounce">
            <span className="text-xl font-bold text-[#0A0E17]">I</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">IntelliSpend AI</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
        <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Securing your session...</span>
      </div>
    );
  }

  // Prevent flashing content during redirect
  if (!user && pathname !== '/auth') {
    return null;
  }

  if (user && pathname === '/auth') {
    return null;
  }

  return <>{children}</>;
}
