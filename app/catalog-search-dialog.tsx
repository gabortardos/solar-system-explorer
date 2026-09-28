"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Command } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mobileSearchViewportStyle } from "./mobile-search-viewport";

function useMobileSearchPresentation() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}

/** App composition: provider filtering, an accessible title, and keyboard-safe sizing. */
export function CatalogSearchDialog({ open, onOpenChange, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode;
}) {
  const mobile = useMobileSearchPresentation();
  const [viewport, setViewport] = useState<CSSProperties>();
  useEffect(() => {
    if (!open || !mobile) return;
    const visual = window.visualViewport;
    const update = () => {
      setViewport(mobileSearchViewportStyle(visual ?? {
        height: window.innerHeight, offsetTop: 0,
      }) as CSSProperties);
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
  }, [mobile, open]);

  if (mobile) {
    return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="catalog-search-mobile-overlay" />
        <DialogPrimitive.Content className="catalog-search-mobile-sheet" style={viewport}>
          <header className="catalog-search-mobile-header">
            <div>
              <DialogPrimitive.Title className="catalog-search-mobile-title">Search the Solar System</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Search names, aliases, object types and parent context across the current catalogue.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="catalog-search-mobile-close" aria-label="Close search">
              <X aria-hidden="true" />
              <span>Close</span>
            </DialogPrimitive.Close>
          </header>
          <Command className="catalog-search-mobile-command" shouldFilter={false}>{children}</Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>;
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="catalog-search-dialog">
      <DialogHeader className="catalog-search-header">
        <DialogTitle>Search the Solar System</DialogTitle>
        <DialogDescription className="sr-only">Search names, aliases, object types and parent context across the current catalogue.</DialogDescription>
      </DialogHeader>
      <Command shouldFilter={false}>{children}</Command>
    </DialogContent>
  </Dialog>;
}
