import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/*
  Scroll lock shared by every open dialog.
  - A counter means two dialogs opening/closing in any order can't leave the page stuck.
  - The scrollbar's width is added back as padding so the page doesn't jump sideways.
*/
let openDialogCount = 0;
let savedBodyStyles = null;

const lockScroll = () => {
  if (openDialogCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedBodyStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  openDialogCount += 1;
};

const unlockScroll = () => {
  openDialogCount = Math.max(0, openDialogCount - 1);
  if (openDialogCount === 0 && savedBodyStyles) {
    document.body.style.overflow = savedBodyStyles.overflow;
    document.body.style.paddingRight = savedBodyStyles.paddingRight;
    savedBodyStyles = null;
  }
};

export const Dialog = ({ open, onOpenChange, children }) => {
  // Keep the latest handler without re-running the effect on every render
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return undefined;

    lockScroll();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onOpenChangeRef.current?.(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockScroll();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="admin-dialog-overlay fixed inset-0 z-[100]">
      {/* Backdrop is fixed, so it always covers the whole viewport */}
      <div className="fixed inset-0 bg-[#061D23]/75 backdrop-blur-sm" aria-hidden="true" />

      {/* Clicking anywhere outside the dialog panel closes it */}
      <div
        className="relative flex h-full items-center justify-center p-4 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChangeRef.current?.(false);
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/*
  The panel itself scrolls when its content is taller than the screen.
  When a footer is present the panel drops its bottom padding (has-[.dialog-footer])
  and the footer supplies it, so the footer always sits flush with the panel edge —
  even when it is nested inside a <form>.
  Header and footer stick to its top and bottom edges; their negative margins
  and matching padding stretch them across the panel's padding so content
  never shows through around them while scrolling.
*/
export const DialogContent = ({ className, children, onClose }) => (
  <div
    role="dialog"
    aria-modal="true"
    className={cn(
      'admin-dialog-content relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[20px] border border-border bg-card p-6 shadow-dialog sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl sm:p-7 has-[.dialog-footer]:pb-0 sm:has-[.dialog-footer]:pb-0',
      className
    )}
  >
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="absolute right-5 top-5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-[12px] text-muted-foreground transition-colors hover:bg-sage-soft hover:text-forest cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {children}
  </div>
);

export const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      'sticky -top-6 z-10 -mx-6 -mt-6 mb-6 flex flex-col gap-1.5 border-b border-border bg-card px-6 pb-5 pt-6 text-left sm:-top-7 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7',
      className
    )}
    {...props}
  />
);

export const DialogTitle = ({ className, ...props }) => (
  <h2
    className={cn(
      'font-heading text-[1.65rem] font-normal leading-tight tracking-normal text-foreground',
      className
    )}
    {...props}
  />
);

export const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      'dialog-footer sticky bottom-0 z-10 -mx-6 mt-7 flex flex-col-reverse gap-2 border-t border-border bg-card px-6 pb-6 pt-5 sm:-mx-7 sm:flex-row sm:justify-end sm:px-7 sm:pb-7',
      className
    )}
    {...props}
  />
);