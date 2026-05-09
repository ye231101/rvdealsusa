import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { InventoryUnit } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function formatMileage(mileage: number): string {
  if (mileage === 0) return '0 miles';
  return `${mileage.toLocaleString('en-US')} miles`;
}

export function formatSlideouts(slideOutsCount: number): string {
  if (slideOutsCount === 0) return '0 Slideout';
  return `${slideOutsCount} Slideout${slideOutsCount === 1 ? '' : 's'}`;
}

export function rebateEndsLabel(enddate: number): string | null {
  if (!enddate) return null;
  const d = new Date(enddate * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return `Rebate ends on ${d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export const bodies = [
  { label: 'Class A', value: 'class-a' },
  { label: 'Class B', value: 'class-b' },
  { label: 'Class C', value: 'class-c' },
  { label: 'Travel Trailer', value: 'travel-trailer' },
  { label: 'Toy Hauler', value: 'toy-hauler' },
  { label: '5th Wheel', value: '5th-wheel' },
];

export const makes = [
  { label: 'Entegra', value: 'entegra' },
  { label: 'Thor Motor Coach', value: 'thor-motor-coach' },
  { label: 'Winnebago', value: 'winnebago' },
  { label: 'Tiffin', value: 'tiffin' },
  { label: 'Jayco', value: 'jayco' },
  { label: 'Fleetwood', value: 'fleetwood' },
  { label: 'Grand Design', value: 'grand-design' },
  { label: 'Midwest Automotive Designs', value: 'midwest-automotive-designs' },
  { label: 'Grech RV', value: 'grech-rv' },
  { label: 'Pleasure Way', value: 'pleasure-way' },
  { label: 'Winnebago Towables', value: 'winnebago-towables' },
  { label: 'REV Renegade', value: 'rev-renegade' },
  { label: 'Newmar', value: 'newmar' },
  { label: 'Brinkley RV', value: 'brinkley-rv' },
  { label: 'Leisure Travel Vans', value: 'leisure-travel-vans' },
  { label: 'Forest River', value: 'forest-river' },
  { label: 'Storyteller Overland', value: 'storyteller-overland' },
  { label: 'Coachmen', value: 'coachmen' },
  { label: 'Keystone', value: 'keystone' },
  { label: 'Airstream', value: 'airstream' },
  { label: 'Holiday Rambler', value: 'holiday-rambler' },
  { label: 'Dynamax', value: 'dynamax' },
  { label: 'Roadtrek', value: 'roadtrek' },
  { label: 'Vanleigh', value: 'vanleigh' },
  { label: 'Other Make', value: 'other-make' },
  { label: 'Monaco', value: 'monaco' },
  { label: 'Itasca', value: 'itasca' },
  { label: 'Phoenix', value: 'phoenix' },
  { label: 'Regency', value: 'regency' },
  { label: 'Heartland', value: 'heartland' },
];

export const models = [
  { label: 'ACCESS', value: 'access' },
  { label: 'ACCOLADE', value: 'accolade' },
  { label: 'ACCOLADE XL', value: 'accolade-xl' },
  { label: 'ACCOLADE XT', value: 'accolade-xt' },
  { label: 'ACE', value: 'ace' },
  { label: 'ADMIRAL', value: 'admiral' },
  { label: 'ADVENTURER', value: 'adventurer' },
  { label: 'ADVENTUROUS', value: 'adventurous' },
  { label: 'AIRSTREAM', value: 'airstream' },
  { label: 'ALANTE', value: 'alante' },
  { label: 'ALANTE SE', value: 'alante-se' },
  { label: 'ALITA', value: 'alita' },
  { label: 'ALLEGRO', value: 'allegro' },
  { label: 'ALLEGRO BAY', value: 'allegro-bay' },
  { label: 'ALLEGRO BUS', value: 'allegro-bus' },
  { label: 'ALLEGRO RED', value: 'allegro-red' },
  { label: 'ALLEGRO RED 360', value: 'allegro-red-360' },
  { label: 'ALPINE', value: 'alpine' },
  { label: 'AMERICAN PATRIOT', value: 'american-patriot' },
  { label: 'ANTHEM', value: 'anthem' },
  { label: 'ARC', value: 'arc' },
  { label: 'ARIA', value: 'aria' },
  { label: 'ASCENT', value: 'ascent' },
  { label: 'ASPEN TRAIL', value: 'aspen-trail' },
  { label: 'ASTORIA', value: 'astoria' },
  { label: 'ATLAS', value: 'atlas' },
  { label: 'AXIS', value: 'axis' },
  { label: 'BAY SAR', value: 'bay-sar' },
  { label: 'BAY STAR', value: 'bay-star' },
  { label: 'BAY STAR SPORT', value: 'bay-star-sport' },
  { label: 'BAYSTAR', value: 'baystar' },
  { label: 'BAYSTAR SPORT', value: 'baystar-sport' },
  { label: 'BEACON', value: 'beacon' },
  { label: 'BEAST MODE', value: 'beast-mode' },
  { label: 'BIG COUNTRY', value: 'big-country' },
  { label: 'BIGHORN', value: 'bighorn' },
  { label: 'BOLDT', value: 'boldt' },
  { label: 'BOUNDER', value: 'bounder' },
  { label: 'BREEZE', value: 'breeze' },
  { label: 'BYWAY', value: 'byway' },
  { label: 'CENTURION', value: 'centurion' },
  { label: 'CHALLLENGER', value: 'challenger' },
  { label: 'CHATEAU', value: 'chateau' },
  { label: 'CHATEAU SPRINTER', value: 'chateau-sprinter' },
  { label: 'COMET', value: 'comet' },
  { label: 'COMPASS', value: 'compass' },
  { label: 'COMPASS AWD', value: 'compass-awd' },
  { label: 'COMPASS GO', value: 'compass-go' },
  { label: 'CONDOR', value: 'condor' },
  { label: 'COUGAR', value: 'cougar' },
  { label: 'CREW MODE', value: 'crew-mode' },
  { label: 'CYCLONE', value: 'cyclone' },
  { label: 'DARK MODE', value: 'dark-mode' },
  { label: 'DAZZLE', value: 'dazzle' },
  { label: 'DELANO', value: 'delano' },
  { label: 'DISCOVERY', value: 'discovery' },
  { label: 'DISCOVERY LXE', value: 'discovery-lxe' },
  { label: 'DUTCH STAR', value: 'dutch-star' },
  { label: 'ECLIPSE', value: 'eclipse' },
  { label: 'EDDIE BAUER', value: 'eddie-bauer' },
  { label: 'EKKO', value: 'ekko' },
  { label: 'ENCORE', value: 'encore' },
  { label: 'ENTRADA', value: 'entrada' },
  { label: 'ERA', value: 'era' },
  { label: 'ESSEX', value: 'essex' },
  { label: 'ESTEEM', value: 'esteem' },
  { label: 'ESTEEM XL', value: 'esteem-xl' },
  { label: 'ETHOS', value: 'ethos' },
  { label: 'EXCURSION', value: 'excursion' },
  { label: 'EXPANSE', value: 'expanse' },
  { label: 'EXPANSE LI', value: 'expanse-li' },
  { label: 'FLAIR', value: 'flair' },
  { label: 'FLEX', value: 'flex' },
  { label: 'FORESTER', value: 'forester' },
  { label: 'FORTIS', value: 'fortis' },
  { label: 'FORZA', value: 'forza' },
  { label: 'FOUR WINDS', value: 'four-winds' },
  { label: 'FR3', value: 'fr3' },
  { label: 'FREEDOM ELITE', value: 'freedom-elite' },
  { label: 'FREELANDER', value: 'freelander' },
  { label: 'FRONTIER', value: 'frontier' },
  { label: 'FUZION', value: 'fuzion' },
  { label: 'GALLERIA', value: 'galleria' },
  { label: 'GEMINI', value: 'gemini' },
  { label: 'GEMINI TRIP', value: 'gemini-trip' },
  { label: 'GENEVA', value: 'geneva' },
  { label: 'GEORGETOWN', value: 'georgetown' },
  { label: 'GEORGETOWN XL', value: 'georgetown-xl' },
  { label: 'GRANITE RIDGE', value: 'granite-ridge' },
  { label: 'GREY WOLF', value: 'grey-wolf' },
  { label: 'GREYHAWK', value: 'greyhawk' },
  { label: 'GREYHAWK XL', value: 'greyhawk-xl' },
  { label: 'GXV', value: 'gxv' },
  { label: 'HERITAGE', value: 'heritage' },
  { label: 'HURRICANE', value: 'hurricane' },
  { label: 'IMAGINE', value: 'imagine' },
  { label: 'IMAGINE XLS', value: 'imagine-xls' },
  { label: 'INTERSTATE', value: 'interstate' },
  { label: 'INVICTA', value: 'invicta' },
  { label: 'ISATA', value: 'isata' },
  { label: 'ISATA 3', value: 'isata-3' },
  { label: 'ISATA 3 SERIES', value: 'isata-3-series' },
  { label: 'ISATA 5', value: 'isata-5' },
  { label: 'ISATA 5 SERIES', value: 'isata-5-series' },
  { label: 'ISATA SERIES 3', value: 'isata-series-3' },
  { label: 'ISATA SERIES 5', value: 'isata-series-5' },
  { label: 'ISTATA 3', value: 'istata-3' },
  { label: 'JAYFEATHER', value: 'jayfeather' },
  { label: 'JAYFLIGHT', value: 'jayflight' },
  { label: 'JOURNEY', value: 'journey' },
  { label: 'KNIGHT', value: 'knight' },
  { label: 'KODIAK', value: 'kodiak' },
  { label: 'KOUNTRY STAR', value: 'kountry-star' },
  { label: 'LEGEND', value: 'legend' },
  { label: 'LEPRECHAUN', value: 'leprechaun' },
  { label: 'LEXINGTON', value: 'lexington' },
  { label: 'LEXOR TS', value: 'lexor-ts' },
  { label: 'LINEAGE', value: 'lineage' },
  { label: 'LINEAGE F SERIES', value: 'lineage-f-series' },
  { label: 'LINEAGE SERIES F', value: 'lineage-series-f' },
  { label: 'LINEAGE SERIES M', value: 'lineage-series-m' },
  { label: 'LINEAGE SERIES VP', value: 'lineage-series-vp' },
  { label: 'LINEAGE SERIES VT', value: 'lineage-series-vt' },
  { label: 'LUSSO', value: 'lussso' },
  { label: 'LUXE', value: 'luxe' },
  { label: 'LUXE CRUISER', value: 'luxe-cruiser' },
  { label: 'MAGNITUDE', value: 'magnitude' },
  { label: 'MAGNITUDE GRAND', value: 'magnitude-grand' },
  { label: 'MBH ETHOS', value: 'mbh-ethos' },
  { label: 'MELBOURNE', value: 'melbourne' },
  { label: 'MELBOURNE PRESTIGE', value: 'melbourne-prestige' },
  { label: 'MICRO MINNIE-TT', value: 'micro-minnie-tt' },
  { label: 'MIDAS', value: 'midas' },
  { label: 'MILESTONE', value: 'milestone' },
  { label: 'MINNIE WINNIE', value: 'minnie-winnie' },
  { label: 'MIRADA', value: 'mirada' },
  { label: 'MIRAMAR', value: 'miramar' },
  { label: 'MODE', value: 'mode' },
  { label: 'MODEL G', value: 'model-g' },
  { label: 'MODEL GX', value: 'model-gx' },
  { label: 'MODEL I', value: 'model-i' },
  { label: 'MODEL IX', value: 'model-ix' },
  { label: 'MODEL Z', value: 'model-z' },
  { label: 'MODEL Z AIR', value: 'model-z-air' },
  { label: 'MOMENTUM', value: 'momentum' },
  { label: 'MONTANA', value: 'montana' },
  { label: 'NAUTICA', value: 'nautica' },
  { label: 'NAVIGATOR', value: 'navigator' },
  { label: 'NAVION', value: 'navion' },
  { label: 'NEW AIRE', value: 'new-aire' },
  { label: 'NO BOUNDRIES', value: 'no-boundaries' },
  { label: 'NORTH TRAIL', value: 'north-trail' },
  { label: 'ODYSSEY', value: 'odyssey' },
  { label: 'ODYSSEY SE', value: 'odyssey-se' },
  { label: 'OMNI', value: 'omni' },
  { label: 'OMNI TRAIL', value: 'omni-trail' },
  { label: 'ONTOUR', value: 'ontour' },
  { label: 'OPEN ROAD', value: 'open-road' },
  { label: 'OPEN TRAIL', value: 'open-trail' },
  { label: 'PACE ARROW', value: 'pace-arrow' },
  { label: 'PALAZZO', value: 'palazzo' },
  { label: 'PALLADIUM', value: 'palladium' },
  { label: 'PASADENA', value: 'pasadena' },
  { label: 'PASSAGE', value: 'passage' },
  { label: 'PATRIOT', value: 'patriot' },
  { label: 'PATRIOT 144', value: 'patriot-144' },
  { label: 'PATRIOT CRUISER', value: 'patriot-cruiser' },
  { label: 'PHAETON', value: 'phaeton' },
  { label: 'PHOENIX CRUISER', value: 'phoenix-cruiser' },
  { label: 'PLATEAU', value: 'plateau' },
  { label: 'PLATEAU FL', value: 'plateau-fl' },
  { label: 'PLATEAU TS', value: 'plateau-ts' },
  { label: 'PLATEAU XL', value: 'plateau-xl' },
  { label: 'PLAY', value: 'play' },
  { label: 'PRECEPT', value: 'precept' },
  { label: 'PRISM ELITE', value: 'prism-elite' },
  { label: 'PROWLER', value: 'prowler' },
  { label: 'PROWLER LYNX', value: 'prowler-lynx' },
  { label: 'PURSUIT', value: 'pursuit' },
  { label: 'QUANTUM', value: 'quantum' },
  { label: 'QUANTUM LC', value: 'quantum-lc' },
  { label: 'QWEST', value: 'qwest' },
  { label: 'QWEST SE', value: 'qwest-se' },
  { label: 'REDHAWK', value: 'redhawk' },
  { label: 'REFLECTION 5TH', value: 'reflection-5th' },
  { label: 'RENEGADE VIENNA', value: 'renegade-vienna' },
  { label: 'REVEL', value: 'revel' },
  { label: 'REVEL SPORT', value: 'revel-sport' },
  { label: 'RIZE', value: 'rize' },
  { label: 'ROADTREK', value: 'roadtrek' },
  { label: 'SALEM CRUISER LITE', value: 'salem-cruiser-lite' },
  { label: 'SANCTUARY', value: 'sanctuary' },
  { label: 'SCOPE', value: 'scope' },
  { label: 'SENECA', value: 'seneca' },
  { label: 'SENECA PRESTIGE', value: 'seneca-prestige' },
  { label: 'SENECA XT', value: 'seneca-xt' },
  { label: 'SEQUENCE', value: 'sequence' },
  { label: 'SIGHTSEER', value: 'sightseer' },
  { label: 'SIGNATURE SERIES', value: 'signature-series' },
  { label: 'SOLERA', value: 'solera' },
  { label: 'SOLIS', value: 'solis' },
  { label: 'SOLIS POCKET', value: 'solis-pocket' },
  { label: 'SOLITUDE', value: 'solitude' },
  { label: 'SOLITUDE INFLUENCE', value: 'solitude-influence' },
  { label: 'SOLSTICE', value: 'solstice' },
  { label: 'SOUTHWIND', value: 'southwind' },
  { label: 'SPIRIT', value: 'spirit' },
  { label: 'SPORTSCOACH', value: 'sportscoach' },
  { label: 'STRADA ION TOUR', value: 'strada-ion-tour' },
  { label: 'STRADA-ION', value: 'strada-ion' },
  { label: 'STRADA-ION AWD', value: 'strada-ion-awd' },
  { label: 'SUNCRUISER', value: 'suncruiser' },
  { label: 'SUNDANCE', value: 'sundance' },
  { label: 'SUNDANCE XLT', value: 'sundance-xlt' },
  { label: 'SUNDANCE XLT TRAILER', value: 'sundance-xlt-trailer' },
  { label: 'SUNSEEKER', value: 'sunseeker' },
  { label: 'SUNSTAR', value: 'sunstar' },
  { label: 'SUPREME AIRE', value: 'supreme-aire' },
  { label: 'SWIFT', value: 'swift' },
  { label: 'SYNERGY', value: 'synergy' },
  { label: 'TALAVERA', value: 'talavera' },
  { label: 'TELLARO', value: 'tellaro' },
  { label: 'TERRENO ION', value: 'terreno-ion' },
  { label: 'THRIVE', value: 'thrive' },
  { label: 'TIBURON', value: 'tiburon' },
  { label: 'TIFFIN', value: 'tiffin' },
  { label: 'TIMBER RIDGE', value: 'timber-ridge' },
  { label: 'TRANQUILITY', value: 'tranquility' },
  { label: 'TRANSCEND', value: 'transcend' },
  { label: 'TRANSCEND ONE', value: 'transcend-one' },
  { label: 'TRANSCEND XPLOR', value: 'transcend-xplor' },
  { label: 'TRAVATO', value: 'travato' },
  { label: 'TURISMO-I', value: 'turismo-i' },
  { label: 'TURISMO-ION', value: 'turismo-ion' },
  { label: 'ULTRA BROUGHAM', value: 'ultra-brougham' },
  { label: 'UNITY', value: 'unity' },
  { label: 'VACANZA-ION', value: 'vacanza-ion' },
  { label: 'VACATIONER', value: 'vacationer' },
  { label: 'VALENCIA', value: 'valencia' },
  { label: 'VEGAS', value: 'vegas' },
  { label: 'VENTANA', value: 'ventana' },
  { label: 'VENTANA LE', value: 'ventana-le' },
  { label: 'VERACRUZ', value: 'veracruz' },
  { label: 'VERONA', value: 'verona' },
  { label: 'VERONA LE', value: 'verona-le' },
  { label: 'VIA', value: 'via' },
  { label: 'VIENNA', value: 'vienna' },
  { label: 'VIEW', value: 'view' },
  { label: 'VILANO', value: 'vilano' },
  { label: 'VILLAGIO', value: 'villagio' },
  { label: 'VISION', value: 'vision' },
  { label: 'VISION SE', value: 'vision-se' },
  { label: 'VISION XL', value: 'vision-xl' },
  { label: 'VISTA', value: 'vista' },
  { label: 'VITA', value: 'vita' },
  { label: 'VOLTAGE', value: 'voltage' },
  { label: 'WAYFARER', value: 'wayfarer' },
  { label: 'WINDSPORT', value: 'windsport' },
  { label: 'WONDER', value: 'wonder' },
  { label: 'ZEPHYR', value: 'zephyr' },
  { label: 'ZION', value: 'zion' },
];

export const inventoryTypes = [
  { label: 'New', value: 'new' },
  { label: 'Used', value: 'used' },
];

export const sortByOptions = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];

export type SortByValue = (typeof sortByOptions)[number]['value'];

export const minPrices = [
  { label: '$25,000', value: '25000' },
  { label: '$50,000', value: '50000' },
  { label: '$75,000', value: '75000' },
  { label: '$100,000', value: '100000' },
  { label: '$250,000', value: '250000' },
  { label: '$500,000', value: '500000' },
  { label: '$750,000', value: '750000' },
  { label: '$1,000,000', value: '1000000' },
];

export const maxPrices = [
  { label: '$25,000', value: '25000' },
  { label: '$50,000', value: '50000' },
  { label: '$75,000', value: '75000' },
  { label: '$100,000', value: '100000' },
  { label: '$250,000', value: '250000' },
  { label: '$500,000', value: '500000' },
  { label: '$750,000', value: '750000' },
  { label: '$1,000,000', value: '1000000' },
];

export const lengthOptions = [
  { label: 'Under 25 ft', value: 'compact' },
  { label: '25-35 ft', value: 'mid' },
  { label: 'Over 35 ft', value: 'long' },
];

export const locations = [
  { label: 'San Diego, CA', value: 'san-diego-ca' },
  { label: 'West Sacramento, CA', value: 'west-sacramento-ca' },
  { label: 'Fremont, CA', value: 'fremont-ca' },
  { label: 'Davie, FL', value: 'davie-fl' },
  { label: 'Orlando (Sanford), FL', value: 'orlando-sanford-fl' },
  { label: 'Port St. Lucie, FL', value: 'port-st-lucie-fl' },
  { label: 'Ft. Myers, FL', value: 'ft-myers-fl' },
  { label: 'Phoenix, AZ', value: 'phoenix-az' },
  { label: 'Mesa, AZ', value: 'mesa-az' },
  { label: 'Tucson, AZ', value: 'tucson-az' },
  { label: 'Albuquerque, NM', value: 'albuquerque-nm' },
];

export const locationRegions = [
  {
    id: 'east-coast',
    label: 'East Coast',
    values: ['port-st-lucie-fl', 'orlando-sanford-fl', 'ft-myers-fl', 'davie-fl'],
  },
  {
    id: 'west-coast',
    label: 'West Coast',
    values: [
      'phoenix-az',
      'west-sacramento-ca',
      'tucson-az',
      'mesa-az',
      'san-diego-ca',
      'albuquerque-nm',
      'fremont-ca',
    ],
  },
] as const;

export function locationLabelFromValue(value: string): string {
  return locations.find((l) => l.value === value)?.label ?? '';
}

export function labelFromValue(value: string): string {
  const parts = value.split(/[-_\s]+/).filter(Boolean);
  if (parts.length === 0) return value.trim();
  return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function labelFromCustomTags(customTags: string[] | undefined, key: string): string | null {
  if (!customTags?.length) return null;
  const tag = customTags.find((t) => t.startsWith(`${key}:`));
  if (!tag) return null;
  const value = tag.split(':')[1].trim();
  if (!value) return null;
  return labelFromValue(value);
}

export function getInventoryPricing(unit: InventoryUnit) {
  const num = (value: number | undefined) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const firstPositive = (...values: number[]) => values.find((value) => value > 0) ?? 0;

  const msrp = num(unit.wI_ListPrice);
  const mapPrice = num(unit.wI_MapPrice);
  const salePrice = num(unit.wI_SalePrice);
  const websitePrice = num(unit.websitePrice);
  const rebateAmount = num(unit.rebate?.amount);

  const displayPrice = firstPositive(websitePrice, salePrice, mapPrice, msrp);
  const netPrice = displayPrice > 0 && rebateAmount > 0 ? Math.max(displayPrice - rebateAmount, 0) : displayPrice;

  const discountAmount = msrp && displayPrice && msrp > displayPrice ? msrp - displayPrice : 0;
  const savingAmount = msrp && netPrice && msrp > netPrice ? msrp - netPrice : 0;
  const percentOff = savingAmount && msrp ? Math.round((savingAmount / msrp) * 100) : 0;

  const isTooLowToShow = Boolean(unit.isTooLowToShow);

  return {
    msrp,
    mapPrice,
    salePrice,
    websitePrice,
    rebateAmount,
    displayPrice,
    netPrice,
    discountAmount,
    savingAmount,
    percentOff,

    isTooLowToShow,

    showDetailedBreakdown: Boolean(rebateAmount && displayPrice && !isTooLowToShow),
  };
}
