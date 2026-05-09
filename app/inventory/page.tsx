'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { LiveChatTab } from '@/components/live-chat-tab';
import { InventoryCard } from '@/components/inventory-card';
import { FilterMultiSelect } from '@/components/filter-multi-select';
import { FilterSortSelect } from '@/components/filter-sort-select';
import { LocationMultiSelect } from '@/components/location-multi-select';
import { TradePromoCard } from '@/components/trade-promo-card';
import { api } from '@/lib/api';
import { makes, models, inventoryTypes, locations, bodies, sortByOptions, type SortByValue } from '@/lib/utils';
import {
  mapInventoryItem,
  type InventoryListResponse,
  type InventoryPagination,
  type InventoryUnit,
} from '@/lib/types';

const BODY_VALUES = new Set(bodies.map((b) => b.value));
const MAKE_VALUES = new Set(makes.map((m) => m.value));
const MODEL_VALUES = new Set(models.map((m) => m.value));
const INVENTORY_TYPE_VALUES = new Set(inventoryTypes.map((i) => i.value));
const LOCATION_VALUES = new Set(locations.map((l) => l.value));
const SORTBY_VALUES = new Set<string>(sortByOptions.map((o) => o.value));

function parseCsvParams(searchParams: URLSearchParams, key: string, allowed: Set<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of searchParams.getAll(key)) {
    for (const part of raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      if (allowed.has(part) && !seen.has(part)) {
        seen.add(part);
        out.push(part);
      }
    }
  }
  out.sort();
  return out;
}

function parseSortByParam(value: string | null): SortByValue {
  if (value && SORTBY_VALUES.has(value)) {
    return value as SortByValue;
  }
  return 'recommended';
}

function visiblePageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | 'ellipsis')[] = [];
  const push = (v: number | 'ellipsis') => {
    if (items[items.length - 1] === v) return;
    items.push(v);
  };
  push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) push('ellipsis');
  for (let p = start; p <= end; p++) push(p);
  if (end < total - 1) push('ellipsis');
  if (total > 1) push(total);
  return items;
}

function pageGridItems(units: InventoryUnit[], page: number): ReactNode[] {
  if (units.length === 0) return [];
  if (units.length < 4) {
    return units.map((unit) => <InventoryCard key={unit.id} unit={unit} />);
  }
  const promo = <TradePromoCard key={`trade-promo-${page}`} />;
  if (units.length === 4) {
    return [...units.map((unit) => <InventoryCard key={unit.id} unit={unit} />), promo];
  }
  return [
    ...units.slice(0, 4).map((unit) => <InventoryCard key={unit.id} unit={unit} />),
    promo,
    ...units.slice(4).map((unit) => <InventoryCard key={unit.id} unit={unit} />),
  ];
}

function parsePageParam(value: string | null): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

function parseSizeParam(value: string | null): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > 100) return 20;
  return parsed;
}

async function fetchInventories(params: {
  type: 'deals' | null;
  currentPage: number;
  perPage: number;
  minPrice: string | null;
  maxPrice: string | null;
  minLength: string | null;
  maxLength: string | null;
  q: string | null;
  rvType: string | null;
  filterBodies: string[];
  filterMakes: string[];
  filterModels: string[];
  filterInventoryTypes: string[];
  filterLocations: string[];
  sortBy: SortByValue;
}): Promise<{ inventories: InventoryUnit[]; pagination: InventoryPagination }> {
  const query: Record<string, string | number> = {
    currentPage: params.currentPage,
    perPage: params.perPage,
  };
  if (params.type === 'deals') {
    query.type = 'deals';
  }
  if (params.minPrice != null && params.minPrice !== '') {
    query.minPrice = params.minPrice;
  }
  if (params.maxPrice != null && params.maxPrice !== '') {
    query.maxPrice = params.maxPrice;
  }
  if (params.minLength != null && params.minLength !== '') {
    query.minLength = params.minLength;
  }
  if (params.maxLength != null && params.maxLength !== '') {
    query.maxLength = params.maxLength;
  }
  if (params.q != null && params.q !== '') {
    query.q = params.q;
  }
  if (params.rvType != null && params.rvType !== '') {
    query.rvType = params.rvType;
  }
  if (params.filterBodies.length > 0) {
    query.body = params.filterBodies.join(',');
  }
  if (params.filterMakes.length > 0) {
    query.make = params.filterMakes.join(',');
  }
  if (params.filterModels.length > 0) {
    query.model = params.filterModels.join(',');
  }
  if (params.filterInventoryTypes.length > 0) {
    query.inventoryType = params.filterInventoryTypes.join(',');
  }
  if (params.filterLocations.length > 0) {
    query.location = params.filterLocations.join(',');
  }
  if (params.sortBy !== 'recommended') {
    query.sortBy = params.sortBy;
  }

  const res = (await api.get('inventory', {
    params: query,
  })) as InventoryListResponse;

  const { inventories, pagination } = res.data;
  return {
    inventories: inventories.map(mapInventoryItem),
    pagination,
  };
}

