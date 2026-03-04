import { docsCategoryConfig } from './categories';
import { routingOverviewDoc } from './core-concepts/routing-overview';
import { firstStepsDoc } from './getting-started/first-steps';
import { architectureOfSimplicityDoc } from './introduction/architecture-of-simplicity';
import { theBeginningOfVistaDoc } from './introduction/the-beginning-of-vista';
import type { CollectedDoc, CollectedHeading, DocsDocSource } from './types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractHeadings(sections: DocsDocSource['sections']): CollectedHeading[] {
  const headings: CollectedHeading[] = [];
  const used = new Set<string>();

  for (const section of sections) {
    if (section.type !== 'heading') continue;
    const baseId = section.id ? slugify(section.id) : slugify(section.text);
    let id = baseId;
    let index = 2;
    while (used.has(id)) {
      id = `${baseId}-${index}`;
      index += 1;
    }
    used.add(id);
    headings.push({
      id,
      text: section.text,
      level: section.level,
    });
  }

  return headings;
}

const docsSource: DocsDocSource[] = [
  theBeginningOfVistaDoc,
  architectureOfSimplicityDoc,
  firstStepsDoc,
  routingOverviewDoc,
];

export const allDocs: CollectedDoc[] = docsSource.map((doc) => ({
  ...doc,
  _meta: {
    path: `${doc.category}/${doc.slug}`,
  },
  headings: extractHeadings(doc.sections),
}));

export { docsCategoryConfig };
export type { CollectedDoc, CollectedHeading, DocsCategoryConfig, DocsDocSection, DocsDocSource } from './types';
