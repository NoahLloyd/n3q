"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "@/lib/auth/context";
import { ThemeProvider } from "@/components/theme-provider";

const Web3Provider = dynamic(
  () => import("@/components/web3-provider").then((mod) => mod.Web3Provider),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </Web3Provider>
  );
}
