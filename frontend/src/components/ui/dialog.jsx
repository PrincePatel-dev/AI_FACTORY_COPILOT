import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {/* Content */}
      <div className="relative z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 p-6 text-slate-100 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 flex flex-col">
        {children}
        <button
          onClick={() => onOpenChange && onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none cursor-pointer text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
    {...props}
  />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-bold leading-none tracking-tight text-white flex items-center gap-2", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-slate-400", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogContent = ({ className, children, ...props }) => (
  <div className={cn("overflow-y-auto flex-1 pr-1", className)} {...props}>
    {children}
  </div>
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex items-center justify-between pt-4 mt-4 border-t border-slate-800",
      className
    )}
    {...props}
  />
);

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter };
