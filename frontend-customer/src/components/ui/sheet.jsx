import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sheet = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
        <div className="w-screen max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const SheetHeader = ({ className, children, onClose }) => (
  <div className={cn('flex items-center justify-between pb-4 border-b border-slate-100', className)}>
    <div>{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

export const SheetTitle = ({ className, children }) => (
  <h2 className={cn('text-lg font-bold text-slate-900', className)}>{children}</h2>
);
