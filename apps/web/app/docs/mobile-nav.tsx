'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'vista/link';
import { usePathname } from 'vista/navigation';
import type { DocsNavigationGroup } from '../../lib/docs';
import { cn } from '../../lib/utils';
import DocNavigation from './doc-navigation';

interface MobileNavigationProps {
  navigation: DocsNavigationGroup[];
}

export default function MobileNavigation({ navigation }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const lockedBodyRef = useRef<{
    scrollY: number;
    overflow: string;
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
  } | null>(null);

  useEffect(() => {
    // Ensure the backdrop never persists across route transitions.
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const bodyStyle = document.body.style;

    if (isOpen) {
      if (!lockedBodyRef.current) {
        lockedBodyRef.current = {
          scrollY: window.scrollY,
          overflow: bodyStyle.overflow,
          position: bodyStyle.position,
          top: bodyStyle.top,
          left: bodyStyle.left,
          right: bodyStyle.right,
          width: bodyStyle.width,
        };
      }

      bodyStyle.overflow = 'hidden';
      bodyStyle.position = 'fixed';
      bodyStyle.top = `-${lockedBodyRef.current.scrollY}px`;
      bodyStyle.left = '0';
      bodyStyle.right = '0';
      bodyStyle.width = '100%';
      return;
    }

    if (lockedBodyRef.current) {
      const { scrollY, overflow, position, top, left, right, width } = lockedBodyRef.current;
      bodyStyle.overflow = overflow;
      bodyStyle.position = position;
      bodyStyle.top = top;
      bodyStyle.left = left;
      bodyStyle.right = right;
      bodyStyle.width = width;
      window.scrollTo({ top: scrollY });
      lockedBodyRef.current = null;
    }
  }, [isOpen]);

  useEffect(
    () => () => {
      if (!lockedBodyRef.current) return;
      const bodyStyle = document.body.style;
      const { scrollY, overflow, position, top, left, right, width } = lockedBodyRef.current;
      bodyStyle.overflow = overflow;
      bodyStyle.position = position;
      bodyStyle.top = top;
      bodyStyle.left = left;
      bodyStyle.right = right;
      bodyStyle.width = width;
      window.scrollTo({ top: scrollY });
      lockedBodyRef.current = null;
    },
    []
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-200"
      >
        <Menu className="h-4 w-4" />
        Menu
      </button>

      {isOpen ? <button className="fixed inset-0 z-50 bg-black/70" onClick={() => setIsOpen(false)} /> : null}

      <aside
        data-lenis-prevent
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-[60] w-[86%] max-w-xs overflow-y-auto overscroll-contain border-r border-zinc-800 bg-black p-4 transition-transform touch-pan-y [-webkit-overflow-scrolling:touch]',
          isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-3">
          <Link
            href="/docs"
            onClick={() => setIsOpen(false)}
            className="text-sm font-semibold tracking-wide text-zinc-100"
          >
            Vista Docs
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Close docs navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <DocNavigation navigation={navigation} onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
