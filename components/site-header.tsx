'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Phone, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { mapInventoryItem, type InventoryListResponse, type InventoryUnit } from '@/lib/types';

const PHONE_DISPLAY = '(786) 570-8584';
const PHONE_TEL = 'tel:1-786-570-8584';

const HEADER_SEARCH_PER_PAGE = 10;

const SEARCH_RV_TYPES = [
  { label: 'Class A', href: '/inventory?body=class-a', image: '/images/rv/class-a.svg' },
  { label: 'Class B', href: '/inventory?body=class-b', image: '/images/rv/class-b.svg' },
  { label: 'Class C', href: '/inventory?body=class-c', image: '/images/rv/class-c.svg' },
  { label: 'Towable', href: '/inventory?body=5th-wheel,travel-trailer,toy-hauler', image: '/images/rv/towable.svg' },
  { label: 'Overlander', href: '/inventory?rvType=overlander', image: '/images/rv/overlander.svg' },
  { label: 'Super C', href: '/inventory?rvType=super-c', image: '/images/rv/super-c.svg' },
  { label: 'Adventure Van', href: '/inventory?rvType=adventure-van', image: '/images/rv/adventure-van.svg' },
] as const;

function inventoryThumbSrc(unit: InventoryUnit): string {
  return unit.thumbnails?.[0] ?? unit.images?.[0] ?? unit.defaultImageUrl ?? '/images/photos_coming_soon.jpg';
}

function HeaderSearchInventoryRow({ unit }: { unit: InventoryUnit }) {
  const thumb = inventoryThumbSrc(unit);
  const typeLine = [unit.wI_Body, unit.wI_Fuel].filter(Boolean).join(' - ');

  return (
    <Link href={`/inventory/${unit.id}`} className="hover:bg-muted/60 flex gap-3 p-2 transition-colors">
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
        <Image src={thumb} alt="" fill className="object-cover" sizes="80px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-neutral-900">{unit.title}</p>
        <p className="text-muted-foreground text-xs font-normal">{unit.stockNumber}</p>
        {typeLine ? <p className="text-xs font-normal text-neutral-800">{typeLine}</p> : null}
        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs font-normal">
          <MapPin className="size-3 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{unit.location}</span>
        </p>
      </div>
    </Link>
  );
}

