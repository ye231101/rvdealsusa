'use client';

import { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export type FilterPriceSelectProps = {
  variant: 'min' | 'max';
  options: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  otherBound: string;
  emptyLabel: string;
  triggerClassName?: string;
  contentClassName?: string;
  'aria-label'?: string;
};

function parsePriceDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? String(n) : '';
}

function formatUsdPreview(numStr: string): string {
  if (!numStr) return '';
  const n = parseInt(numStr, 10);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function triggerSummary(
  value: string,
  options: readonly { label: string; value: string }[],
  emptyLabel: string,
): string {
  if (!value) return emptyLabel;
  const preset = options.find((o) => o.value === value);
  if (preset) return preset.label;
  return formatUsdPreview(value) || emptyLabel;
}

export function FilterPriceSelect({
  variant,
  options,
  value,
  onChange,
  otherBound,
  emptyLabel,
  triggerClassName,
  contentClassName,
  'aria-label': ariaLabel,
}: FilterPriceSelectProps) {
  const id = useId();
  const customInputId = `${id}-custom`;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const otherNum = otherBound ? parseInt(otherBound, 10) : NaN;
  const hasOther = otherBound !== '' && Number.isFinite(otherNum);

  useEffect(() => {
    if (!open) return;
    if (!value) {
      setDraft('');
      return;
    }
    const isPreset = options.some((o) => o.value === value);
    setDraft(isPreset ? '' : value);
  }, [open, value, options]);

  const applyCustom = () => {
    const parsed = parsePriceDigits(draft);
    if (!parsed) {
      onChange('');
      return;
    }
    onChange(parsed);
  };

  const radioGroupValue = value === '' ? 'any' : options.some((o) => o.value === value) ? value : 'custom';

  const optionDisabled = (optionValue: string) => {
    const n = parseInt(optionValue, 10);
    if (!Number.isFinite(n)) return true;
    if (variant === 'min' && hasOther && n > otherNum) return true;
    if (variant === 'max' && hasOther && n < otherNum) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-auto w-full min-w-0 items-center justify-between gap-2 rounded-md text-left text-base font-medium outline-none focus-visible:ring-0',
            triggerClassName,
          )}
          aria-label={ariaLabel}
        >
          <span className="truncate">{triggerSummary(value, options, emptyLabel)}</span>
          <ChevronDown className="size-4 shrink-0 text-neutral-500" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn('w-[min(100%,var(--radix-popover-trigger-width))] p-0', contentClassName)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex max-h-[min(24rem,var(--radix-popover-content-available-height))] flex-col overflow-hidden">
          <div className="border-b border-neutral-200 p-3">
            <Label htmlFor={customInputId} className="text-xs font-semibold text-neutral-700">
              Custom price
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id={customInputId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 35000"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => applyCustom()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyCustom();
                  }
                }}
                className="h-9 border-neutral-300 bg-white text-sm"
              />
            </div>
            {draft ? (
              <p className="text-muted-foreground mt-1 text-xs">{formatUsdPreview(parsePriceDigits(draft))}</p>
            ) : null}
          </div>
          <div className="overflow-y-auto overscroll-contain p-3">
            <RadioGroup
              value={radioGroupValue}
              onValueChange={(v) => {
                if (v === 'any') {
                  onChange('');
                  setDraft('');
                  return;
                }
                if (v === 'custom') return;
                onChange(v);
                setDraft('');
              }}
              className="gap-0"
            >
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium hover:bg-neutral-100">
                <RadioGroupItem value="any" id={`${id}-any`} className="shrink-0 border-neutral-500" />
                <span className="min-w-0 leading-snug text-neutral-900">Any price</span>
              </label>
              {options.map(({ label, value: optVal }) => {
                const disabled = optionDisabled(optVal);
                return (
                  <label
                    key={optVal}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium',
                      disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer hover:bg-neutral-100',
                    )}
                  >
                    <RadioGroupItem
                      value={optVal}
                      id={`${id}-${optVal}`}
                      disabled={disabled}
                      className="shrink-0 border-neutral-500"
                    />
                    <span className="min-w-0 leading-snug text-neutral-900">{label}</span>
                  </label>
                );
              })}
              {radioGroupValue === 'custom' && value ? (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium hover:bg-neutral-100">
                  <RadioGroupItem value="custom" id={`${id}-custom-radio`} className="shrink-0 border-neutral-500" />
                  <span className="min-w-0 leading-snug text-neutral-900">Custom: {formatUsdPreview(value)}</span>
                </label>
              ) : null}
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
