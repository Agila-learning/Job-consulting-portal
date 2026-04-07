import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext({
  open: false,
  setOpen: () => {},
  triggerRef: null
});

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const triggerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left" ref={containerRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, asChild, ...props }) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  
  if (asChild) {
    return React.cloneElement(children, {
      ...props,
      ref: triggerRef,
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(!open);
      }
    });
  }
  return <button ref={triggerRef} onClick={() => setOpen(!open)} {...props}>{children}</button>;
};

const DropdownMenuPortal = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const DropdownMenuContent = ({ className, children, align = "end", sideOffset = 8, ...props }) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + sideOffset,
        left: align === "end" ? rect.right + window.scrollX : rect.left + window.scrollX
      });
    }
  }, [open, align, sideOffset, triggerRef]);
  
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed z-[150] min-w-[8rem] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 mt-2",
        className
      )}
      style={{
        top: coords.top,
        left: coords.left,
        transform: align === "end" ? "translateX(-100%)" : "none"
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ className, onClick, ...props }) => {
  const { setOpen } = React.useContext(DropdownMenuContext);
  
  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
};

const DropdownMenuLabel = ({ className, ...props }) => (
  <div className={cn("px-2 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground", className)} {...props} />
);

const DropdownMenuSeparator = ({ className, ...props }) => (
  <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
);

export { DropdownMenu };
export { DropdownMenuTrigger };
export { DropdownMenuContent };
export { DropdownMenuItem };
export { DropdownMenuLabel };
export { DropdownMenuSeparator };
export { DropdownMenuPortal };
