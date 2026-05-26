"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