function buildInventoryQuery(params: {
  type: 'deals' | null;
  page: number;
  perPage: number;
  minPrice: string | null;
  maxPrice: string | null;
  minLength: string | null;
  maxLength: string | null;
  q: string | null;
  rvType: string | null;
  filterBodies: string[];
  filterMakes: string[];
  filterModels: string[];
  filterInventoryTypes: string[];
  filterLocations: string[];
  sortBy: SortByValue;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.type === 'deals') searchParams.set('type', 'deals');
  if (params.page > 1) searchParams.set('page', String(params.page));
  if (params.perPage !== 20) searchParams.set('size', String(params.perPage));
  if (params.minPrice != null && params.minPrice !== '') searchParams.set('minPrice', params.minPrice);
  if (params.maxPrice != null && params.maxPrice !== '') searchParams.set('maxPrice', params.maxPrice);
  if (params.minLength != null && params.minLength !== '') searchParams.set('minLength', params.minLength);
  if (params.maxLength != null && params.maxLength !== '') searchParams.set('maxLength', params.maxLength);
  if (params.q != null && params.q !== '') searchParams.set('q', params.q);
  if (params.rvType != null && params.rvType !== '') searchParams.set('rvType', params.rvType);
  if (params.filterBodies.length > 0) searchParams.set('body', params.filterBodies.join(','));
  if (params.filterMakes.length > 0) searchParams.set('make', params.filterMakes.join(','));
  if (params.filterModels.length > 0) searchParams.set('model', params.filterModels.join(','));
  if (params.filterInventoryTypes.length > 0) searchParams.set('inventoryType', params.filterInventoryTypes.join(','));
  if (params.filterLocations.length > 0) searchParams.set('location', params.filterLocations.join(','));
  if (params.sortBy !== 'recommended') searchParams.set('sortBy', params.sortBy);
  return searchParams;
}

