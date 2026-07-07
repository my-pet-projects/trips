"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "~/app/_components/ui/button";
import { cn } from "~/lib/utils";

type SheetSide = "top" | "right" | "bottom" | "left";

const SIDE_CONFIG: Record<
  SheetSide,
  {
    swipeDirection: "up" | "down" | "left" | "right";
    viewport: string;
    popup: string;
  }
> = {
  top: {
    swipeDirection: "up",
    viewport: "inset-x-0 top-0 flex items-start justify-center",
    popup: "w-full rounded-b-2xl border-b",
  },
  bottom: {
    swipeDirection: "down",
    viewport: "inset-x-0 bottom-0 flex items-end justify-center",
    popup: "w-full rounded-t-2xl border border-b-0",
  },
  left: {
    swipeDirection: "left",
    viewport: "inset-y-0 left-0 flex items-stretch",
    popup: "h-full rounded-r-2xl border-r",
  },
  right: {
    swipeDirection: "right",
    viewport: "inset-y-0 right-0 flex items-stretch justify-end",
    popup: "h-full rounded-l-2xl border-l",
  },
};

function Sheet({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "bottom",
  showCloseButton = false,
  inset = false,
  showOverlay = true,
  container,
  ...props
}: DrawerPrimitive.Popup.Props & {
  side?: SheetSide;
  showCloseButton?: boolean;
  inset?: boolean;
  showOverlay?: boolean;
  container?: DrawerPrimitive.Portal.Props["container"];
}) {
  const config = SIDE_CONFIG[side];
  const viewportPositionClass =
    inset && container ? "absolute inset-0" : "fixed inset-0";

  return (
    <SheetPortal container={container}>
      {showOverlay && !inset ? <SheetOverlay /> : null}
      <DrawerPrimitive.Viewport
        className={cn(
          "pointer-events-none z-50 flex",
          viewportPositionClass,
          config.viewport,
        )}
      >
        <DrawerPrimitive.Popup
          data-slot="sheet-content"
          className={cn(
            "bg-background pointer-events-auto flex flex-col gap-4 border shadow-lg outline-none",
            config.popup,
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DrawerPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-4 right-4"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DrawerPrimitive.Close>
          ) : null}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
