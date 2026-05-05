'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Caravan,
  ChevronDown,
  DollarSign,
  Info,
  MapPin,
  Mic,
  Ribbon,
  Ruler,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { bodies, cn, locations, makes, models, maxPrices } from '@/lib/utils';

const QUICK_TAGS = [
  { label: 'Class A', href: '/inventory?body=class-a' },
  { label: 'Class B', href: '/inventory?body=class-b' },
  { label: 'Class C', href: '/inventory?body=class-c' },
  { label: 'Travel Trailer', href: '/inventory?body=travel-trailer' },
  { label: 'Fifth Wheel', href: '/inventory?body=5th-wheel' },
  { label: 'Toy Hauler', href: '/inventory?body=toy-hauler' },
  { label: 'Under $100K', href: '/inventory?maxPrice=100000' },
] as const;

const MORE_LINKS = [
  { label: 'Winnebago', href: '/inventory?make=winnebago' },
  { label: 'Storyteller Overland', href: '/inventory?make=storyteller-overland' },
  { label: 'Jayco', href: '/inventory?make=jayco' },
  { label: 'Grand Design', href: '/inventory?make=grand-design' },
] as const;

const LENGTH_OPTIONS = [
  { value: 'compact', label: 'Under 25 ft' },
  { value: 'mid', label: '25-35 ft' },
  { value: 'long', label: 'Over 35 ft' },
] as const;

function buildInventoryHref(params: {
  keyword: string;
  body: string;
  maxPrice: string;
  length: string;
  make: string;
  brand: string;
  location: string;
}): string {
  const sp = new URLSearchParams();
  const qBits: string[] = [];

  if (params.keyword.trim()) qBits.push(params.keyword.trim());

  const mergedQ = qBits.join(' ').trim();
  if (mergedQ) sp.set('q', mergedQ);

  if (params.body !== 'all') sp.set('body', params.body);
  if (params.maxPrice !== 'any') sp.set('maxPrice', params.maxPrice);
  if (params.length !== 'any') {
    if (params.length === 'compact') {
      sp.set('maxLength', '25');
    } else if (params.length === 'mid') {
      sp.set('minLength', '25');
      sp.set('maxLength', '35');
    } else if (params.length === 'long') {
      sp.set('minLength', '35');
    }
  }
  if (params.make !== 'all') sp.set('make', params.make);
  if (params.brand !== 'all') sp.set('brand', params.brand);
  if (params.location !== 'all') sp.set('location', params.location);

  const qs = sp.toString();
  return qs ? `/inventory?${qs}` : '/inventory';
}

const filterDropdownTriggerClassName = cn(
  'flex h-auto min-h-[3.25rem] w-full cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5',
  'shadow-none outline-none transition hover:border-neutral-300 hover:bg-neutral-50/50',
  'focus-visible:border-neutral-400 focus-visible:ring-[3px] focus-visible:ring-neutral-200/80',
  '[&>svg:last-child]:hidden',
);

type FilterSelectFieldProps = {
  icon: ReactNode;
  title: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  contentClassName?: string;
};

function FilterSelectField({
  icon,
  title,
  value,
  onValueChange,
  placeholder,
  children,
  contentClassName,
}: FilterSelectFieldProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className={filterDropdownTriggerClassName}>
        <span className="flex shrink-0 text-neutral-900" aria-hidden>
          {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
          <span className="text-sm leading-tight font-bold text-neutral-900">{title}</span>
          <SelectValue placeholder={placeholder} className="text-sm font-normal text-neutral-500" />
        </span>
        <ChevronDown className="size-4 shrink-0 text-neutral-900" strokeWidth={2} aria-hidden />
      </SelectTrigger>
      <SelectContent className={contentClassName}>{children}</SelectContent>
    </Select>
  );
}

