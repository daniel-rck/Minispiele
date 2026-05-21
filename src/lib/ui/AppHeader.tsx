import type { ReactNode } from 'react';

export type AppHeaderProps = {
  title: string;
  logo?: ReactNode;
  actions?: ReactNode;
};

export function AppHeader({ title, logo, actions }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 shrink-0 border-b border-border bg-surface/95 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="container mx-auto max-w-7xl h-14 px-4 flex items-center justify-between gap-4 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          {logo ? <span className="text-accent-600 shrink-0">{logo}</span> : null}
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
