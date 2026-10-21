import React from 'react';
import { cn } from '../../lib/utils';

export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-xs font-semibold leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase tracking-wider', className)}
    {...props}
  />
));
Label.displayName = 'Label';
