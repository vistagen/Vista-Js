'use client';

import { usePathname } from 'vista/navigation';
import type { DocsNavigationGroup } from '../../lib/docs';
import { cn } from '../../lib/utils';

interface DocNavigationProps {
  navigation: DocsNavigationGroup[];
  onNavigate?: () => void;
  className?: string;
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  return pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export default function DocNavigation({ navigation, onNavigate, className }: DocNavigationProps) {
  const pathname = normalizePath(usePathname() || '/');

  return (
    <nav className={className}>
      {navigation.map((group) => (
        <section key={group.id} className="mb-8">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.docs.map((doc) => {
              const isActive = pathname === normalizePath(doc.href);
              return (
                <li key={doc.href}>
                  <a
                    href={doc.href}
                    onClick={onNavigate}
                    className={cn(
                      'group block rounded-lg border border-transparent px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/60 hover:text-zinc-100'
                    )}
                  >
                    <p className="font-medium">{doc.title}</p>
                    <p className={cn('mt-1 text-xs leading-relaxed', isActive ? 'text-primary/70' : 'text-zinc-500')}>
                      {doc.summary}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
