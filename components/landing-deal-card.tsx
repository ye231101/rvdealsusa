'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
import { Camera, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewProWidget } from '@/components/view-pro-widget-provider';
import { formatPrice, formatSlideouts } from '@/lib/utils';
import type { InventoryUnit } from '@/lib/types';

export function LandingDealCard({ unit }: { unit: InventoryUnit }) {
  const router = useRouter();
  const { isAvailable, open } = useViewProWidget();

  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const base =
      unit.images && unit.images.length > 0
        ? unit.images
        : unit.defaultImageUrl
          ? [unit.defaultImageUrl]
          : ['/images/photos_coming_soon.jpg'];
    return base;
  }, [unit.images, unit.defaultImageUrl]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSlideIndex(emblaApi.selectedScrollSnap());
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

  const msrp = unit.wI_ListPrice;
  const salePrice = unit.websitePrice ?? 0;
  const hasWebsitePrice = salePrice > 0;
  const hasRebateBreakdown = Boolean(unit.rebate?.amount && unit.rebate.amount > 0) && !unit.isTooLowToShow;
  const netAfterRebate = hasRebateBreakdown ? Math.max(0, salePrice - (unit.rebate?.amount ?? 0)) : salePrice;

  const specLine = [
    unit.wI_Body,
    formatSlideouts(unit.slideOutsCount),
    unit.wI_Length > 0 ? `${unit.wI_Length} ft` : null,
  ]
    .filter(Boolean)
    .join('  •  ');

  const pricingBlock = (() => {
    if (unit.isTooLowToShow) {
      if (hasWebsitePrice || msrp > 0) {
        return (
          <div className="flex min-w-0 flex-col gap-1">
            {hasWebsitePrice ? (
              <p className="text-lg font-bold text-neutral-400 tabular-nums line-through decoration-neutral-400">
                {formatPrice(salePrice)}
              </p>
            ) : null}
          </div>
        );
      }
      return <p className="text-lg font-bold text-neutral-900">Call for price</p>;
    }

    if (!hasWebsitePrice) {
      return <p className="text-lg font-bold text-neutral-900">Call for price</p>;
    }

    const currentDisplay = hasRebateBreakdown ? netAfterRebate : salePrice;
    const saveFromMsrp = msrp > currentDisplay + 0.5 ? msrp - currentDisplay : 0;

    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-primary text-2xl leading-tight font-bold tracking-tight tabular-nums sm:text-[1.65rem]">
          {formatPrice(currentDisplay)}
        </p>
        {saveFromMsrp > 0 ? (
          <p className="text-sm font-semibold text-green-700 tabular-nums">You Save {formatPrice(saveFromMsrp)}</p>
        ) : null}
      </div>
    );
  })();

  return (
    <article
      tabIndex={0}
      className="relative flex w-full max-w-full min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-md outline-none select-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      <div className="relative">
        <div
          className="relative aspect-4/3 w-full overflow-hidden rounded-t-lg bg-white"
          ref={emblaRef}
          data-nested-embla-viewport=""
        >
          <div className="flex h-full touch-pan-y">
            {slides.map((src: string, i: number) => (
              <div key={`${unit.id}-landing-${i}`} className="relative min-h-0 min-w-0 shrink-0 grow-0 basis-full">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="pointer-events-none absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white tabular-nums">
            <Camera className="size-3 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
            <span>
              {slideIndex + 1}/{slides.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 px-3 pt-2 pb-4 sm:px-4">
        <h3 className="line-clamp-2 text-base leading-snug font-bold tracking-tight text-neutral-900 sm:text-lg">
          {unit.title}
        </h3>
        {specLine ? <p className="text-sm leading-snug text-neutral-500">{specLine}</p> : null}
        <div className="flex flex-1">{pricingBlock}</div>

        <div className="mt-2 flex flex-col gap-2 lg:flex-row">
          {isAvailable && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                if (isAvailable) open();
                else router.push(`/inventory/${unit.id}`);
              }}
              className="min-h-10 flex-1 cursor-pointer gap-1.5 rounded-lg border-2 border-neutral-900 bg-white px-2 text-[10px] font-black tracking-wide text-neutral-900 uppercase hover:border-neutral-900 hover:bg-neutral-900/5 hover:text-neutral-900 sm:h-11 sm:gap-2 sm:px-3 sm:text-xs"
            >
              <Video className="size-3.5 shrink-0 sm:size-4" strokeWidth={2.25} aria-hidden />
              See it live
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/inventory/${unit.id}`);
            }}
            className="bg-primary hover:bg-primary/80 min-h-10 flex-1 cursor-pointer rounded-lg px-2 text-[10px] font-black tracking-wide text-white uppercase sm:h-11 sm:px-3 sm:text-xs"
          >
            Get best price
          </Button>
        </div>
      </div>
    </article>
  );
}
