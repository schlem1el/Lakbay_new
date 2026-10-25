import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-[#9AA3A0] file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-[#B9B8AE] focus-visible:border-forest focus-visible:shadow-[0_0_0_1px_#0A2E36] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-sand-head disabled:text-muted-foreground',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';
