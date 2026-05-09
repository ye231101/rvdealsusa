'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Shield,
  ShieldCheck,
  ClipboardList,
  User,
  DollarSign,
  Sparkles,
  Headset,
  Caravan,
  Search,
  Ruler,
  ChevronDown,
  Users,
  Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { LandingDealCard } from '@/components/landing-deal-card';
import { api } from '@/lib/api';
import {
  mapInventoryItem,
  type InventoryListResponse,
  type InventoryPagination,
  type InventoryUnit,
} from '@/lib/types';
import { bodies, lengthOptions, locations, maxPrices } from '@/lib/utils';

async function fetchDealsInventories(): Promise<{ inventories: InventoryUnit[]; pagination: InventoryPagination }> {
  const res = (await api.get('inventory', {
    params: {
      currentPage: 1,
      type: 'deals',
    },
  })) as InventoryListResponse;

  const { inventories, pagination } = res.data;
  return {
    inventories: inventories.map(mapInventoryItem),
    pagination,
  };
}

function buildInventoryHref(params: {
  keyword: string;
  body: string;
  maxPrice: string;
  length: string;
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
  if (params.location !== 'all') sp.set('location', params.location);

  const qs = sp.toString();
  return qs ? `/inventory?${qs}` : '/inventory';
}

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
      <SelectTrigger
        size="sm"
        className="flex h-auto min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-none transition outline-none hover:border-neutral-300 hover:bg-neutral-50/50 focus-visible:border-neutral-400 focus-visible:ring-[3px] focus-visible:ring-neutral-200/80 [&>svg:last-child]:hidden"
      >
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

export default function HomePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [body, setBody] = useState('all');
  const [maxPrice, setMaxPrice] = useState('any');
  const [length, setLength] = useState('any');
  const [location, setLocation] = useState('all');

  const viewHref = useMemo(
    () =>
      buildInventoryHref({
        keyword,
        body,
        maxPrice,
        length,
        location,
      }),
    [keyword, body, maxPrice, length, location],
  );

  const submit = useCallback(() => {
    router.push(viewHref);
  }, [router, viewHref]);

  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    fetchDealsInventories()
      .then((res) => {
        if (ignore) return;
        setUnits(res.inventories);
      })
      .catch((err: Error) => {
        if (ignore) return;
        setError(err.message || 'Failed to load inventory');
        setUnits([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="bg-neutral-50 pb-10 sm:pb-16">
      <section className="relative flex min-h-[calc(100vh-116px)] w-full flex-col overflow-hidden select-none md:min-h-[calc(100vh-80px)]">
        <div className="absolute inset-0">
          <Image
            src="/images/landing_hero.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div
            className="to-white/05 pointer-events-none absolute inset-0 bg-linear-to-r from-white/50 via-white/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/70 via-white/35 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="flex max-w-2xl flex-1 flex-col justify-center">
            <h1 className="text-4xl leading-[1.02] font-black tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              <span className="block">Find the Best RV Deals.</span>
              <span className="text-primary mt-1 block">All in One Search.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-snug font-semibold text-neutral-700 sm:text-xl md:text-2xl">
              Real dealer inventory. Real prices. Real savings.
            </p>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-md">
            <div className="flex min-h-0 min-w-0 items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-4 shadow-sm sm:px-5">
              <label className="flex min-h-0 min-w-0 flex-1 cursor-text items-center gap-3">
                <Search className="size-5 shrink-0 text-neutral-900" strokeWidth={2} aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <input
                    type="search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    placeholder="Search RVs or ask anything..."
                    className="w-full min-w-0 bg-transparent text-base font-normal text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-500"
                    autoComplete="off"
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={submit}
                className="text-primary flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-sm font-semibold transition hover:bg-rose-100"
                aria-label="AI Search"
              >
                <Sparkles className="size-4" strokeWidth={2} aria-hidden />
                AI
              </button>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-4 md:gap-3">
                <FilterSelectField
                  icon={<Caravan className="size-5" strokeWidth={2} />}
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
                  icon={<DollarSign className="size-5" strokeWidth={2} />}
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
                  icon={<Ruler className="size-5" strokeWidth={2} />}
                  title="Length"
                  value={length}
                  onValueChange={setLength}
                  placeholder="Any Length"
                >
                  <SelectItem value="any">Any Length</SelectItem>
                  {lengthOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </FilterSelectField>

                <FilterSelectField
                  icon={<MapPin className="size-5" strokeWidth={2} />}
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

              <Button
                type="button"
                variant="default"
                onClick={submit}
                className="mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 text-base font-black tracking-wide text-white uppercase shadow-md transition hover:opacity-95"
              >
                <Search className="size-5 shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                Search all RV deals
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 md:px-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex h-full flex-col items-center justify-start text-center sm:justify-center">
              <Caravan className="text-primary size-8 sm:size-10" strokeWidth={2} />
              <p className="mt-1 text-xs font-bold text-neutral-800 sm:text-sm">Real Dealer Prices</p>
              <p className="text-[11px] text-neutral-500 sm:text-xs">No hidden fees</p>
            </div>
            <div className="flex h-full flex-col items-center justify-start text-center sm:justify-center">
              <Shield className="text-primary size-8 sm:size-10" strokeWidth={2} />
              <p className="mt-1 text-xs font-bold text-neutral-800 sm:text-sm">Updated Daily</p>
              <p className="text-[11px] text-neutral-500 sm:text-xs">Fresh inventory</p>
            </div>
            <div className="flex h-full flex-col items-center justify-start text-center sm:justify-center">
              <Headset className="text-primary size-8 sm:size-10" strokeWidth={2} />
              <p className="mt-1 text-xs font-bold text-neutral-800 sm:text-sm">Expert Help</p>
              <p className="text-[11px] text-neutral-500 sm:text-xs">Real people</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-x-hidden px-4 py-4 sm:px-6 md:px-10">
        {error ? <p className="text-destructive mb-6 text-center text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-muted-foreground size-8" />
          </div>
        ) : (
          <Carousel
            opts={{
              align: 'start',
              dragFree: false,
              watchDrag: (_api, evt) => {
                const raw = evt.target;
                if (!(raw instanceof Element)) return true;
                return !raw.closest('[data-nested-embla-viewport]');
              },
            }}
            className="w-full max-w-full min-w-0"
            key={units.map((u) => u.id).join('|')}
          >
            <div className="mb-4 flex flex-col gap-5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <h2 className="text-xl font-black tracking-wide text-neutral-900 uppercase md:text-2xl">
                Today's <span className="text-primary">Top RV Deals</span>
              </h2>
              <Link
                href="/inventory?type=deals"
                className="text-primary hover:text-primary/80 inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-extrabold tracking-wide uppercase md:text-sm"
              >
                View all deals
                <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              </Link>
            </div>
            <div className="relative max-w-full min-w-0">
              <CarouselContent className="-ml-3 md:-ml-4">
                {units.map((unit) => (
                  <CarouselItem
                    key={unit.id}
                    className="flex min-w-0 basis-[88%] pl-3 sm:basis-[48%] sm:pl-4 md:basis-[38%] lg:basis-[30%] xl:basis-1/4 2xl:basis-1/5 2xl:pl-4"
                  >
                    <LandingDealCard unit={unit} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious
                variant="outline"
                className="top-1/2 left-1 z-20 hidden size-10 min-h-10 min-w-10 -translate-y-1/2 cursor-pointer rounded-full border-neutral-300 bg-white text-neutral-900 shadow-md hover:bg-neutral-50! hover:text-neutral-900! disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 sm:left-2 sm:flex [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-neutral-900!"
              />
              <CarouselNext
                variant="outline"
                className="top-1/2 right-1 z-20 hidden size-10 min-h-10 min-w-10 -translate-y-1/2 cursor-pointer rounded-full border-neutral-300 bg-white text-neutral-900 shadow-md hover:bg-neutral-50! hover:text-neutral-900! disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 sm:right-2 sm:flex [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-neutral-900!"
              />
            </div>
          </Carousel>
        )}

        {!loading && !error && units.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">No units available right now.</p>
        ) : null}
      </section>

      <section className="px-4 py-4 sm:px-6 md:px-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:items-center md:divide-x md:divide-neutral-200">
            {[
              {
                key: 'users',
                Icon: Users,
                title: '25,000+',
                description: 'Happy Customers',
              },
              {
                key: 'caravan',
                Icon: Caravan,
                title: '2,000+',
                description: 'RVs Available',
              },
              {
                key: 'medal',
                Icon: Medal,
                title: 'Trusted',
                description: 'Dealers Network',
              },
              {
                key: 'dollar',
                Icon: DollarSign,
                title: 'Best Price',
                description: 'Guaranteed',
              },
            ].map(({ key, Icon, title, description }) => (
              <div key={key} className="flex min-w-0 flex-1 flex-col items-center">
                <Icon className="text-primary size-8 shrink-0 md:size-10" strokeWidth={1.5} aria-hidden />
                <div className="mt-1 min-w-0 text-center">
                  <p className="text-md leading-tight font-bold tracking-wide text-neutral-900 uppercase sm:text-base">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug font-normal text-neutral-500 sm:text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6 md:px-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 md:p-10">
          <h2 className="text-center text-xl font-extrabold tracking-tight text-neutral-900 md:text-2xl">
            Why Buy with RV Deals?
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 divide-neutral-200 sm:mt-10 sm:grid-cols-3 sm:divide-x">
            {[
              {
                key: 'inventory',
                Icon: ShieldCheck,
                title: 'Real Dealer Inventory',
                description: 'No fake listings',
              },
              {
                key: 'pricing',
                Icon: ClipboardList,
                title: 'Transparent Pricing',
                description: 'No hidden fees',
              },
              {
                key: 'support',
                Icon: User,
                title: 'Expert Support',
                description: 'Real people, real help',
              },
            ].map(({ key, Icon, title, description }) => (
              <div key={key} className="flex flex-row items-center gap-2 sm:justify-center">
                <Icon className="text-primary size-8 shrink-0 md:size-10" strokeWidth={1.5} aria-hidden />
                <div className="flex flex-col items-start">
                  <p className="text-md leading-tight font-bold tracking-wide text-neutral-900 uppercase sm:text-base">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug font-normal text-neutral-500 sm:text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
