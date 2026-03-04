import {
  allDocs,
  docsCategoryConfig,
  type CollectedDoc,
  type DocsCategoryConfig,
  type DocsDocSection,
} from '../content/docs';

export interface DocsNavigationItem {
  title: string;
  summary: string;
  href: string;
  category: string;
  slug: string;
}

export interface DocsNavigationGroup {
  id: string;
  title: string;
  description: string;
  docs: DocsNavigationItem[];
}

export interface DocsHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export type DocsDoc = CollectedDoc;
export type DocsCategory = DocsCategoryConfig;

type RouteParamValue = string | string[] | undefined | null;

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-|-$/g, '');
}

function getCategoryOrder(id: string): number {
  return docsCategoryConfig.find((category) => normalizeToken(category.id) === normalizeToken(id))?.order ?? 999;
}

function sortDocs(docs: DocsDoc[]): DocsDoc[] {
  return [...docs].sort((a, b) => {
    const categoryOrderA = getCategoryOrder(a.category);
    const categoryOrderB = getCategoryOrder(b.category);
    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }
    return a.order - b.order;
  });
}

export function slugify(value: string): string {
  return normalizeToken(value).replace(/\//g, '-');
}

export function getDocPath(doc: Pick<DocsDoc, 'category' | 'slug'>): string {
  return `/docs/${normalizeToken(doc.category)}/${normalizeToken(doc.slug)}`;
}

export function getAllDocs(): DocsDoc[] {
  return sortDocs(allDocs);
}

export function getAllDocSlugParts(): string[][] {
  return getAllDocs().map((doc) => doc._meta.path.split('/').map((token) => normalizeToken(token)));
}

export function getDocsNavigation(): DocsNavigationGroup[] {
  return [...docsCategoryConfig]
    .sort((a, b) => a.order - b.order)
    .map((category) => {
      const docs = getAllDocs()
        .filter((doc) => normalizeToken(doc.category) === normalizeToken(category.id))
        .map((doc) => ({
          title: doc.title,
          summary: doc.summary,
          href: getDocPath(doc),
          category: doc.category,
          slug: doc.slug,
        }));

      return {
        id: category.id,
        title: category.title,
        description: category.description,
        docs,
      };
    });
}

export function getCategoryById(id: string): DocsCategory | null {
  const normalizedId = normalizeToken(id);
  for (const category of docsCategoryConfig) {
    if (normalizeToken(category.id) === normalizedId) {
      return category;
    }
  }
  return null;
}

export function getDocBySlugParts(slugParts: string[]): DocsDoc | null {
  const normalizedParts = slugParts
    .flatMap((part) => part.split('/'))
    .map((part) => normalizeToken(part))
    .filter(Boolean);

  if (normalizedParts.length < 2) {
    return null;
  }

  const categoryPart = normalizedParts[0];
  const slugPart = normalizedParts.slice(1).join('/');

  for (const doc of getAllDocs()) {
    if (normalizeToken(doc._meta.path) === `${categoryPart}/${slugPart}`) {
      return doc;
    }
  }

  return null;
}

export function getDocHeadings(doc: DocsDoc): DocsHeading[] {
  return doc.headings;
}

export function getDocNeighbors(doc: DocsDoc): { prev: DocsDoc | null; next: DocsDoc | null } {
  const docs = getAllDocs();
  const index = docs.findIndex((candidate) => normalizeToken(candidate._meta.path) === normalizeToken(doc._meta.path));

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? docs[index - 1] : null,
    next: index < docs.length - 1 ? docs[index + 1] : null,
  };
}

function normalizeCatchAllValue(value: RouteParamValue): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => entry.split('/'))
      .map((entry) => normalizeToken(entry))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('/')
      .map((entry) => normalizeToken(entry))
      .filter(Boolean);
  }

  return [];
}

export function normalizeDocRouteSlug(
  params: Record<string, RouteParamValue> | undefined | null
): string[] {
  if (!params) return [];

  const rawValue =
    params.slug ??
    params['[...slug]'] ??
    params['...slug'] ??
    params['slug[]'] ??
    params[':slug'] ??
    null;

  return normalizeCatchAllValue(rawValue);
}

export function getDocSections(doc: DocsDoc): DocsDocSection[] {
  return doc.sections;
}
