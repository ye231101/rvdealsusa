import Link from 'next/link';
import { Phone, Mail, Globe } from 'lucide-react';

const locationGruops = [
  {
    state: 'California',
    cities: [
      { city: 'San Diego', href: '/inventory?location=san-diego-ca' },
      { city: 'West Sacramento', href: '/inventory?location=west-sacramento-ca' },
      { city: 'Fremont', href: '/inventory?location=fremont-ca' },
    ],
  },
  {
    state: 'Florida',
    cities: [
      { city: 'Davie', href: '/inventory?location=davie-fl' },
      { city: 'Orlando (Sanford)', href: '/inventory?location=orlando-sanford-fl' },
      { city: 'Port St. Lucie', href: '/inventory?location=port-st-lucie-fl' },
      { city: 'Ft. Myers', href: '/inventory?location=ft-myers-fl' },
    ],
  },
  {
    state: 'Arizona',
    cities: [
      { city: 'Phoenix', href: '/inventory?location=phoenix-az' },
      { city: 'Mesa', href: '/inventory?location=mesa-az' },
      { city: 'Tucson', href: '/inventory?location=tucson-az' },
    ],
  },
  {
    state: 'New Mexico',
    cities: [{ city: 'Albuquerque', href: '/inventory?location=albuquerque-nm' }],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-3">
            <Link href="/" className="inline-block">
              <span className="inline-flex w-max flex-col items-stretch leading-none">
                <span className="text-3xl font-extrabold tracking-tight">
                  <span className="text-white">RV</span>
                  <span className="text-primary">DEALS</span>
                </span>
                <span className="flex w-full items-center gap-2">
                  <span className="bg-primary h-0.5 min-h-px min-w-4 flex-1" aria-hidden />
                  <span className="shrink-0 text-xs font-bold tracking-wide text-white uppercase">USA</span>
                  <span className="bg-primary h-0.5 min-h-px min-w-4 flex-1" aria-hidden />
                </span>
              </span>
            </Link>
            <p className="text-secondary-foreground/60 mt-4 text-xs leading-relaxed">
              RV Deals USA connects you with great RVs and competitive prices using inventory from La Mesa RV and our
              participating dealership partners.
            </p>
          </div>

          <div className="flex flex-col gap-10 md:col-span-9">
            <div>
              <h3 className="mb-4 text-sm font-bold tracking-wider uppercase">Contact Us</h3>
              <ul className="text-secondary-foreground/60 flex list-none flex-wrap items-center gap-x-8 gap-y-2 p-0 text-sm">
                <li>
                  <a href="tel:1-786-570-8584" className="flex items-center gap-2 transition-colors">
                    <span className="border-primary text-primary flex size-10 items-center justify-center rounded-full border-2">
                      <Phone className="size-5 shrink-0" strokeWidth={2} />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-secondary-foreground text-base">(786) 570-8584</span>
                      <span className="text-secondary-foreground/60 text-sm">Mon-Sat 9AM-6PM</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="mailto:help@rvdealsusa.com" className="group flex items-center gap-2 transition-colors">
                    <span className="border-primary text-primary flex size-10 items-center justify-center rounded-full border-2">
                      <Mail className="size-5 shrink-0" strokeWidth={2} />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-secondary-foreground text-base">help@rvdealsusa.com</span>
                      <span className="text-secondary-foreground/60 text-sm">We'll reply as soon as we can!</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://rvdealsusa.com" className="group flex items-center gap-2 transition-colors">
                    <span className="border-primary text-primary flex size-10 items-center justify-center rounded-full border-2">
                      <Globe className="size-5 shrink-0" strokeWidth={2} />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-secondary-foreground text-base">rvdealsusa.com</span>
                      <span className="text-secondary-foreground/60 text-sm">Shop our latest inventory</span>
                    </div>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-bold tracking-wider uppercase">Locations</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
                {locationGruops.map(({ state, cities }) => (
                  <div key={state}>
                    <p className="text-secondary-foreground mb-2.5 text-sm font-bold">{state}</p>
                    <ul className="space-y-2">
                      {cities.map(({ city, href }) => (
                        <li key={city} className="text-secondary-foreground/70 text-sm leading-snug">
                          <Link href={href} className="hover:text-primary transition-colors">
                            {city}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-secondary-foreground/10 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-5 text-xs md:flex-row md:justify-between md:px-6">
          <p className="text-secondary-foreground/40">
            Copyright &copy; {new Date().getFullYear()} RV Deals USA. All rights reserved.
          </p>
          <p className="text-secondary-foreground/40">
            Powered by <span className="text-secondary-foreground/60 font-semibold">ViewPro</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
