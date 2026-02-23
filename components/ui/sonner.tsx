"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import { useTheme } from "next-themes";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      duration={3000}
      {...props}
    />
  );
}
