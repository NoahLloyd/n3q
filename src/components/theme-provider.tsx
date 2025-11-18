"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme | null;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark");
  if (theme === "dark") {
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("n3q-theme") as Theme | null;

    if (stored === "light" || stored === "dark") {
      applyThemeClass(stored);
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initial: Theme = prefersDark ? "dark" : "light";
    applyThemeClass(initial);
    setTheme(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  }, []);

  useEffect(() => {
    const handler = (event: MediaQueryListEvent) => {
      if (theme === null) {
        const next: Theme = event.matches ? "dark" : "light";
        applyThemeClass(next);
        setTheme(next);
      }
    };

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setTheme((prev) => {
          const next: Theme = prev === "dark" ? "light" : "dark";
          applyThemeClass(next);
          window.localStorage.setItem("n3q-theme", next);
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyThemeClass(next);
      window.localStorage.setItem("n3q-theme", next);
      return next;
    });
  }, []);

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center border border-border/60 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
      title="Toggle theme (⌘/Ctrl + J)"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
