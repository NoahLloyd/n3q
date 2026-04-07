import type { ReactNode } from "react";
import { PublicLayoutClient } from "./public-layout-client";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicLayoutClient>{children}</PublicLayoutClient>;
}

