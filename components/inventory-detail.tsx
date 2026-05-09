'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Calculator,
  Car,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Cog,
  Fuel,
  Gauge,
  LayoutTemplate,
  MessageCircle,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Tag,
  User,
  Video,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryContactDialog } from '@/components/inventory-contact-dialog';
import { useViewProWidget, type ViewProWidgetUser } from '@/components/view-pro-widget-provider';
import {
  bodies,
  makes,
  cn,
  formatMileage,
  formatSlideouts,
  formatPrice,
  rebateEndsLabel,
  labelFromCustomTags,
  getInventoryPricing,
} from '@/lib/utils';
import type { InventoryUnit } from '@/lib/types';

const APR_RATE = 7.99;
const PAYMENT_ESTIMATE_TERM_MONTHS = 240;
const TRADE_IN_ESTIMATE_RATIO = 0.72;

function TabPanelCard({
  title,
  children,
  footer,
  contentClassName,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200/95 bg-white shadow-sm">
      <div className="flex flex-col">
        <div className="px-4 py-6 sm:px-6 sm:py-8">
          {title && <h2 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">{title}</h2>}
          <div className={cn('mt-4 text-[15px] leading-relaxed text-neutral-700 md:text-base', contentClassName)}>
            {children}
          </div>
        </div>
        {footer}
      </div>
    </section>
  );
}

function monthlyPayment(principal: number, annualApr: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualApr / 100 / 12;
  if (r <= 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

function formatAprPercent(apr: number): string {
  return `${apr.toFixed(2)}%`;
}

function plateStateNameFromDealerLocation(locationLabel: string): string {
  const m = locationLabel.trim().match(/,\s*([A-Z]{2})\s*$/i);
  const abbrev = m ? m[1].toUpperCase() : 'CA';
  const names: Record<string, string> = {
    CA: 'California',
    FL: 'Florida',
    AZ: 'Arizona',
    NM: 'New Mexico',
  };
  return names[abbrev] ?? abbrev;
}

function buildInventoryLinks(unit: InventoryUnit) {
  const body = bodies.find((b) => b.label === unit.wI_Body);
  const make = makes.find((m) => m.label === unit.wI_Make);
  return {
    bodyHref: body ? `/inventory?body=${encodeURIComponent(body.value)}` : null,
    makeHref: make ? `/inventory?make=${encodeURIComponent(make.value)}` : null,
  };
}

export function InventoryDetail({ unit }: { unit: InventoryUnit }) {
  const { isAvailable, users, open } = useViewProWidget();

  const [contactOpen, setContactOpen] = useState(false);
  const [floorplanDialogOpen, setFloorplanDialogOpen] = useState(false);
  const [financePrice, setFinancePrice] = useState(0);
  const [financeDown, setFinanceDown] = useState(0);
  const [paymentAmountFocus, setPaymentAmountFocus] = useState<'price' | 'down' | null>(null);
  const [tradePlate, setTradePlate] = useState('');

  const [slideIndex, setSlideIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const slides = useMemo(() => {
    const base =
      unit.images && unit.images.length > 0
        ? unit.images
        : unit.defaultImageUrl
          ? [unit.defaultImageUrl]
          : ['/images/photos_coming_soon.jpg'];
    return base;
  }, [unit.images, unit.defaultImageUrl]);

  const floorplanSrc = slides[slides.length - 1];

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlideIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const el = thumbRefs.current[slideIndex];
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [slideIndex, slides.length]);

  useEffect(() => {
    document.title = `${unit.title} | RVDealsUSA`;
    return () => {
      document.title = 'RVDealsUSA';
    };
  }, [unit.title]);

  const { msrp, displayPrice, savingAmount, isTooLowToShow, showDetailedBreakdown } = getInventoryPricing(unit);

  const rebateFootnote = showDetailedBreakdown && unit.rebate ? rebateEndsLabel(unit.rebate.enddate) : null;
  const rvTypeLabel = labelFromCustomTags(unit.customTags, 'rvType');
  const driveTrainLabel = labelFromCustomTags(unit.customTags, 'driveTrain');

  const tradeInEstimateAmount = displayPrice > 0 ? Math.round(displayPrice * TRADE_IN_ESTIMATE_RATIO) : null;

  useEffect(() => {
    setFinancePrice(Math.round(displayPrice));
    setFinanceDown(Math.round(displayPrice * 0.1));
  }, [displayPrice, unit.id]);

  const downPayment = Math.min(financeDown, financePrice);
  const principal = Math.max(0, financePrice - downPayment);
  const estimatedMonthly = monthlyPayment(principal, APR_RATE, PAYMENT_ESTIMATE_TERM_MONTHS);

  const quickSpecParts = [
    unit.wI_Body,
    unit.wI_Fuel,
    unit.wI_Length ? `${unit.wI_Length} ft` : null,
    driveTrainLabel,
  ].filter(Boolean);

  const links = buildInventoryLinks(unit);

  const keySpecs: { label: string; value: string }[] = [
    { label: 'Stock #', value: unit.stockNumber },
    { label: 'Chassis', value: rvTypeLabel ?? '—' },
    { label: 'Engine', value: unit.wI_Engine?.trim() ? unit.wI_Engine : '—' },
    { label: 'Fuel Type', value: unit.wI_Fuel || '—' },
    { label: 'Drive Train', value: driveTrainLabel ?? '—' },
    { label: 'Length', value: unit.wI_Length ? `${unit.wI_Length} ft` : '—' },
    { label: 'Slideouts', value: formatSlideouts(unit.slideOutsCount) },
    { label: 'Mileage', value: formatMileage(unit.wI_Mileage) },
  ];

  const loveParagraph = (() => {
    const bits: string[] = [`${unit.title} is built for adventure.`];
    const withParts: string[] = [];
    if (driveTrainLabel) withParts.push(`${driveTrainLabel.toLowerCase()} drive`);
    if (unit.wI_Fuel) withParts.push(`a powerful ${unit.wI_Fuel.toLowerCase()} engine`);
    if (unit.wI_Length) withParts.push(`a rugged yet refined ${unit.wI_Length} ft interior`);
    if (withParts.length > 0) {
      const joined =
        withParts.length === 1
          ? withParts[0]
          : withParts.length === 2
            ? `${withParts[0]} and ${withParts[1]}`
            : `${withParts.slice(0, -1).join(', ')}, and ${withParts[withParts.length - 1]}`;
      bits.push(` With ${joined}, it's ready to take you anywhere in comfort and style.`);
    } else {
      bits.push(` It's ready to take you anywhere in comfort and style.`);
    }
    return bits.join('');
  })();

  const dealerLocationLine = unit.location;
  const plateStateBanner = plateStateNameFromDealerLocation(dealerLocationLine);

  const specialistOverflow = Math.max(0, users.length - 4);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 md:pb-20">
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/inventory"
          className="text-primary inline-flex items-center gap-2 text-sm font-semibold transition hover:underline"
        >
          <ChevronLeft className="size-4" />
          Back to Results
        </Link>
        <Breadcrumb>
          <BreadcrumbList className="text-neutral-600 sm:justify-end">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {links.bodyHref ? (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={links.bodyHref}>{unit.wI_Body}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{unit.wI_Body}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
            <BreadcrumbSeparator />
            {links.makeHref ? (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={links.makeHref}>{unit.wI_Make}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{unit.wI_Make}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate sm:max-w-none">{unit.wI_Model}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm">
            <div className="h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full touch-pan-y">
                {slides.map((src: string, i: number) => (
                  <div key={`${unit.id}-detail-${i}`} className="relative min-w-0 shrink-0 grow-0 basis-full">
                    <img src={src} alt="" className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
                  </div>
                ))}
              </div>
            </div>

            {isAvailable && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold tracking-wide text-white shadow-md">
                <span className="size-2 rounded-full bg-white" aria-hidden />
                AVAILABLE TO SEE LIVE
              </div>
            )}

            {canScrollPrev && (
              <button
                type="button"
                aria-label="Previous photo"
                className="absolute top-1/2 left-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-white"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeft className="size-6" strokeWidth={2} />
              </button>
            )}
            {canScrollNext && (
              <button
                type="button"
                aria-label="Next photo"
                className="absolute top-1/2 right-2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-white"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRight className="size-6" strokeWidth={2} />
              </button>
            )}
          </div>

          {slides.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
              {slides.map((src, i) => (
                <button
                  key={`${unit.id}-thumb-${i}`}
                  ref={(node) => {
                    thumbRefs.current[i] = node;
                  }}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === slideIndex
                      ? 'border-primary ring-primary/30 ring-1'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {unit.wI_InventoryType === 'New' ? (
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">New</span>
            ) : (
              <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800">Used</span>
            )}
            {(unit.isSpecialOffer || unit.inFlashSale) && (
              <span className="rounded bg-[#1e4d8b] px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
                Best value
              </span>
            )}
            {savingAmount > 0 && !isTooLowToShow && (
              <span className="bg-primary text-primary-foreground rounded px-2.5 py-1 text-xs font-bold tracking-wide uppercase">
                Lowest price
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl lg:text-[1.65rem] xl:text-4xl">
              {unit.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 md:text-base">{quickSpecParts.join(' • ')}</p>
            <p className="mt-1 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Tag className="size-3.5" strokeWidth={2} />
                Stock# {unit.stockNumber}
              </span>
            </p>
          </div>

          {isTooLowToShow ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-800">Call for price</p>
              <p className="text-muted-foreground mt-1 text-sm">Our price is too low to advertise online.</p>
            </div>
          ) : (
            <>
              {msrp > 0 ? (
                savingAmount > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 uppercase">MSRP</p>
                      <p className="mt-1 text-2xl font-bold text-neutral-800 tabular-nums line-through">
                        {formatPrice(msrp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-800 uppercase">You save</p>
                      <p className="mt-1 text-2xl font-bold text-green-600 tabular-nums">{formatPrice(savingAmount)}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-neutral-800 uppercase">MSRP</p>
                    <p className="mt-1 text-2xl font-bold text-neutral-800 tabular-nums">{formatPrice(msrp)}</p>
                  </div>
                )
              ) : null}

              <div>
                <p className="text-sm font-semibold text-neutral-800 uppercase">Your price</p>
                <p className="text-primary mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-[2.75rem]">
                  {displayPrice > 0 ? formatPrice(displayPrice) : '—'}
                </p>
              </div>
              {rebateFootnote ? <p className="text-muted-foreground text-xs">{rebateFootnote}</p> : null}

              <div className="flex flex-row gap-4">
                <div className="flex flex-row items-center gap-1.5 text-center sm:min-w-0">
                  <Car className="size-6 text-neutral-500" strokeWidth={1.5} aria-hidden />
                  <span className="text-xs font-medium text-neutral-500">{driveTrainLabel ?? '—'}</span>
                </div>
                <div className="flex flex-row items-center gap-1.5 text-center sm:min-w-0">
                  <Fuel className="size-6 text-neutral-500" strokeWidth={1.5} aria-hidden />
                  <span className="text-xs font-medium text-neutral-500">{unit.wI_Fuel || '—'}</span>
                </div>
                <div className="flex flex-row items-center gap-1.5 text-center sm:min-w-0">
                  <Ruler className="size-6 text-neutral-500" strokeWidth={1.5} aria-hidden />
                  <span className="text-xs font-medium text-neutral-500">
                    {unit.wI_Length ? `${unit.wI_Length} ft` : '—'}
                  </span>
                </div>
              </div>
            </>
          )}

          {isAvailable && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3">
              <CheckCircle2 className="mt-1 size-5 shrink-0 text-green-800" strokeWidth={2} />
              <div className="min-w-0 flex-1 flex-col text-sm">
                <p className="text-lg font-semibold text-green-800">Available Now</p>
                <p className="font-medium text-neutral-700">at La Mesa RV - {dealerLocationLine}</p>
                <p className="font-medium text-neutral-700">See it live today or schedule an appointment</p>
              </div>
              <ChevronRight className="size-5 shrink-0 justify-center self-center text-neutral-700" strokeWidth={2} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {isAvailable && (
          <button
            type="button"
            onClick={open}
            className="flex min-h-12 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-500 bg-transparent px-3 py-1.5 text-base font-bold text-neutral-900 transition hover:bg-neutral-50 sm:w-fit sm:px-6 sm:py-3 md:px-8 md:py-4"
          >
            <div className="flex items-center gap-1.5">
              <Video className="size-5 shrink-0" strokeWidth={2} />
              SEE IT LIVE
            </div>
            <p className="text-xs font-medium">Real video walkthrough</p>
          </button>
        )}
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/80 flex min-h-12 w-full cursor-pointer flex-col items-center justify-center rounded-lg px-3 py-1.5 text-base font-bold transition sm:w-fit sm:px-6 sm:py-3 md:px-8 md:py-4"
        >
          <div className="flex items-center gap-1.5">
            <Video className="size-5 shrink-0" strokeWidth={2} />
            GET BEST PRICE
          </div>
          <p className="text-xs font-medium">Unlock your lowest price</p>
        </button>
      </div>

      <div className="mt-10 sm:mt-12 lg:mt-14">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-x-0 gap-y-0 rounded-none border-b border-neutral-300/80 bg-transparent p-0">
            {(
              [
                ['overview', 'Overview'],
                ['specs', 'Specs'],
                ['features', 'Features'],
                ['floorplan', 'Floorplan'],
                ['compare', 'Compare'],
                ['dealer', 'Dealer info'],
              ] as const
            ).map(([id, label]) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  'rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-2.5 py-3 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase shadow-none sm:px-4 sm:text-xs',
                  'data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-neutral-900 data-[state=active]:shadow-none',
                )}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,440px)] lg:items-start lg:gap-4">
            <div className="min-w-0">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <TabPanelCard
                  title="Why You'll Love This RV"
                  contentClassName="space-y-4"
                  footer={
                    <div className="bg-[#F8F9FA] p-4 sm:px-6 sm:py-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6 xl:gap-10">
                        <div className="flex gap-4 lg:min-w-0 lg:flex-1">
                          <ShoppingBag className="size-10 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900">Real Inventory</p>
                            <p className="mt-1 text-sm leading-snug text-neutral-600">Updated in real time</p>
                          </div>
                        </div>
                        <div className="flex gap-4 lg:min-w-0 lg:flex-1">
                          <ShieldCheck className="size-10 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900">Best Price Guarantee</p>
                            <p className="mt-1 text-sm leading-snug text-neutral-600">
                              We&apos;ll always give you our best price.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 lg:min-w-0 lg:flex-1">
                          <User className="size-10 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900">No Hidden Fees</p>
                            <p className="mt-1 text-sm leading-snug text-neutral-600">
                              No pressure. Just real savings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <p>{loveParagraph}</p>
                </TabPanelCard>

                <TabPanelCard>
                  <div className="grid gap-8 md:grid-cols-2 md:gap-10">
                    <div className="min-w-0 md:border-r md:border-neutral-200 md:pr-8">
                      <h3 className="text-xs font-bold tracking-[0.12em] text-neutral-500 uppercase">Key specs</h3>
                      <ul className="mt-3">
                        {keySpecs.map((row) => (
                          <li
                            key={row.label}
                            className="flex justify-between gap-4 border-b border-neutral-100 py-2.5 text-sm last:border-b-0"
                          >
                            <span className="text-neutral-500">{row.label}</span>
                            <span className="text-right font-semibold text-neutral-900">{row.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold tracking-[0.12em] text-neutral-500 uppercase">Floorplan</h3>
                      <div className="mt-3 overflow-hidden rounded-lg bg-neutral-50/80">
                        <div className="relative aspect-4/3 w-full p-2">
                          <img src={floorplanSrc} alt="Floorplan" className="h-full w-full object-contain" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFloorplanDialogOpen(true)}
                        className="text-primary mt-4 inline-flex cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase hover:underline"
                      >
                        View larger floorplan <ArrowRight className="size-4 shrink-0" aria-hidden />
                      </button>
                    </div>
                  </div>
                </TabPanelCard>
              </TabsContent>

              <TabsContent value="specs" className="mt-0">
                <TabPanelCard title="Specifications">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Fuel, label: 'Fuel', value: unit.wI_Fuel },
                      { icon: Gauge, label: 'Mileage', value: formatMileage(unit.wI_Mileage) },
                      { icon: LayoutTemplate, label: 'Slideouts', value: formatSlideouts(unit.slideOutsCount) },
                      { icon: Ruler, label: 'Length', value: `${unit.wI_Length} ft.` },
                      { icon: Cog, label: 'Engine', value: unit.wI_Engine?.trim() ? unit.wI_Engine : '—' },
                      { icon: Car, label: 'Drive Train', value: driveTrainLabel ?? '—' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 rounded-lg border border-neutral-200/90 bg-[#F8F9FA] px-4 py-3.5"
                      >
                        <Icon className="size-8 shrink-0 text-neutral-600" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-500">{label}</p>
                          <p className="font-semibold text-neutral-900">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabPanelCard>
              </TabsContent>

              <TabsContent value="features" className="mt-0">
                <TabPanelCard title="Features & options">
                  <p>
                    Full feature packages vary by chassis and factory options. Connect live with a specialist to walk
                    through interior storage, electrical systems, climate, and optional equipment on this unit.
                  </p>
                  <ul className="mt-5 list-disc space-y-2.5 pl-5 text-sm">
                    <li>Walk the interior with a live video tour</li>
                    <li>Confirm options and packages on this stock number</li>
                    <li>Ask about delivery, orientation, and service</li>
                  </ul>
                </TabPanelCard>
              </TabsContent>

              <TabsContent value="floorplan" className="mt-0">
                <TabPanelCard title="Floorplan">
                  <div className="overflow-hidden rounded-lg bg-[#F8F9FA]">
                    <img
                      src={floorplanSrc}
                      alt="RV floorplan diagram"
                      className="mx-auto max-h-[420px] w-full object-contain p-6"
                    />
                  </div>
                  <p className="mt-4 text-sm text-neutral-600">
                    Detailed diagrams may be available from the manufacturer for this model.
                  </p>
                </TabPanelCard>
              </TabsContent>

              <TabsContent value="compare" className="mt-0">
                <TabPanelCard title="Compare inventory">
                  <p>
                    Open other listings in a new tab and use stock numbers to compare with your specialist during a live
                    session.
                  </p>
                  <Link
                    href="/inventory"
                    className="text-primary mt-6 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                  >
                    Browse more inventory <ArrowRight className="size-4 shrink-0" />
                  </Link>
                </TabPanelCard>
              </TabsContent>

              <TabsContent value="dealer" className="mt-0">
                <TabPanelCard title="About the dealer">
                  <p>
                    La Mesa RV offers new and used motorhomes and towables with nationwide reach and local expertise.
                    Your specialist can confirm availability, pricing, and next steps for this unit.
                  </p>
                  <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg border border-neutral-200 sm:h-36 sm:w-56">
                      <Image
                        src="/images/landing_hero.png"
                        alt="Dealership"
                        fill
                        className="object-cover"
                        sizes="224px"
                      />
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-neutral-900">{dealerLocationLine}</p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-neutral-700">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          Authorized dealer
                        </li>
                        <li className="flex items-center gap-2 text-neutral-700">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                          Top-rated customer service
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabPanelCard>
              </TabsContent>
            </div>
            <aside className="mt-8 space-y-4 lg:sticky lg:top-4 lg:mt-0 lg:self-start">
              <div
                id="inventory-payment-estimate"
                className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-xs font-bold tracking-wide text-neutral-900 uppercase">Payment estimate</h3>
                <p className="mt-3 flex flex-wrap items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900 tabular-nums">
                    {formatPrice(estimatedMonthly)}
                  </span>
                  <span className="text-base font-normal text-neutral-900">/mo*</span>
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Est. {PAYMENT_ESTIMATE_TERM_MONTHS} months at {formatAprPercent(APR_RATE)} APR on approved credit.
                </p>
                <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="flex min-h-16 min-w-0 flex-1 flex-col rounded-md border border-neutral-200 bg-white px-3 py-3 sm:w-fit sm:px-4">
                    <Label htmlFor="finance-price" className="text-xs font-normal text-neutral-500">
                      Price
                    </Label>
                    <Input
                      id="finance-price"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-bold text-neutral-900 shadow-none ring-0 outline-none focus-visible:ring-0 md:text-sm"
                      value={
                        paymentAmountFocus === 'price'
                          ? financePrice === 0
                            ? ''
                            : String(financePrice)
                          : formatPrice(financePrice)
                      }
                      onFocus={() => setPaymentAmountFocus('price')}
                      onBlur={() => setPaymentAmountFocus(null)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const next = digits === '' ? 0 : Number(digits);
                        setFinancePrice(next);
                        setFinanceDown((d) => Math.min(d, next));
                      }}
                    />
                  </div>
                  <div className="flex min-h-16 min-w-0 flex-1 flex-col rounded-md border border-neutral-200 bg-white px-3 py-3 sm:px-4">
                    <Label htmlFor="finance-down" className="text-xs font-normal text-neutral-500">
                      Down Payment
                    </Label>
                    <Input
                      id="finance-down"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-bold text-neutral-900 shadow-none ring-0 outline-none focus-visible:ring-0 md:text-sm"
                      value={
                        paymentAmountFocus === 'down'
                          ? financeDown === 0
                            ? ''
                            : String(financeDown)
                          : formatPrice(downPayment)
                      }
                      onFocus={() => setPaymentAmountFocus('down')}
                      onBlur={() => setPaymentAmountFocus(null)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const raw = digits === '' ? 0 : Number(digits);
                        setFinanceDown(Math.min(raw, financePrice));
                      }}
                    />
                  </div>
                  <div className="flex min-h-16 min-w-0 flex-1 flex-col rounded-md border border-neutral-200 bg-white px-3 py-3 sm:px-4">
                    <Label htmlFor="finance-credit" className="text-xs font-normal text-neutral-500">
                      Credit Score
                    </Label>
                    <Input
                      id="finance-credit"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-bold text-neutral-900 shadow-none ring-0 outline-none focus-visible:ring-0 md:text-sm"
                      value="Excellent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                >
                  View Full Payment Options
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </button>
              </div>

              <div
                id="inventory-trade-estimate"
                className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase">Trade-in estimate</h3>
                <p className="mt-1.5 text-sm font-normal text-neutral-600">Get an instant offer for your RV</p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="flex shrink-0 justify-center sm:justify-start">
                    <Label htmlFor="trade-plate" className="sr-only">
                      License plate
                    </Label>
                    <div className="relative w-full max-w-[150px] overflow-hidden rounded-lg bg-white px-3 pt-6 pb-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.08)] ring-1 ring-black/6">
                      <span className="absolute top-2 right-0 left-0 text-center text-[10px] font-semibold tracking-[0.12em] text-red-600 uppercase">
                        {plateStateBanner}
                      </span>
                      <Input
                        id="trade-plate"
                        placeholder="7ABC123"
                        className="h-auto border-0 bg-transparent px-0 text-center text-2xl font-bold tracking-[0.12em] text-neutral-900 uppercase shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
                        value={tradePlate}
                        onChange={(e) => setTradePlate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    {tradeInEstimateAmount != null ? (
                      <p className="text-4xl leading-none font-bold text-green-600 tabular-nums">
                        {formatPrice(tradeInEstimateAmount)}
                      </p>
                    ) : (
                      <p className="text-xl leading-snug font-semibold text-neutral-600">Contact us for an estimate</p>
                    )}
                    <p className="mt-2 text-sm font-medium text-neutral-600">Estimated Trade-In Value</p>
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Start Your Trade-In
                      <ArrowRight className="size-4 shrink-0" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>

              {isAvailable && (
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Video className="size-4" strokeWidth={2} aria-hidden />
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900">See it live</h3>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-neutral-700">
                    Connect with a product specialist for a real-time walkthrough of this floorplan and features.
                  </p>
                  {users.length > 0 ? (
                    <div className="mt-4 flex flex-wrap items-center gap-1">
                      {users.slice(0, 4).map((user: ViewProWidgetUser, i: number) => (
                        <Image
                          key={user.username}
                          src={'/viewpro/public/avatars/' + user.avatar}
                          alt=""
                          width={40}
                          height={40}
                          className={cn(
                            'size-10 rounded-full border-2 border-white object-cover shadow-sm',
                            i > 0 && '-ml-2',
                          )}
                        />
                      ))}
                      {specialistOverflow > 0 ? (
                        <span className="-ml-2 flex size-10 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-xs font-bold text-neutral-700">
                          +{specialistOverflow}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={open}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold tracking-wide shadow-sm transition"
                  >
                    <Video className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                    SEE IT LIVE NOW
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="text-primary mt-3 w-full text-center text-sm font-semibold hover:underline"
                  >
                    or Schedule an Appointment
                  </button>
                </div>
              )}
            </aside>
          </div>
        </Tabs>
      </div>

      <div className="mt-12 rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div
          className={cn(
            'grid grid-cols-1 divide-y divide-neutral-200 md:divide-x md:divide-y-0',
            isAvailable ? 'md:grid-cols-4' : 'md:grid-cols-3',
          )}
        >
          {isAvailable && (
            <div className="flex w-full items-start justify-center gap-3 p-4 text-left transition hover:bg-neutral-50/90 md:p-5">
              <Video className="mt-0.5 size-5 shrink-0 text-slate-900" strokeWidth={2} aria-hidden />
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wide text-slate-900 uppercase">See it live</p>
                <p className="mt-1 text-xs leading-snug font-normal text-neutral-600 normal-case">
                  Real video walkthroughs
                </p>
              </div>
            </div>
          )}
          <div className="flex w-full items-start justify-center gap-3 p-4 text-left transition hover:bg-neutral-50/90 md:p-5">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-slate-900" strokeWidth={2} aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wide text-slate-900 uppercase">Chat or text</p>
              <p className="mt-1 text-xs leading-snug font-normal text-neutral-600 normal-case">
                Get answers fast from our team
              </p>
            </div>
          </div>
          <div className="flex w-full items-start justify-center gap-3 p-4 text-left transition hover:bg-neutral-50/90 md:p-5">
            <RefreshCw className="mt-0.5 size-5 shrink-0 text-slate-900" strokeWidth={2} aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wide text-slate-900 uppercase">Trade-in value</p>
              <p className="mt-1 text-xs leading-snug font-normal text-neutral-600 normal-case">
                Get your offer in seconds
              </p>
            </div>
          </div>
          <div className="flex w-full items-start justify-center gap-3 p-4 text-left transition hover:bg-neutral-50/90 md:p-5">
            <Calculator className="mt-0.5 size-5 shrink-0 text-slate-900" strokeWidth={2} aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wide text-slate-900 uppercase">Payment estimator</p>
              <p className="mt-1 text-xs leading-snug font-normal text-neutral-600 normal-case">
                See payments in seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={floorplanDialogOpen} onOpenChange={setFloorplanDialogOpen}>
        <DialogContent
          showCloseButton
          className="data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 fixed inset-0 top-0 left-0 z-50 flex h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 shadow-none duration-200 sm:max-w-none [&>button]:top-3 [&>button]:right-4 [&>button]:z-30 [&>button]:text-white [&>button]:opacity-70 hover:[&>button]:opacity-100"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Floorplan</DialogTitle>
            <DialogDescription>Full screen floorplan image for {unit.title}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-6">
            <img
              src={floorplanSrc}
              alt={`Floorplan for ${unit.title}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <InventoryContactDialog open={contactOpen} onOpenChange={setContactOpen} unit={unit} />
    </div>
  );
}
