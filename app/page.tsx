'use client';

import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Bot,
  Calculator,
  Handshake,
  Heart,
  Info,
  BellRing,
  Cog,
  FileSearch,
  MapPin,
  RefreshCw,
  Shield,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Spinner } from '@/components/ui/spinner';
import { LandingDealCard } from '@/components/landing-deal-card';
import { LandingRvSearchCard } from '@/components/landing-rv-search-card';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { api } from '@/lib/api';
import {
  mapInventoryItem,
  type InventoryListResponse,
  type InventoryPagination,
  type InventoryUnit,
} from '@/lib/types';
import { AVATAR_URL } from '@/lib/constants';

const FEATURED_DEALS_COUNT = 10;

const dealAlertsSchema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email').max(254),
});

type DealAlertsForm = z.infer<typeof dealAlertsSchema>;

async function fetchFeaturedInventories(): Promise<{ inventories: InventoryUnit[]; pagination: InventoryPagination }> {
  const res = (await api.get('inventory', {
    params: {
      currentPage: 1,
      perPage: FEATURED_DEALS_COUNT,
    },
  })) as InventoryListResponse;

  const { inventories, pagination } = res.data;
  return {
    inventories: inventories.map(mapInventoryItem),
    pagination,
  };
}

export default function HomePage() {
  const { isAvailable, users, open } = useViewProWidget();

  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DealAlertsForm>({
    resolver: zodResolver(dealAlertsSchema),
    defaultValues: { email: '' },
  });

  const dealAlertsEmailValue = watch('email') ?? '';

  const onDealAlertsSubmit = handleSubmit(async (data) => {
    const email = data.email.trim();
    try {
      await api.post('subscriber/subscribe', { email });
      reset();
    } catch {
      // api interceptor already surfaces errors
    }
  });

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    fetchFeaturedInventories()
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
    <div className="bg-neutral-50">
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
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/70 via-black/45 to-black/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/20"
            aria-hidden
          />
        </div>

        {isAvailable && users.length > 0 && (
          <div className="absolute right-4 bottom-10 z-20 sm:right-6 sm:bottom-12 md:right-8 md:bottom-16">
            <button
              type="button"
              onClick={() => open()}
              className="flex max-w-md cursor-pointer gap-3 rounded-xl border border-white/15 bg-black/55 px-4 py-3 text-left shadow-xl backdrop-blur-md transition hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none sm:gap-4 sm:px-5 sm:py-4"
              aria-label="Open live specialist — see it live"
            >
              <div className="flex shrink-0 items-center -space-x-6" aria-hidden>
                {users.slice(0, 3).map((u, i) => (
                  <div
                    key={u.username}
                    className="relative size-12 overflow-hidden rounded-full border-2 border-white bg-neutral-600 sm:size-16"
                    style={{ zIndex: 3 + i }}
                  >
                    {u.avatar ? (
                      <Image src={AVATAR_URL + u.avatar} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-linear-to-br from-neutral-500 to-neutral-700">
                        <User className="size-5 text-white/90" strokeWidth={2} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="animate-live-dot-blink size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  <span className="text-sm font-extrabold tracking-wide text-white uppercase sm:text-base">
                    SEE IT LIVE
                  </span>
                </p>
                <p className="mt-1 text-sm font-medium text-white/90 sm:text-base">Real RVs. Real Time.</p>
                <p className="mt-0.5 text-xs text-white/75 sm:text-sm">Talk to a Specialist Now.</p>
              </div>
            </button>
          </div>
        )}

        <div className="relative z-10 mx-auto flex w-full flex-1 flex-col justify-center px-4 pt-10 pb-28 sm:px-6 sm:pt-12 sm:pb-12 md:px-10 md:pt-14 md:pb-10">
          <div className="grid w-full grid-cols-1 items-start gap-10">
            <div className="max-w-xl md:max-w-2xl xl:max-w-3xl">
              <h1 className="text-4xl leading-[0.95] font-black tracking-tight text-white uppercase sm:text-5xl md:text-6xl">
                <span className="block px-2 py-1.5 sm:px-3 sm:py-2">RVs SELLING</span>
                <span className="bg-primary text-primary-foreground inline-block px-2 py-1.5 sm:px-3 sm:py-2">
                  BELOW MSRP
                </span>
              </h1>
              <p className="mt-5 inline-block max-w-xl text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
                SAVE <span className="text-yellow-500">$8,000 - $18,000</span> TODAY!
              </p>

              <ul className="mt-8 max-w-lg space-y-5">
                {[
                  {
                    Icon: Tag,
                    title: 'REAL DEALER PRICES',
                    desc: 'No hidden fees.',
                  },
                  {
                    Icon: MapPin,
                    title: 'INVENTORY NEAR YOU',
                    desc: 'Thousands of RVs updated daily.',
                  },
                  {
                    Icon: Handshake,
                    title: 'EXPERT HELP',
                    desc: "Connect with a real specialist when you're ready.",
                  },
                ].map(({ Icon, title, desc }) => (
                  <li key={title} className="flex gap-3 sm:gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md sm:h-14 sm:w-14"
                      aria-hidden
                    >
                      <Icon className="text-primary size-6 sm:size-7" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-base font-extrabold tracking-wide text-white uppercase sm:text-lg">{title}</p>
                      <p className="mt-0.5 text-sm leading-snug font-medium text-white/85 sm:text-base">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <LandingRvSearchCard />

      <section className="relative z-10 px-4 py-4 sm:px-6 md:px-10">
        <div className="mx-auto">
          <div className="rounded-xl border border-slate-200/90 bg-blue-50 p-4 shadow-sm sm:p-4 md:rounded-2xl md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:gap-6">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-3 md:flex-row md:items-end md:gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-6 shrink-0 text-blue-600 md:size-8" strokeWidth={2} aria-hidden />
                  <h2 className="text-xl font-black text-slate-900 uppercase md:text-2xl">AI Deal Confidence</h2>
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-baseline md:gap-x-3 md:gap-y-1">
                    <p className="md:text-md text-sm font-normal text-blue-800 md:max-w-none">
                      We analyze thousands of similar RVs to tell you if it&apos;s a good deal.
                    </p>
                  </div>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer self-start text-sm font-semibold text-blue-600 underline-offset-4 transition hover:text-blue-600/85 hover:underline md:self-center"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      How it works
                      <Info className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-sm text-sm" align="end">
                  <p className="font-semibold text-neutral-900">How AI Deal Confidence works</p>
                  <p className="mt-2 text-neutral-600">
                    We compare each listing&apos;s price to recent sales and active listings for similar RVs—same class,
                    age, features, and region—so you can see at a glance whether you&apos;re likely getting a strong
                    deal, a typical price, or room to negotiate.
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-5 rounded-xl border border-neutral-200/80 bg-white p-4 sm:p-5 md:mt-6 md:rounded-xl">
              <div className="grid grid-cols-1 divide-y divide-neutral-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                {[
                  {
                    label: 'Great Deal',
                    lines: ['Well below market', 'Save more!'],
                    circle: 'bg-emerald-500',
                    labelClass: 'text-emerald-600',
                  },
                  {
                    label: 'Fair Price',
                    lines: ['Within market range', 'Good value'],
                    circle: 'bg-amber-500',
                    labelClass: 'text-amber-700',
                  },
                  {
                    label: 'High Price',
                    lines: ['Above market', 'Negotiate more'],
                    circle: 'bg-red-500',
                    labelClass: 'text-red-600',
                  },
                ].map(({ label, lines, circle, labelClass }) => (
                  <div key={label} className="flex items-center gap-3 py-5 md:px-5 md:py-4">
                    <div
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-full shadow-sm sm:size-14',
                        circle,
                      )}
                      aria-hidden
                    >
                      <Tag className="size-6 text-white sm:size-7" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className={cn('text-sm font-black tracking-wide uppercase sm:text-base', labelClass)}>
                        {label}
                      </p>
                      {lines.map((line) => (
                        <p key={line} className="text-sm leading-snug font-medium text-neutral-800">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-4 sm:px-6 md:px-10">
        <div className="mx-auto">
          <div className="flex flex-col gap-4 rounded-xl bg-[#020617] px-4 py-5 shadow-lg sm:gap-5 sm:px-5 sm:py-6 md:gap-6 md:rounded-2xl md:px-8 md:py-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-black tracking-wide text-white uppercase sm:text-lg">AI Deal Finder</h2>
              <span className="rounded-full bg-slate-600/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                New
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-stretch">
              <div
                className="grid min-w-0 flex-1 grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-white/10"
                role="group"
                aria-label="AI Deal Finder features"
              >
                <div className="flex items-center gap-3 px-1 pt-0 pb-6 md:px-4 md:py-2 md:pl-0">
                  <Shield className="size-8 shrink-0 text-white/95" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-white sm:text-base">Scans 20+ Sites</p>
                    <p className="mt-0.5 text-sm leading-snug text-pretty text-white/65">
                      Marketplace, dealer &amp; private listings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-1 py-6 md:px-4 md:py-2">
                  <FileSearch className="size-8 shrink-0 text-white/95" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-white sm:text-base">Finds Hidden Deals</p>
                    <p className="mt-0.5 text-sm leading-snug text-pretty text-white/65">
                      Alerts you before others see them
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-1 py-6 md:px-4 md:py-2 md:pr-5">
                  <Cog className="size-8 shrink-0 text-white/95" strokeWidth={1.75} aria-hidden />
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-white sm:text-base">Deal Score &amp; Insights</p>
                    <p className="mt-0.5 text-sm leading-snug text-pretty text-white/65">
                      AI scores price, value &amp; demand
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-3 border-t border-white/10 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8">
                <BellRing className="size-8 shrink-0 text-white/95" strokeWidth={1.75} aria-hidden />
                <div className="flex w-full max-w-sm flex-col items-center gap-2 md:w-auto md:max-w-none">
                  <Button
                    asChild
                    className="h-11 w-full cursor-pointer rounded-lg bg-white px-6 text-xs font-black tracking-wide text-[#000814] uppercase shadow-sm hover:bg-white/95 md:w-auto md:min-w-[200px]"
                  >
                    <Link href="/inventory">Set up AI alerts</Link>
                  </Button>
                  <p className="text-center text-xs text-white/65 md:text-left">Takes 2 minutes</p>
                </div>
              </div>
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
                href="/inventory"
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
          <div className="flex flex-col md:flex-row md:items-center">
            {[
              {
                key: 'live',
                Icon: Bell,
                title: 'See it live',
                description: 'Real video walkthroughs',
              },
              {
                key: 'ai',
                Icon: Bot,
                title: 'AI pricing',
                description: "Know if it's a good deal",
              },
              {
                key: 'trade',
                Icon: RefreshCw,
                title: 'Trade-in value',
                description: 'Get your instant offer',
              },
              {
                key: 'payment',
                Icon: Calculator,
                title: 'Payment estimator',
                description: 'See payments in seconds',
              },
              {
                key: 'saved',
                Icon: Heart,
                title: 'Saved searches',
                description: 'Get alerts on new deals',
              },
            ].map(({ key, Icon, title, description }, index) => (
              <Fragment key={key}>
                {index > 0 ? (
                  <>
                    <div className="hidden h-10 w-px shrink-0 bg-neutral-200 md:block" aria-hidden />
                    <div className="h-px w-full bg-neutral-200 md:hidden" aria-hidden />
                  </>
                ) : null}
                <div className="flex min-w-0 flex-1 items-center gap-3 py-3 md:gap-3.5 md:px-1.5 md:py-0 lg:px-2">
                  <Icon className="size-8 shrink-0 text-slate-800 md:size-9" strokeWidth={1.5} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs leading-tight font-bold tracking-wide text-slate-800 uppercase sm:text-sm">
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug font-normal text-slate-500 sm:text-[13px]">
                      {description}
                    </p>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-4 pb-8 sm:px-6 md:px-10">
        <div className="rounded-2xl bg-[#050a14] px-6 py-8 shadow-md md:flex md:items-center md:justify-between md:gap-10 md:px-10 md:py-10">
          <div className="flex items-start gap-4 md:max-w-xl md:flex-1">
            <BellRing className="size-9 shrink-0 text-white md:size-10" strokeWidth={1.5} aria-hidden />
            <div className="min-w-0">
              <p className="text-base leading-snug font-bold tracking-wide text-white uppercase sm:text-lg">
                Don&apos;t miss the next great deal
              </p>
              <p className="mt-1.5 text-sm font-normal text-white/90 sm:text-base">
                Get instant alerts on the best RV deals near you.
              </p>
            </div>
          </div>
          <form className="mt-8 w-full md:mt-0 md:max-w-xl md:flex-1 lg:max-w-2xl" onSubmit={onDealAlertsSubmit}>
            <label htmlFor="deal-alerts-email" className="sr-only">
              Email address for deal alerts
            </label>
            <div
              className={cn('overflow-hidden rounded-lg bg-white shadow-md', errors.email && 'ring-destructive ring-2')}
            >
              <div className="flex w-full min-w-0 flex-col sm:flex-row sm:items-stretch">
                <Input
                  id="deal-alerts-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email address"
                  aria-invalid={!!errors.email}
                  disabled={isSubmitting}
                  className={cn(
                    'focus-visible:ring-primary/30 min-h-12 w-full min-w-0 flex-1 rounded-none border-0 bg-white px-4 py-3 text-base text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-inset disabled:opacity-60 aria-invalid:border-transparent aria-invalid:ring-0 md:text-sm',
                    errors.email && 'focus-visible:ring-destructive/40',
                  )}
                  {...register('email')}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !dealAlertsEmailValue.trim()}
                  className="bg-primary hover:bg-primary/80 min-h-12 w-full shrink-0 cursor-pointer rounded-none border-0 px-4 py-3 text-sm font-bold tracking-wide text-white uppercase shadow-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed sm:w-48 sm:border-l sm:border-white/20"
                >
                  {isSubmitting ? <Spinner className="size-4 text-white" /> : 'Get deal alerts'}
                </Button>
              </div>
            </div>
            {errors.email ? (
              <p className="mt-2 px-1 text-sm leading-snug font-medium text-rose-300" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
