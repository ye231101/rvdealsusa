import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { ViewProWidgetProvider } from '@/components/view-pro-widget-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RV Deals USA',
  description:
    'Tour hundreds of RVs from your couch. Live video walkthroughs, expert advice, and the best deals - no signup required.',
};

export const viewport: Viewport = {
  themeColor: '#1a2332',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <ViewProWidgetProvider>
          <Suspense>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />

            <Script src="https://viewpro.com/viewpro-widget.js?isVisible=false" strategy="afterInteractive" />

            <Analytics />
          </Suspense>
        </ViewProWidgetProvider>
      </body>
    </html>
  );
}
