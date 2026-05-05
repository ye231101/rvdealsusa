'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ViewProWidgetUser = {
  username: string;
  name: string;
  avatar: string;
  status: string;
};

type ViewProWidget = {
  isAvailable?: () => boolean;
  users?: () => ViewProWidgetUser[];
  open?: () => void;
};

declare global {
  interface Window {
    ViewProWidget?: ViewProWidget;
  }
}

function getViewProWidget(): ViewProWidget | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.ViewProWidget;
}

function openViewProWidget(): void {
  getViewProWidget()?.open?.();
}

const POLL_MS = 100;

export type ViewProWidgetContextValue = {
  isAvailable: boolean;
  users: ViewProWidgetUser[];
  open: () => void;
};

const ViewProWidgetContext = createContext<ViewProWidgetContextValue | null>(null);

export function ViewProWidgetProvider({ children }: { children: ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [users, setUsers] = useState<ViewProWidgetUser[]>([]);

  useEffect(() => {
    const tick = () => {
      const w = getViewProWidget();
      setIsAvailable(!!w?.isAvailable?.());
      setUsers(w?.users?.() ?? []);
    };
    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const open = useCallback(() => {
    openViewProWidget();
  }, []);

  const value = useMemo(
    () => ({
      isAvailable,
      users,
      open,
    }),
    [isAvailable, users, open],
  );

  return <ViewProWidgetContext.Provider value={value}>{children}</ViewProWidgetContext.Provider>;
}

export function useViewProWidget(): ViewProWidgetContextValue {
  const ctx = useContext(ViewProWidgetContext);
  if (!ctx) {
    throw new Error('useViewProWidget must be used within ViewProWidgetProvider');
  }
  return ctx;
}