export function LandingRvSearchCard() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [body, setBody] = useState('all');
  const [maxPrice, setMaxPrice] = useState('any');
  const [length, setLength] = useState('any');
  const [make, setMake] = useState('all');
  const [brand, setBrand] = useState('all');
  const [location, setLocation] = useState('all');
  const [liveOnly, setLiveOnly] = useState(true);

  const viewHref = useMemo(
    () =>
      buildInventoryHref({
        keyword,
        body,
        maxPrice,
        length,
        make,
        brand,
        location,
      }),
    [keyword, body, maxPrice, length, make, brand, location],
  );

  const submit = useCallback(() => {
    router.push(viewHref);
  }, [router, viewHref]);

  const tryAiExample = useCallback(() => {
    setKeyword('Best 4x4 vans under $150k');
  }, []);

  return (
    <section className="relative z-10 -mt-8 px-4 pb-4 sm:-mt-10 sm:px-6 md:px-10">
      <div className="mx-auto">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg sm:p-6">
          <h2 className="text-xl font-black tracking-wide uppercase sm:text-2xl md:text-3xl">
            <span className="text-neutral-900">Find your </span>
            <span className="text-primary">perfect RV</span>
          </h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
            <div className="flex flex-col divide-y divide-neutral-200 sm:flex-row sm:divide-x sm:divide-y-0">
              <label className="flex min-h-0 min-w-0 flex-[1.12] cursor-text items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-4 md:py-5">
                <Search className="size-5 shrink-0 text-neutral-900" strokeWidth={2} aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <input
                    type="search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search make, model, keyword..."
                    className="w-full min-w-0 bg-transparent text-base font-normal text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-500"
                    autoComplete="off"
                  />
                </div>
              </label>

              <div className="flex min-h-0 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-4 md:py-5">
                <button
                  type="button"
                  onClick={tryAiExample}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-90 sm:gap-3.5"
                >
                  <Sparkles className="size-5 shrink-0 text-sky-500" strokeWidth={2} aria-hidden />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-bold text-neutral-900">Ask AI Anything</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-2 text-neutral-900 transition hover:opacity-80"
                  aria-label="Voice search (coming soon)"
                >
                  <Mic className="size-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_TAGS.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                {t.label}
              </Link>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  More
                  <ChevronDown className="text-muted-foreground size-4" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <p className="text-muted-foreground px-2 pb-1 text-xs font-semibold uppercase">More filters</p>
                <ul className="flex flex-col gap-0.5">
                  {MORE_LINKS.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-2 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </div>

          <div className="mt-6 sm:mt-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 md:grid-cols-3">
              <FilterSelectField
                icon={<Caravan className="size-6" strokeWidth={2} />}
                title="RV Type"
                value={body}
                onValueChange={setBody}
                placeholder="All Types"
              >
                <SelectItem value="all">All Types</SelectItem>
                {bodies.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </FilterSelectField>

              <FilterSelectField
                icon={<DollarSign className="size-6" strokeWidth={2} />}
                title="Price Range"
                value={maxPrice}
                onValueChange={setMaxPrice}
                placeholder="Any Price"
              >
                <SelectItem value="any">Any Price</SelectItem>
                {maxPrices.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    Up to {p.label}
                  </SelectItem>
                ))}
              </FilterSelectField>
              <FilterSelectField
                icon={<Ruler className="size-6" strokeWidth={2} />}
                title="Length"
                value={length}
                onValueChange={setLength}
                placeholder="Any Length"
              >
                <SelectItem value="any">Any Length</SelectItem>
                {LENGTH_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </FilterSelectField>

              <FilterSelectField
                icon={<Shield className="size-6" strokeWidth={2} />}
                title="Make"
                value={make}
                onValueChange={setMake}
                placeholder="All Makes"
                contentClassName="max-h-64"
              >
                <SelectItem value="all">All Makes</SelectItem>
                {makes.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </FilterSelectField>

              <FilterSelectField
                icon={<Ribbon className="size-6" strokeWidth={2} />}
                title="Brand"
                value={brand}
                onValueChange={setBrand}
                placeholder="All Brands"
                contentClassName="max-h-64"
              >
                <SelectItem value="all">All Brands</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </FilterSelectField>

              <FilterSelectField
                icon={<MapPin className="size-6" strokeWidth={2} />}
                title="Location"
                value={location}
                onValueChange={setLocation}
                placeholder="All Locations"
                contentClassName="max-h-64"
              >
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </FilterSelectField>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Switch
                checked={liveOnly}
                onCheckedChange={setLiveOnly}
                className="data-[state=checked]:border-transparent data-[state=checked]:bg-[#E31B23]"
              />
              <span className="text-sm font-medium text-neutral-800">Only show RVs available to see live</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground rounded-full p-1 hover:text-neutral-600"
                    aria-label="About live availability"
                  >
                    <Info className="size-4" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Connect with a specialist for a live video walk-through. Filters apply to inventory; live scheduling
                  happens on the unit page or chat.
                </TooltipContent>
              </Tooltip>
            </div>

            <Button
              type="button"
              variant="default"
              onClick={submit}
              className="mt-5 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 text-base font-black tracking-wide text-white uppercase shadow-md transition hover:opacity-95"
            >
              <Search className="size-5 shrink-0 text-white" strokeWidth={2.5} aria-hidden />
              View all RVs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
