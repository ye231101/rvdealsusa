'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, sortByOptions, type SortByValue } from '@/lib/utils';

export type FilterSortSelectProps = {
  value: SortByValue;
  onChange: (value: SortByValue) => void;
  triggerClassName?: string;
  contentClassName?: string;
};

function labelFor(value: SortByValue): string {
  return sortByOptions.find((o) => o.value === value)?.label ?? 'Recommended';
}

export function FilterSortSelect({ value, onChange, triggerClassName, contentClassName }: FilterSortSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-auto w-full min-w-0 items-center justify-between gap-2 rounded-md text-left text-base font-medium outline-none focus-visible:ring-0',
            triggerClassName,
          )}
          aria-label="Sort inventory"
        >
          <span className="truncate">{labelFor(value)}</span>
          <ChevronDown className="size-4 shrink-0 text-neutral-500" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-[min(100%,var(--radix-popover-trigger-width))] p-0', contentClassName)}
      >
        <div className="max-h-[min(24rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-1">
          {sortByOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                'flex w-full rounded-md px-2 py-1.5 text-left text-sm font-medium',
                opt.value === value ? 'bg-primary text-white' : 'text-black hover:bg-neutral-200',
              )}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
