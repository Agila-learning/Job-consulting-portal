"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  ...props
}) {
  return <TooltipPrimitive.Provider {...props} />;
}

function Tooltip({
  ...props
}) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({
  ...props
}) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipPortal({
  ...props
}) {
  return <TooltipPrimitive.Portal {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return (
    <TooltipPortal>
      <TooltipPrimitive.Popup
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground animate-in fade-in-0 mt-2 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 overflow-hidden rounded-md border px-3 py-1.5 text-xs shadow-md",
          className
        )}
        {...props} />
    </TooltipPortal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
