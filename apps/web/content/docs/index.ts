import { docsCategoryConfig } from './categories';
import { createAndGenerateDoc } from './cli-workflow/create-and-generate';
import { apiRoutesVsTypedApiDoc } from './core-concepts/api-routes-vs-typed-api';
import { dynamicRoutesAndSlugsDoc } from './core-concepts/dynamic-routes-and-slugs';
import { routingOverviewDoc } from './core-concepts/routing-overview';
import { typedApiRuntimeFlowDoc } from './core-concepts/typed-api-runtime-flow';
import { packagePublishingDoc } from './deployment/package-publishing';
import { firstStepsDoc } from './getting-started/first-steps';
import { projectStructureDoc } from './getting-started/project-structure';
import { typedApiQuickstartDoc } from './getting-started/typed-api-quickstart';
import { architectureOfSimplicityDoc } from './introduction/architecture-of-simplicity';
import { theBeginningOfVistaDoc } from './introduction/the-beginning-of-vista';
import { projectFileStructureDoc } from './reference/project-file-structure';
import { typedClientReferenceDoc } from './reference/typed-client-reference';
import { vistaConfigReferenceDoc } from './reference/vista-config-reference';
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
  projectStructureDoc,
  typedApiQuickstartDoc,
  routingOverviewDoc,
  dynamicRoutesAndSlugsDoc,
  apiRoutesVsTypedApiDoc,
  typedApiRuntimeFlowDoc,
  createAndGenerateDoc,
  vistaConfigReferenceDoc,
  projectFileStructureDoc,
  typedClientReferenceDoc,
  packagePublishingDoc,
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
