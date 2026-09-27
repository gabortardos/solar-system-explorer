"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Command } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchViewportBounds } from "./search-viewport";

/** App composition: provider filtering, an accessible title, and keyboard-safe sizing. */
export function CatalogSearchDialog({ open, onOpenChange, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode;
}) {
  const [viewport, setViewport] = useState<CSSProperties>();
  useEffect(() => {
    if (!open) return;
    const visual = window.visualViewport;
    const update = () => {
      const bounds = searchViewportBounds(visual ?? {
        width: window.innerWidth, height: window.innerHeight, offsetLeft: 0, offsetTop: 0,
      });
      setViewport({
        "--search-left": `${bounds.left}px`, "--search-top": `${bounds.top}px`,
        "--search-width": `${bounds.width}px`, "--search-height": `${bounds.height}px`,
      } as CSSProperties);
    };
    const frame = requestAnimationFrame(update);
    visual?.addEventListener("resize", update);
    visual?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      visual?.removeEventListener("resize", update);
      visual?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="catalog-search-dialog" style={viewport}>
      <DialogHeader className="catalog-search-header">
        <DialogTitle>Search the Solar System</DialogTitle>
        <DialogDescription className="sr-only">Search names, aliases, object types and parent context across the current catalogue.</DialogDescription>
      </DialogHeader>
      <Command shouldFilter={false}>{children}</Command>
    </DialogContent>
  </Dialog>;
}
