import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {/* Dialog content wrapper */}
      <div className="relative z-50 w-full max-w-lg my-8">{children}</div>
    </div>
  );
};

export const DialogContent = ({ className, children, onClose }) => (
  <div
    className={cn(
      'relative w-full rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95',
      className
    )}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
      >
        <X className="h-5 w-5 text-slate-500" />
      </button>
    )}
    {children}
  </div>
);

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
);

export const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold leading-none tracking-tight text-slate-900', className)} {...props} />
);

export const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-slate-500 mt-1', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2', className)} {...props} />
);
