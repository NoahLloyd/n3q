"use client";

import type { ReactNode } from "react";
import { Sidebar } from "../dashboard/sidebar";

interface PublicLayoutClientProps {
  children: ReactNode;
}

export function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isPublic />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}