function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<InventoryUnit[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const blurSearchInput = () => {
    formRef.current?.querySelector<HTMLInputElement>('input[name="q"]')?.blur();
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openSearchMenu = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  useEffect(() => {
    setMenuOpen(false);
    clearCloseTimer();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        blurSearchInput();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    const q = inputValue.trim();

    if (q === '') {
      setSearchResults([]);
      return;
    }

    if (!menuOpen) {
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = (await api.get('inventory', {
          params: {
            currentPage: 1,
            perPage: HEADER_SEARCH_PER_PAGE,
            q,
          },
          signal: ac.signal,
        })) as InventoryListResponse;

        if (!res.data?.inventories) {
          setSearchResults([]);
          return;
        }
        setSearchResults(res.data.inventories.map(mapInventoryItem));
      } catch (err) {
        setSearchResults([]);
      }
    }, 320);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [inputValue, menuOpen]);

  const onSearchInputChange = (value: string) => {
    setInputValue(value);
    if (value !== '' || !searchParams.has('q')) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  return (
    <>
      {menuOpen && typeof document !== 'undefined'
        ? createPortal(
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default border-0 bg-black/50 p-0"
              aria-label="Dismiss search overlay"
              onMouseDown={(e) => {
                e.preventDefault();
                clearCloseTimer();
                setMenuOpen(false);
                blurSearchInput();
              }}
            />,
            document.body,
          )
        : null}
      <div className={cn('relative w-full min-w-0', className)}>
        <form ref={formRef} role="search" action="/inventory" method="get" className="relative w-full">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            name="q"
            type="search"
            value={inputValue}
            placeholder="Make, Model or Keyword"
            className="relative h-10 rounded-full border-gray-200 bg-gray-100 pr-4 pl-10 shadow-none"
            autoComplete="off"
            onChange={(e) => onSearchInputChange(e.target.value)}
            onFocus={openSearchMenu}
            onClick={openSearchMenu}
            onBlur={() => {
              clearCloseTimer();
              closeTimerRef.current = setTimeout(() => setMenuOpen(false), 120);
            }}
          />
          {menuOpen ? (
            <div
              className="absolute top-full right-0 left-0 z-10 mt-2 overflow-visible rounded-xl border border-neutral-200 bg-white shadow-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="relative z-0 p-4">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">RV types</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {SEARCH_RV_TYPES.map((cat) => (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className="flex flex-col items-center justify-center gap-2 rounded border border-neutral-200 p-2 text-center transition-colors hover:border-black"
                    >
                      <Image
                        src={cat.image}
                        alt=""
                        width={64}
                        height={48}
                        className="h-10 w-auto object-contain opacity-90"
                      />
                      <span className="text-[0.65rem] leading-tight font-bold tracking-wide text-neutral-800 uppercase">
                        {cat.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              {searchResults.length > 0 ? (
                <div className="absolute top-0 right-0 left-0 z-30 flex max-h-[min(70vh,28rem)] flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-neutral-200/80">
                  <div className="shrink-0 bg-sky-100 px-4 py-2.5 text-sm font-semibold text-sky-900">
                    Inventory Items
                  </div>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {searchResults.map((unit) => (
                      <HeaderSearchInventoryRow key={unit.id} unit={unit} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
      </div>
    </>
  );
}

function PhoneBlock({ compact }: { compact?: boolean }) {
  return (
    <a
      href={PHONE_TEL}
      className="text-foreground hover:text-foreground/80 shrink-0 transition-colors"
      aria-label={`Call ${PHONE_DISPLAY}`}
    >
      {compact ? (
        <span className="flex items-center justify-center rounded-full">
          <Phone className="size-5" aria-hidden />
        </span>
      ) : (
        <span className="flex items-center gap-1 text-sm font-medium">
          <Phone className="size-5 shrink-0" aria-hidden />
          {PHONE_DISPLAY}
        </span>
      )}
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white md:h-20">
      <div className="mx-auto flex h-full w-full justify-center px-4 py-3 sm:px-6 md:px-10 md:py-4">
        {/* Mobile */}
        <div className="flex flex-1 flex-col gap-3 md:hidden">
          <div className="relative flex min-h-10 items-center justify-center">
            <Link href="/" className="pointer-events-auto absolute min-w-0 shrink">
              <span className="inline-flex w-max flex-col items-stretch leading-none">
                <span className="text-3xl font-extrabold tracking-tight">
                  <span className="text-black">RV</span>
                  <span className="text-primary">DEALS</span>
                </span>
                <span className="flex w-full items-center gap-2">
                  <span className="bg-primary h-0.5 min-h-px min-w-4 flex-1" aria-hidden />
                  <span className="shrink-0 text-xs font-bold tracking-wide text-black uppercase">USA</span>
                  <span className="bg-primary h-0.5 min-h-px min-w-4 flex-1" aria-hidden />
                </span>
              </span>
            </Link>

            <div className="ml-auto shrink-0">
              <PhoneBlock compact />
            </div>
          </div>

          <HeaderSearch />
        </div>

        {/* Desktop */}
        <div className="hidden w-full min-w-0 items-center gap-4 sm:gap-6 md:flex md:gap-10">
          <Link href="/" className="min-w-0 shrink-0">
            <span className="inline-flex w-max flex-col items-stretch leading-none">
              <span className="text-3xl font-extrabold tracking-tight">
                <span className="text-black">RV</span>
                <span className="text-primary">DEALS</span>
              </span>
              <span className="flex w-full items-center gap-2">
                <span className="bg-primary h-0.5 min-h-px min-w-4 flex-1" aria-hidden />
                <span className="shrink-0 text-xs font-bold tracking-wide text-black uppercase">USA</span>
                <span className="bg-primary h-0.5 min-h-px min-w-4 flex-1" aria-hidden />
              </span>
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4 md:gap-6">
            <HeaderSearch className="max-w-xl" />
            <PhoneBlock />
          </div>
        </div>
      </div>
    </header>
  );
}
