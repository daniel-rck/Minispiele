import type { ReactNode } from 'react';

interface GameFooterProps {
  children: ReactNode;
  className?: string;
}

export default function GameFooter({ children, className = '' }: GameFooterProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 border-t border-surface-200 bg-white/95 backdrop-blur dark:border-surface-800 dark:bg-surface-950/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className={`mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 ${className}`.trim()}>
        {children}
      </div>
    </div>
  );
}
