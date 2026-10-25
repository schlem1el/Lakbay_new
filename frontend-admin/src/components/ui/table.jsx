import React from 'react';
import { cn } from '../../lib/utils';

const getTextContent = (node) => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (React.isValidElement(node)) return getTextContent(node.props.children);
  return '';
};

const mapRowCells = (children, labels) => {
  let column = 0;

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (child.type === TableCell) {
      const label = labels[column];
      column += Number(child.props.colSpan) || 1;
      return React.cloneElement(child, {
        'data-label': child.props['data-label'] || (child.props.colSpan ? undefined : label),
      });
    }

    if (child.type === React.Fragment) {
      return React.cloneElement(child, {
        children: mapRowCells(child.props.children, labels),
      });
    }

    return child;
  });
};

const addMobileLabels = (children, labels) =>
  React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (child.type === TableBody) {
      return React.cloneElement(child, {
        children: React.Children.map(child.props.children, (row) => {
          if (!React.isValidElement(row) || row.type !== TableRow) return row;
          return React.cloneElement(row, {
            children: mapRowCells(row.props.children, labels),
          });
        }),
      });
    }

    if (child.type === React.Fragment) {
      return React.cloneElement(child, {
        children: addMobileLabels(child.props.children, labels),
      });
    }

    return child;
  });

export const Table = React.forwardRef(({ className, ...props }, ref) => (
  <TableContainer
    className={className}
    ref={ref}
    {...props}
  />
));
Table.displayName = 'Table';

const TableContainer = React.forwardRef(({ className, children, ...props }, ref) => {
  const labels = [];
  const collectLabels = (nodes, inHeader = false) => {
    React.Children.forEach(nodes, (node) => {
      if (!React.isValidElement(node)) return;
      if (node.type === TableHeader) {
        collectLabels(node.props.children, true);
      } else if (inHeader && node.type === TableHead) {
        labels.push(getTextContent(node.props.children).trim());
      } else if (inHeader) {
        collectLabels(node.props.children, true);
      }
    });
  };

  collectLabels(children);

  return (
    <div className="relative w-full overflow-x-hidden md:overflow-x-auto">
      <table
        ref={ref}
        className={cn('admin-data-table w-full caption-bottom text-sm', className)}
        {...props}
      >
        {addMobileLabels(children, labels)}
      </table>
    </div>
  );
});
TableContainer.displayName = 'TableContainer';

export const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-sand-head [&_tr]:border-b [&_tr:hover]:bg-transparent', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-border transition-colors duration-200 hover:bg-sage-soft data-[state=selected]:bg-sage-soft',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 whitespace-nowrap px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-4 py-3.5 align-middle text-sm text-slate-700 [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