export default function InventoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inventoryQueryKey = searchParams.toString();

  const [pageUnits, setPageUnits] = useState<InventoryUnit[]>([]);
  const [pagination, setPagination] = useState<InventoryPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draftQ, setDraftQ] = useState(() => searchParams.get('q') ?? '');
  const [draftRvType, setDraftRvType] = useState(() => searchParams.get('rvType'));
  const [draftBodies, setDraftBodies] = useState(() => parseCsvParams(searchParams, 'body', BODY_VALUES));
  const [draftMakes, setDraftMakes] = useState(() => parseCsvParams(searchParams, 'make', MAKE_VALUES));
  const [draftModels, setDraftModels] = useState(() => parseCsvParams(searchParams, 'model', MODEL_VALUES));
  const [draftInventoryTypes, setDraftInventoryTypes] = useState(() =>
    parseCsvParams(searchParams, 'inventoryType', INVENTORY_TYPE_VALUES),
  );
  const [draftLocations, setDraftLocations] = useState(() => parseCsvParams(searchParams, 'location', LOCATION_VALUES));

  const skipScrollRef = useRef(true);

  const type = searchParams.get('type') === 'deals' ? 'deals' : null;
  const currentPage = parsePageParam(searchParams.get('page'));
  const perPage = parseSizeParam(searchParams.get('size'));
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const q = searchParams.get('q');
  const rvType = searchParams.get('rvType');
  const filterBodies = parseCsvParams(searchParams, 'body', BODY_VALUES);
  const filterMakes = parseCsvParams(searchParams, 'make', MAKE_VALUES);
  const filterModels = parseCsvParams(searchParams, 'model', MODEL_VALUES);
  const filterInventoryTypes = parseCsvParams(searchParams, 'inventoryType', INVENTORY_TYPE_VALUES);
  const filterLocations = parseCsvParams(searchParams, 'location', LOCATION_VALUES);
  const minLength = searchParams.get('minLength');
  const maxLength = searchParams.get('maxLength');
  const sortBy = parseSortByParam(searchParams.get('sortBy'));

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  useEffect(() => {
    setDraftQ(searchParams.get('q') ?? '');
    setDraftRvType(searchParams.get('rvType'));
    setDraftBodies(parseCsvParams(searchParams, 'body', BODY_VALUES));
    setDraftMakes(parseCsvParams(searchParams, 'make', MAKE_VALUES));
    setDraftModels(parseCsvParams(searchParams, 'model', MODEL_VALUES));
    setDraftInventoryTypes(parseCsvParams(searchParams, 'inventoryType', INVENTORY_TYPE_VALUES));
    setDraftLocations(parseCsvParams(searchParams, 'location', LOCATION_VALUES));
  }, [inventoryQueryKey, searchParams]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    const page = parsePageParam(searchParams.get('page'));
    const size = parseSizeParam(searchParams.get('size'));
    const sort = parseSortByParam(searchParams.get('sortBy'));
    fetchInventories({
      type,
      currentPage: page,
      perPage: size,
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      q: searchParams.get('q'),
      rvType: searchParams.get('rvType'),
      filterBodies: parseCsvParams(searchParams, 'body', BODY_VALUES),
      filterMakes: parseCsvParams(searchParams, 'make', MAKE_VALUES),
      filterModels: parseCsvParams(searchParams, 'model', MODEL_VALUES),
      filterInventoryTypes: parseCsvParams(searchParams, 'inventoryType', INVENTORY_TYPE_VALUES),
      filterLocations: parseCsvParams(searchParams, 'location', LOCATION_VALUES),
      minLength: searchParams.get('minLength'),
      maxLength: searchParams.get('maxLength'),
      sortBy: sort,
    })
      .then((res) => {
        if (ignore) return;
        setPageUnits(res.inventories);
        setPagination(res.pagination);
      })
      .catch((err: Error) => {
        if (ignore) return;
        setError(err.message || 'Failed to load inventories');
        setPageUnits([]);
        setPagination(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [inventoryQueryKey, searchParams]);

  useEffect(() => {
    if (!pagination) return;
    if (currentPage <= totalPages) return;
    const next = buildInventoryQuery({
      type,
      page: totalPages,
      perPage,
      minPrice,
      maxPrice,
      minLength,
      maxLength,
      q,
      rvType,
      filterBodies,
      filterMakes,
      filterModels,
      filterInventoryTypes,
      filterLocations,
      sortBy,
    });
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    type,
    currentPage,
    totalPages,
    pagination,
    perPage,
    minPrice,
    maxPrice,
    minLength,
    maxLength,
    q,
    rvType,
    filterBodies,
    filterMakes,
    filterModels,
    filterInventoryTypes,
    filterLocations,
    sortBy,
    pathname,
    router,
  ]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    document.getElementById('inventory')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [currentPage]);

  const gridItems = useMemo(() => pageGridItems(pageUnits, currentPage), [pageUnits, currentPage]);

  const pageItems = useMemo(() => visiblePageItems(currentPage, totalPages), [currentPage, totalPages]);

  const applySearch = () => {
    const q = draftQ.trim() || null;
    const rvType = draftRvType?.trim() || null;
    const next = buildInventoryQuery({
      type,
      page: 1,
      perPage,
      minPrice,
      maxPrice,
      minLength,
      maxLength,
      q,
      rvType,
      filterBodies: draftBodies,
      filterMakes: draftMakes,
      filterModels: draftModels,
      filterInventoryTypes: draftInventoryTypes,
      filterLocations: draftLocations,
      sortBy,
    });
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const applySort = (nextSort: SortByValue) => {
    const next = buildInventoryQuery({
      type,
      page: 1,
      perPage,
      minPrice,
      maxPrice,
      minLength,
      maxLength,
      q,
      rvType,
      filterBodies,
      filterMakes,
      filterModels,
      filterInventoryTypes,
      filterLocations,
      sortBy: nextSort,
    });
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const go = (p: number) => {
    const page = Math.min(Math.max(1, p), totalPages);
    const next = buildInventoryQuery({
      type,
      page,
      perPage,
      minPrice,
      maxPrice,
      minLength,
      maxLength,
      q,
      rvType,
      filterBodies,
      filterMakes,
      filterModels,
      filterInventoryTypes,
      filterLocations,
      sortBy,
    });
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    setDraftQ('');
    setDraftRvType(null);
    setDraftBodies([]);
    setDraftMakes([]);
    setDraftModels([]);
    setDraftInventoryTypes([]);
    setDraftLocations([]);
    router.push(pathname);
  };

  return (
    <section id="inventory" className="py-4 md:py-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {type !== 'deals' && (
          <div className="border-border bg-card mb-2 rounded-lg border p-4 md:mb-4 md:p-6">
            <div className="flex flex-col items-start justify-start gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Inventory</p>
                <h2 className="text-foreground text-xl font-extrabold tracking-tight md:text-2xl">
                  Find Your RV and See It Live
                </h2>
              </div>
            </div>

            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                applySearch();
              }}
            >
              <div className="relative min-w-0 flex-1 space-y-1">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  placeholder="Make, model, or keyword"
                  autoComplete="off"
                  className="h-10 pr-3 pl-9 shadow-none"
                />
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Button
                  type="submit"
                  size="lg"
                  className="h-10 min-w-28 flex-1 cursor-pointer font-bold sm:flex-initial"
                >
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-10 flex-1 cursor-pointer bg-neutral-50 font-bold text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900 sm:flex-initial"
                  onClick={clearFilters}
                >
                  <span className="hidden sm:inline">Clear filters</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              </div>
            </form>

            <div className="border-border bg-background mt-3 flex flex-col overflow-hidden rounded-lg border md:flex-row md:items-stretch">
              <div className="border-border flex min-w-0 flex-1 flex-col border-b px-2 py-1.5 md:border-r md:border-b-0 md:px-4 md:py-3">
                <span className="text-muted-foreground text-xs font-medium">RV Type</span>
                <FilterMultiSelect
                  options={bodies}
                  selected={draftBodies}
                  onChange={setDraftBodies}
                  allLabel="All types"
                  countNoun="types"
                  triggerClassName="w-full justify-between rounded-none border-0 mt-1 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="border-border flex min-w-0 flex-1 flex-col border-b px-2 py-1.5 md:border-r md:border-b-0 md:px-4 md:py-3">
                <span className="text-muted-foreground text-xs font-medium">Make</span>
                <FilterMultiSelect
                  options={makes}
                  selected={draftMakes}
                  onChange={setDraftMakes}
                  allLabel="All makes"
                  countNoun="makes"
                  triggerClassName="w-full justify-between rounded-none border-0 mt-1 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="border-border flex min-w-0 flex-1 flex-col border-b px-2 py-1.5 md:border-r md:border-b-0 md:px-4 md:py-3">
                <span className="text-muted-foreground text-xs font-medium">Model</span>
                <FilterMultiSelect
                  options={models}
                  selected={draftModels}
                  onChange={setDraftModels}
                  allLabel="All models"
                  countNoun="models"
                  triggerClassName="w-full justify-between rounded-none border-0 mt-1 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="border-border flex min-w-0 flex-1 flex-col border-b px-2 py-1.5 md:border-r md:border-b-0 md:px-4 md:py-3">
                <span className="text-muted-foreground text-xs font-medium">New/Used</span>
                <FilterMultiSelect
                  options={inventoryTypes}
                  selected={draftInventoryTypes}
                  onChange={setDraftInventoryTypes}
                  allLabel="All RVs"
                  countNoun="conditions"
                  triggerClassName="w-full justify-between rounded-none border-0 mt-1 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="border-border flex min-w-0 flex-1 flex-col border-b px-2 py-1.5 md:border-r md:border-b-0 md:px-4 md:py-3">
                <span className="text-muted-foreground text-xs font-medium">Location</span>
                <LocationMultiSelect
                  selected={draftLocations}
                  onChange={setDraftLocations}
                  triggerClassName="w-full justify-between rounded-none border-0 mt-1 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  contentClassName="min-w-[240px]"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col px-2 py-1.5 md:px-4 md:py-3">
                <span className="text-muted-foreground text-xs font-medium">Sort By</span>
                <FilterSortSelect
                  value={sortBy}
                  onChange={applySort}
                  triggerClassName="w-full justify-between rounded-none border-0 mt-1 shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  contentClassName="min-w-[240px]"
                />
              </div>
            </div>
          </div>
        )}

        {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-muted-foreground size-8" />
          </div>
        ) : (
          <div id="inventory-results" className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
            {gridItems}
          </div>
        )}

        {!loading && !error && pageUnits.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">No units match this page.</p>
        ) : null}

        {!loading && totalPages > 1 ? (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    go(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-40' : undefined}
                  aria-disabled={currentPage <= 1}
                />
              </PaginationItem>
              {pageItems.map((item, i) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      size="icon"
                      isActive={item === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    go(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : undefined}
                  aria-disabled={currentPage >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>

      <LiveChatTab />
    </section>
  );
}
