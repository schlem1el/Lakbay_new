import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

export const Tabs = ({ defaultValue, value, onValueChange, className, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const current = value !== undefined ? value : activeTab;
  const changeTab = onValueChange || setActiveTab;

  return (
    <TabsContext.Provider value={{ current, changeTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, children }) => (
  <div
    role="tablist"
    className={cn(
      'inline-flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 text-muted-foreground',
      className
    )}
  >
    {children}
  </div>
);

export const TabsTrigger = ({ value, className, children }) => {
  const { current, changeTab } = useContext(TabsContext);
  const isActive = current === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => changeTab(value)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer',
        isActive ? 'bg-forest text-white' : 'hover:bg-sage-soft hover:text-forest',
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className, children }) => {
  const { current } = useContext(TabsContext);
  if (current !== value) return null;

  return (
    <div role="tabpanel" className={cn('mt-4 focus-visible:outline-none', className)}>
      {children}
    </div>
  );
};
