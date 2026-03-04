import { getDocBySlugParts, getDocPath, getDocsNavigation } from '../../lib/docs';

export default function DocsPage() {
  const navigation = getDocsNavigation();
  const firstStepsDoc = getDocBySlugParts(['getting-started', 'first-steps']);
  const primaryCtaHref = firstStepsDoc
    ? getDocPath(firstStepsDoc)
    : navigation[0]?.docs[0]?.href || '/docs/introduction/the-beginning-of-vista';

  return (
    <article className="mx-auto max-w-3xl pb-20 pt-4">
      <header className="mb-12 border-b border-zinc-900 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Official Documentation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl">
          Build fast. Write less. Keep control.
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-300">
          Vista docs are now structured as category + slug routes, so you can scale guides and references without
          changing URLs later.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={primaryCtaHref}
            className="rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            Start with First Steps
          </a>
          <p className="text-sm text-zinc-500">Docs are actively evolving during alpha.</p>
        </div>
      </header>

      <section className="space-y-5">
        {navigation.map((group) => (
          <div key={group.id} className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{group.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{group.description}</p>
            </div>
            <ul className="space-y-2">
              {group.docs.map((doc) => (
                <li key={doc.href}>
                  <a
                    href={doc.href}
                    className="group flex items-start justify-between rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-zinc-800 hover:bg-zinc-900/80"
                  >
                    <span>
                      <span className="block text-sm font-medium text-zinc-200 group-hover:text-zinc-100">{doc.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{doc.summary}</span>
                    </span>
                    <span className="ml-4 mt-1 text-xs uppercase tracking-[0.12em] text-zinc-600">Open</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-6">
        <p className="text-sm uppercase tracking-[0.16em] text-zinc-500">Founder Quote</p>
        <p className="mt-3 text-lg leading-8 text-zinc-300">
          "Development should feel like momentum, not maintenance. Vista is built so product teams can ship more with
          fewer lines."
        </p>
        <p className="mt-4 text-sm font-medium text-zinc-500">Ankan Dalui, Founder, Vista.js</p>
      </section>
    </article>
  );
}
