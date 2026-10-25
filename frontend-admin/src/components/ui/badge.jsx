import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-[22px] w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-forest text-white',
        secondary: 'bg-[#EFEBE3] text-[#5d6460]',
        destructive: 'bg-[#F6E3E0] text-status-bad',
        outline: 'bg-transparent text-muted-foreground ring-1 ring-inset ring-input',
        success: 'bg-[#E1F0E8] text-status-ok',
        warning: 'bg-[#F7ECD6] text-status-warn',
        info: 'bg-sage-soft text-forest-soft ring-1 ring-inset ring-sage',
        purple: 'bg-violet-50 text-violet-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
