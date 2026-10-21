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
    className={cn(
      'inline-flex h-11 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500',
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
      onClick={() => changeTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none cursor-pointer',
        isActive
          ? 'bg-white text-slate-950 shadow-sm font-semibold'
          : 'hover:text-slate-900',
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
    <div className={cn('mt-2 ring-offset-white focus-visible:outline-none', className)}>
      {children}
    </div>
  );
};
