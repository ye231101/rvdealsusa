'use client';

import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type FilterMultiSelectProps = {
  options: readonly { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel: string;
  countNoun: string;
  triggerClassName?: string;
  contentClassName?: string;
  'aria-label'?: string;
};

function summaryText(
  selected: string[],
  options: readonly { label: string; value: string }[],
  allLabel: string,
  countNoun: string,
): string {
  if (selected.length === 0) return allLabel;
  if (selected.length === 1) {
    return options.find((o) => o.value === selected[0])?.label ?? selected[0];
  }
  return `${selected.length} ${countNoun}`;
}

export function FilterMultiSelect({
  options,
  selected,
  onChange,
  allLabel,
  countNoun,
  triggerClassName,
  contentClassName,
  'aria-label': ariaLabel,
}: FilterMultiSelectProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-auto w-full min-w-0 items-center justify-between gap-2 rounded-md text-left text-base font-medium outline-none focus-visible:ring-0',
            triggerClassName,
          )}
          aria-label={ariaLabel}
        >
          <span className="truncate">{summaryText(selected, options, allLabel, countNoun)}</span>
          <ChevronDown className="size-4 shrink-0 text-neutral-500" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-[min(100%,var(--radix-popover-trigger-width))] p-0', contentClassName)}
      >
        <div className="max-h-[min(24rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-0.5 p-3">
            {options.map(({ label, value }) => (
              <label
                key={value}
                className="hover:bg-neutral-200 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium"
              >
                <Checkbox
                  checked={selected.includes(value)}
                  onCheckedChange={() => toggle(value)}
                  className="shrink-0 border-neutral-500"
                />
                <span className="min-w-0 leading-snug text-black">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
