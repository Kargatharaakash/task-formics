"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  compact?: boolean;
  fullWidth?: boolean;
};

export function ThemeToggle({ compact, fullWidth }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size={fullWidth ? "default" : compact ? "icon" : "sm"}
        className={cn(fullWidth && "w-full", compact && fullWidth && "px-0")}
        disabled
      >
        <Sun className="h-4 w-4" />
        {!compact ? "Light Mode" : null}
      </Button>
    );
  }

  const activeTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = activeTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={fullWidth ? "default" : compact ? "icon" : "sm"}
      className={cn(fullWidth && "w-full", compact && fullWidth && "px-0")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!compact ? (isDark ? "Light Mode" : "Dark Mode") : null}
    </Button>
  );
}
