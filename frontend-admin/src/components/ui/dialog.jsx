import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-2xl my-8">{children}</div>
    </div>
  );
};

export const DialogContent = ({ className, children, onClose }) => (
  <div
    className={cn(
      'relative w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto',
      className
    )}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none hover:bg-slate-100 cursor-pointer"
      >
        <X className="h-5 w-5 text-slate-500" />
      </button>
    )}
    {children}
  </div>
);

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-left mb-6', className)} {...props} />
);

export const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn('text-xl font-bold leading-none tracking-tight text-slate-900 font-heading', className)} {...props} />
);

export const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-xs text-slate-500 mt-1 leading-relaxed', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-8 pt-4 border-t border-slate-100 gap-2', className)} {...props} />
);
