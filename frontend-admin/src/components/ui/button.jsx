import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-forest to-forest-soft text-white shadow-btn-primary hover:-translate-y-px hover:from-forest-soft hover:to-[#1D7282]',
        destructive:
          'bg-status-bad text-white shadow-[0_8px_18px_-8px_rgba(181,71,58,0.7)] hover:-translate-y-px hover:bg-[#9c3b30]',
        outline:
          'border border-input bg-card text-foreground hover:border-forest hover:bg-sage-soft',
        secondary:
          'bg-terracotta text-white shadow-btn-accent hover:-translate-y-px hover:bg-terracotta-dark',
        ghost: 'font-semibold text-muted-foreground hover:bg-sage-soft hover:text-forest',
        link: 'font-semibold text-forest underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-9 px-4',
        lg: 'h-11 px-7 text-base',
        icon: 'h-9 w-9 rounded-[14px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';
