import * as React from "react";
import { cn } from "../../lib/utils";

const Tabs = ({ value, onValueChange, className, children, ...props }) => {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeValue: value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ activeValue, onValueChange, className, children, ...props }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-start gap-1 rounded-xl bg-slate-900/90 p-1.5 border border-slate-800/80 shadow-inner",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isActive: child.props.value === activeValue,
            onClick: () => onValueChange && onValueChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ isActive, onClick, className, children, ...props }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer select-none",
        isActive
          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md shadow-cyan-500/20"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeValue, className, children, ...props }) => {
  if (value !== activeValue) return null;
  return (
    <div
      className={cn(
        "ring-offset-background focus-visible:outline-none animate-in fade-in-50 duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
