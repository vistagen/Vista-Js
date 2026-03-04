import type { ReactNode } from 'react';
import { BookMarked } from 'lucide-react';
import { getDocsNavigation } from '../../lib/docs';
import DocNavigation from './doc-navigation';
import MobileNavigation from './mobile-nav';
import TableOfContents from './table-of-contents';

interface DocsLayoutProps {
  children: ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const navigation = getDocsNavigation();

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-primary/20 selection:text-primary">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="sticky top-16 z-40 border-y border-zinc-900/80 bg-black/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
            <a href="/docs" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-100">
              <BookMarked className="h-4 w-4 text-primary" />
              Vista Docs
            </a>
            <div className="flex items-center gap-2">
              <TableOfContents mode="mobile-trigger" />
              <div className="lg:hidden">
                <MobileNavigation navigation={navigation} />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]">
          <aside className="hidden border-r border-zinc-900/70 lg:block">
            <div className="sticky top-[8.25rem] max-h-[calc(100vh-8.5rem)] overflow-y-auto px-4 py-8">
              <DocNavigation navigation={navigation} />
            </div>
          </aside>

          <section className="min-w-0 px-5 py-10 sm:px-8">{children}</section>

          <aside className="hidden border-l border-zinc-900/70 px-4 py-8 xl:block">
            <div className="sticky top-[8.25rem]">
              <TableOfContents mode="desktop" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
