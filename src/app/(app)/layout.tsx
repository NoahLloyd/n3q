import type { ReactNode } from "react";
import { AppLayoutClient } from "./app-layout-client";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
