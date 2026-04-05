"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export default function DisplayLayout({ children }: { children: ReactNode }) {
  // Hide sidebar when on display page
  useEffect(() => {
    const sidebar = document.querySelector("aside");
    const main = document.querySelector("main");
    
    if (sidebar) {
      sidebar.style.display = "none";
    }
    if (main) {
      main.style.padding = "0";
      main.style.maxWidth = "100%";
      const innerDiv = main.querySelector("div");
      if (innerDiv) {
        innerDiv.style.maxWidth = "100%";
      }
    }

    return () => {
      if (sidebar) {
        sidebar.style.display = "";
      }
      if (main) {
        main.style.padding = "";
        main.style.maxWidth = "";
        const innerDiv = main.querySelector("div");
        if (innerDiv) {
          innerDiv.style.maxWidth = "";
        }
      }
    };
  }, []);

  return <>{children}</>;
}

